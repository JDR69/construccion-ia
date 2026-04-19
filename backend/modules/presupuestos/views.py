from rest_framework import permissions, viewsets

from .models import AuditoriaPresupuesto, Presupuesto, PresupuestoItem
from .serializers import (
    AuditoriaPresupuestoSerializer,
    PresupuestoItemSerializer,
    PresupuestoSerializer,
)


class PresupuestoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Presupuesto.objects.all().select_related("proyecto", "ambiente", "creado_por").order_by("-id")
    serializer_class = PresupuestoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(proyecto__idUsuario=self.request.user)
        proyecto_id = self.request.query_params.get("proyecto")
        if proyecto_id:
            qs = qs.filter(proyecto_id=proyecto_id)
        return qs


class PresupuestoItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = PresupuestoItem.objects.all().select_related("presupuesto", "material").order_by("id")
    serializer_class = PresupuestoItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(presupuesto__proyecto__idUsuario=self.request.user)
        presupuesto_id = self.request.query_params.get("presupuesto")
        if presupuesto_id:
            qs = qs.filter(presupuesto_id=presupuesto_id)
        return qs


class AuditoriaPresupuestoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = AuditoriaPresupuesto.objects.all().select_related("presupuesto", "usuario").order_by("-id")
    serializer_class = AuditoriaPresupuestoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(presupuesto__proyecto__idUsuario=self.request.user)
        presupuesto_id = self.request.query_params.get("presupuesto")
        if presupuesto_id:
            qs = qs.filter(presupuesto_id=presupuesto_id)
        return qs
