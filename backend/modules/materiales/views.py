from rest_framework import viewsets

from .models import Material
from .serializers import MaterialSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by("nombre")
    serializer_class = MaterialSerializer
