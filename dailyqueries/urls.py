from rest_framework.routers import DefaultRouter
from .views import DailyQueryViewSet

router = DefaultRouter()
router.register('', DailyQueryViewSet, basename='dailyquery')

urlpatterns = router.urls