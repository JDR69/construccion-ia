from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import UserViewSet

router = DefaultRouter()
router.include_format_suffixes = False
router.register(r"", UserViewSet, basename="usuarios")

urlpatterns = [
    path("", include(router.urls)),
]
