from rest_framework import viewsets
from .models import ClientQuery
from .serializers import ClientQuerySerializer
from accounts.permissions import IsAdminOrReceptionist


class ClientQueryViewSet(viewsets.ModelViewSet):
    queryset = ClientQuery.objects.all()
    serializer_class = ClientQuerySerializer
    permission_classes = [IsAdminOrReceptionist]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
