from rest_framework.routers import DefaultRouter
from .views import DailyLeadViewSet

router = DefaultRouter()
router.register('', DailyLeadViewSet, basename='dailyleads')

urlpatterns = router.urls