from rest_framework.routers import DefaultRouter
from .views import ClientQueryViewSet

router = DefaultRouter()
router.register('', ClientQueryViewSet, basename='clientquery')

urlpatterns = router.urls
