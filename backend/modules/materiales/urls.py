from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MaterialViewSet

router = DefaultRouter()
router.include_format_suffixes = False
router.register(r"", MaterialViewSet, basename="materiales")

urlpatterns = [
    path("", include(router.urls)),
]
