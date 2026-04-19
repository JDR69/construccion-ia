from rest_framework import viewsets

from .models import AuditoriaPresupuesto, Presupuesto, PresupuestoItem
from .serializers import (
    AuditoriaPresupuestoSerializer,
    PresupuestoItemSerializer,
    PresupuestoSerializer,
)


class PresupuestoViewSet(viewsets.ModelViewSet):
    queryset = Presupuesto.objects.all().select_related("proyecto", "ambiente", "creado_por").order_by("-id")
    serializer_class = PresupuestoSerializer


class PresupuestoItemViewSet(viewsets.ModelViewSet):
    queryset = PresupuestoItem.objects.all().select_related("presupuesto", "material").order_by("id")
    serializer_class = PresupuestoItemSerializer


class AuditoriaPresupuestoViewSet(viewsets.ModelViewSet):
    queryset = AuditoriaPresupuesto.objects.all().select_related("presupuesto", "usuario").order_by("-id")
    serializer_class = AuditoriaPresupuestoSerializer
