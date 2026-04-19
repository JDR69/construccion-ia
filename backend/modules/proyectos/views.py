from rest_framework import viewsets

from .models import Proyecto
from .serializers import ProyectoSerializer


class ProyectoViewSet(viewsets.ModelViewSet):
    queryset = Proyecto.objects.all().select_related("propietario").order_by("-id")
    serializer_class = ProyectoSerializer
