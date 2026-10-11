from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Attendance
from .serializers import AttendanceSerializer, BulkAttendanceMarkSerializer
from accounts.permissions import IsAdminOrReceptionistOrEmployee


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrReceptionistOrEmployee]

    def get_queryset(self):
      qs = super().get_queryset()
      student_id = self.request.query_params.get('student')
      course_id = self.request.query_params.get('course')
      date_from = self.request.query_params.get('date_from')
      date_to = self.request.query_params.get('date_to')
      reg_number = self.request.query_params.get('registration_number')

      if self.request.user.role == 'employee':
          employee = getattr(self.request.user, 'employee', None)
          if employee and employee.assigned_course_id:
              qs = qs.filter(course_id=employee.assigned_course_id)
          else:
              qs = qs.none()

      if student_id:
          qs = qs.filter(student_id=student_id)
      if course_id:
          qs = qs.filter(course_id=course_id)
      if date_from:
          qs = qs.filter(date__gte=date_from)
      if date_to:
            qs = qs.filter(date__lte=date_to)
      if reg_number:
          qs = qs.filter(student__registration_number__icontains=reg_number)
      return qs

    def perform_create(self, serializer):
        serializer.save(marked_by=self.request.user)


class BulkMarkAttendanceView(APIView):
    permission_classes = [IsAdminOrReceptionistOrEmployee]

    def post(self, request):
        serializer = BulkAttendanceMarkSerializer(data=request.data)
        def post(self, request):
         if request.user.role == 'employee':
             employee = getattr(request.user, 'employee', None)
             if not employee or not employee.assigned_course_id:
                 return Response({"detail": "No course assigned to you."}, status=status.HTTP_403_FORBIDDEN)
             if str(request.data.get('course')) != str(employee.assigned_course_id):
                 return Response({"detail": "You can only mark attendance for your assigned course."}, status=status.HTTP_403_FORBIDDEN)

        serializer = BulkAttendanceMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        course = serializer.validated_data['course']
        date = serializer.validated_data['date']
        entries = serializer.validated_data['entries']

        results = []
        for entry in entries:
            obj, created = Attendance.objects.update_or_create(
                student_id=entry['student'],
                course_id=course,
                date=date,
                defaults={'status': entry['status'], 'marked_by': request.user},
            )
            results.append({
                "student": obj.student_id,
                "status": obj.status,
                "created": created,
            })

        return Response({"detail": "Attendance marked.", "results": results}, status=status.HTTP_200_OK)