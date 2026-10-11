from datetime import date, datetime

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdmin, IsAdminOrReceptionist, IsEmployee
from expenses.models import Expense
from notifications.models import Notification
from .models import Employee, EmployeeAttendance
from .serializers import EmployeeSerializer, EmployeeCreateLoginSerializer, EmployeeSelfSerializer

User = get_user_model()


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-created_at')
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrReceptionist()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='create-login', permission_classes=[IsAdmin])
    def create_login(self, request, pk=None):
        employee = self.get_object()
        if employee.user_id:
            return Response({"detail": "This employee already has login access."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EmployeeCreateLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data.get('email', ''),
            password=serializer.validated_data['password'],
            role='employee',
        )
        employee.user = user
        employee.save()
        return Response({"detail": "Login access granted.", "username": user.username}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='revoke-login', permission_classes=[IsAdmin])
    def revoke_login(self, request, pk=None):
        employee = self.get_object()
        if not employee.user_id:
            return Response({"detail": "This employee has no login access."}, status=status.HTTP_400_BAD_REQUEST)
        user = employee.user
        employee.user = None
        employee.save()
        user.delete()
        return Response({"detail": "Login access revoked."})


class EmployeeMeView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({"detail": "No employee record linked."}, status=status.HTTP_404_NOT_FOUND)
        return Response(EmployeeSelfSerializer(employee).data)

    def patch(self, request):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({"detail": "No employee record linked."}, status=status.HTTP_404_NOT_FOUND)
        serializer = EmployeeSelfSerializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RunPayrollView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        today = date.today()
        employees = Employee.objects.filter(status='active', salary__isnull=False, salary__gt=0)
        created_count = 0

        for emp in employees:
            already_paid = Expense.objects.filter(
                category='Salary', title=f"Salary - {emp.full_name}",
                date__year=today.year, date__month=today.month,
            ).exists()
            if already_paid:
                continue

            Expense.objects.create(
                title=f"Salary - {emp.full_name}",
                amount=emp.salary,
                date=today,
                category='Salary',
                description=f"Monthly salary payment for {emp.full_name} ({emp.designation})",
                created_by=request.user,
            )
            created_count += 1

        return Response({"detail": f"Payroll run complete. {created_count} salary expense(s) created."})


class EmployeeAttendanceView(APIView):
    permission_classes = [IsAdminOrReceptionist]

    def _parse_date(self, value):
        if not value:
            return date.today()
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            return None

    def get(self, request):
        day = self._parse_date(request.query_params.get('date'))
        if day is None:
            return Response({"detail": "Invalid date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        saved = {r.employee_id: r.status for r in EmployeeAttendance.objects.filter(date=day)}
        employees = Employee.objects.filter(status='active').order_by('full_name')
        data = [
            {
                "id": e.id,
                "full_name": e.full_name,
                "designation": e.designation,
                "department": e.department,
                "status": saved.get(e.id),
            }
            for e in employees
        ]
        return Response({"date": day.isoformat(), "employees": data})

    def post(self, request):
        day = self._parse_date(request.data.get('date'))
        if day is None:
            return Response({"detail": "Invalid date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        if day > date.today():
            return Response({"detail": "Cannot mark attendance for a future date."}, status=status.HTTP_400_BAD_REQUEST)

        records = request.data.get('records')
        if not isinstance(records, list) or not records:
            return Response({"detail": "No attendance records provided."}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = {'present', 'absent', 'leave'}
        latest = {}
        for item in records:
            if isinstance(item, dict) and item.get('status') in valid_statuses:
                latest[item.get('employee')] = item['status']

        employees = {e.id: e for e in Employee.objects.filter(id__in=list(latest.keys()))}
        existing = {
            r.employee_id: r
            for r in EmployeeAttendance.objects.filter(date=day, employee_id__in=list(employees.keys()))
        }

        to_notify = []
        saved_count = 0
        with transaction.atomic():
            for emp_id, new_status in latest.items():
                emp = employees.get(emp_id)
                if not emp:
                    continue
                record = existing.get(emp.id)
                previous_status = record.status if record else None

                if record:
                    record.status = new_status
                    record.marked_by = request.user
                    record.save()
                else:
                    EmployeeAttendance.objects.create(
                        employee=emp, date=day, status=new_status, marked_by=request.user
                    )
                saved_count += 1

                if new_status in ('absent', 'leave') and previous_status != new_status:
                    to_notify.append((emp, new_status))

            if to_notify:
                staff = list(User.objects.filter(role__in=['admin', 'receptionist']))
                notifications = []
                for emp, st in to_notify:
                    title = "Employee Absent" if st == 'absent' else "Employee on Leave"
                    label = "absent" if st == 'absent' else "on leave"
                    for user in staff:
                        notifications.append(Notification(
                            title=title,
                            message=f"{emp.full_name} is marked {label} on {day.strftime('%d %b %Y')}.",
                            notif_type='attendance',
                            recipient=user,
                        ))
                Notification.objects.bulk_create(notifications)

        return Response({
            "detail": f"Attendance saved for {saved_count} employee(s).",
            "notified": len(to_notify),
        })


class EmployeeAttendanceHistoryView(APIView):
    permission_classes = [IsAdminOrReceptionist]

    def get(self, request):
        from datetime import timedelta

        qs = EmployeeAttendance.objects.select_related('employee')

        day = request.query_params.get('date')
        employee_id = request.query_params.get('employee')

        if day:
            try:
                parsed = datetime.strptime(day, "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(date=parsed)

        if employee_id and employee_id.isdigit():
            qs = qs.filter(employee_id=int(employee_id))

        if not day and not employee_id:
            qs = qs.filter(date__gte=date.today() - timedelta(days=30))

        qs = qs.order_by('-date', 'employee__full_name')[:500]
        data = [
            {
                "id": r.id,
                "employee": r.employee_id,
                "employee_name": r.employee.full_name,
                "designation": r.employee.designation,
                "date": r.date.isoformat(),
                "status": r.status,
            }
            for r in qs
        ]
        return Response({"results": data})
