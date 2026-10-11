from rest_framework import viewsets
from .models import Course
from .serializers import CourseSerializer
from accounts.permissions import IsAdmin, IsAdminOrReceptionist


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrReceptionist()]
        return [IsAdmin()]