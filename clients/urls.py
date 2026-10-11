from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, ClientPaymentViewSet, EmployeeProjectListView, MarkProjectCompleteView

router = DefaultRouter()
router.register('payments', ClientPaymentViewSet, basename='client-payment')
router.register('', ClientViewSet, basename='client')

urlpatterns = [
    path('my-projects/', EmployeeProjectListView.as_view(), name='employee-projects'),
    path('my-projects/<int:pk>/complete/', MarkProjectCompleteView.as_view(), name='employee-project-complete'),
] + router.urls