from rest_framework import viewsets
from .models import Client, ClientPayment
from .serializers import ClientSerializer, ClientPaymentSerializer, EmployeeProjectSerializer
from accounts.permissions import IsAdminOrReceptionist, IsEmployee
from rest_framework.views import APIView
from rest_framework.response import Response


class EmployeeProjectListView(APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({"detail": "No employee record linked."}, status=404)
        projects = Client.objects.filter(assigned_employee=employee).order_by('-created_at')
        return Response(EmployeeProjectSerializer(projects, many=True).data)


class MarkProjectCompleteView(APIView):
    permission_classes = [IsEmployee]

    def post(self, request, pk):
        employee = getattr(request.user, 'employee', None)
        if not employee:
            return Response({"detail": "No employee record linked."}, status=404)
        try:
            client = Client.objects.get(pk=pk, assigned_employee=employee)
        except Client.DoesNotExist:
            return Response({"detail": "Project not found."}, status=404)
        client.project_status = 'completed'
        client.save()
        return Response({"detail": "Project marked as completed."})


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-created_at')
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrReceptionist]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ClientPaymentViewSet(viewsets.ModelViewSet):
    queryset = ClientPayment.objects.all()
    serializer_class = ClientPaymentSerializer
    permission_classes = [IsAdminOrReceptionist]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        client_id = self.request.query_params.get('client')
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)