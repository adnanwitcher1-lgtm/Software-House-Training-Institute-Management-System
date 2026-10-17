from django.shortcuts import render

# Create your views here.
from datetime import date, timedelta
from django.db.models import Sum, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from students.models import Student
from employees.models import Employee
from fees.models import Payment, Fee
from expenses.models import Expense
from dailyleads.models import DailyLead
from dailyqueries.models import ClientQuery
from clients.models import Client
from enrollments.models import Enrollment
from clients.models import ClientPayment
from accounts.permissions import IsEmployee
from attendance.models import Attendance
from clients.models import Client
import calendar
class DashboardStatsView(APIView):
    def get(self, request):
        today = date.today()

        total_leads = DailyLead.objects.count()
        client_queries_count = ClientQuery.objects.count()
        active_students = Enrollment.objects.filter(status='active').values('student').distinct().count()
        total_employees = Employee.objects.count()

        student_revenue = Payment.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        client_revenue = ClientPayment.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
        total_revenue = student_revenue + client_revenue
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0
        current_balance = total_revenue - total_expenses

        # Pending student fees: total fee - paid, per enrollment
        total_fee_amount = Fee.objects.aggregate(total=Sum('total_fee'))['total'] or 0
        pending_fee_amount = 0
        pending_fee_students = set()
        for fee in Fee.objects.select_related('enrollment').annotate(paid=Sum('payments__amount_paid')):
            remaining = fee.total_fee - (fee.paid or 0)
            if remaining > 0:
                pending_fee_amount += remaining
                pending_fee_students.add(fee.enrollment.student_id)

        revenue_expenses_chart = []
        for i in range(5, -1, -1):
            month_date = today.replace(day=1) - timedelta(days=i * 30)
            month_label = month_date.strftime('%b')
            month_student_rev = Payment.objects.filter(
               payment_date__year=month_date.year, payment_date__month=month_date.month
             ).aggregate(total=Sum('amount_paid'))['total'] or 0
            month_client_rev = ClientPayment.objects.filter(
               payment_date__year=month_date.year, payment_date__month=month_date.month
            ).aggregate(total=Sum('amount_paid'))['total'] or 0
            month_revenue = month_student_rev + month_client_rev
            month_expense = Expense.objects.filter(
                date__year=month_date.year, date__month=month_date.month
            ).aggregate(total=Sum('amount'))['total'] or 0
            revenue_expenses_chart.append({
                'month': month_label,
                'revenue': float(month_revenue),
                'expenses': float(month_expense),
            })

        expense_breakdown = list(
            Expense.objects.values('category').annotate(total=Sum('amount')).order_by('-total')
        )
        total_exp_sum = sum(e['total'] for e in expense_breakdown) or 1
        for e in expense_breakdown:
            e['percentage'] = round((float(e['total']) / float(total_exp_sum)) * 100)
            e['total'] = float(e['total'])

        recent_leads = list(
            DailyLead.objects.order_by('-created_at')[:3].values('full_name', 'course__name', 'reference', 'created_at')
        )

        upcoming_deadlines = []
        soon = today + timedelta(days=14)
        for c in Client.objects.filter(project_due_date__gte=today, project_due_date__lte=soon):
            upcoming_deadlines.append({
                'title': f"{c.project_name or c.name} - Final Delivery",
                'due_date': c.project_due_date,
            })
        for e in Enrollment.objects.filter(expected_end_date__gte=today, expected_end_date__lte=soon, status='active'):
            upcoming_deadlines.append({
                'title': f"{e.student.full_name}'s enrollment ending",
                'due_date': e.expected_end_date,
            })
        upcoming_deadlines.sort(key=lambda x: x['due_date'])

        return Response({
            'total_leads': total_leads,
            'client_queries_count': client_queries_count,
            'active_students': active_students,
            'total_employees': total_employees,
            'current_balance': float(current_balance),
            'total_income': float(total_revenue),
            'student_income': float(student_revenue),
            'client_income': float(client_revenue),
            'total_expenses': float(total_expenses),
            'pending_fee_amount': float(pending_fee_amount),
            'pending_fee_students': len(pending_fee_students),
            'revenue_expenses_chart': revenue_expenses_chart,
            'expense_breakdown': expense_breakdown,
            'recent_leads': recent_leads,
            'upcoming_deadlines': upcoming_deadlines[:5],
        })


    
class EmployeeDashboardStatsView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({"detail": "No employee record linked."}, status=404)

        today = date.today()
        course = employee.assigned_course

        students_count = 0
        enrollment_trend = []
        today_attendance = {'present': 0, 'absent': 0}

        if course:
            students_count = Enrollment.objects.filter(course=course, status='active').count()

            days_in_month = calendar.monthrange(today.year, today.month)[1]
            daily_counts = {i: 0 for i in range(1, days_in_month + 1)}
            month_enrollments = Enrollment.objects.filter(
                course=course, enrollment_date__year=today.year, enrollment_date__month=today.month
            ).values_list('enrollment_date', flat=True)
            for d in month_enrollments:
                daily_counts[d.day] += 1
            enrollment_trend = [{'day': day, 'count': cnt} for day, cnt in daily_counts.items()]

            today_present = Attendance.objects.filter(course=course, date=today, status='present').count()
            today_absent = Attendance.objects.filter(course=course, date=today, status='absent').count()
            today_attendance = {'present': today_present, 'absent': today_absent}

        pending_projects = Client.objects.filter(assigned_employee=employee).exclude(project_status='completed').count()
        completed_projects = Client.objects.filter(assigned_employee=employee, project_status='completed').count()

        return Response({
            'students': students_count,
            'pending_projects': pending_projects,
            'completed_projects': completed_projects,
            'enrollment_trend': enrollment_trend,
            'today_attendance': today_attendance,
        })
