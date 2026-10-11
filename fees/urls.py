from rest_framework.routers import DefaultRouter
from .views import FeeViewSet, PaymentViewSet

router = DefaultRouter()
router.register('payments', PaymentViewSet, basename='payment')
router.register('', FeeViewSet, basename='fee')

urlpatterns = router.urls