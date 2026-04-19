from rest_framework import permissions, viewsets

from .models import Ambiente, Plano
from .serializers import AmbienteSerializer, PlanoSerializer


class PlanoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Plano.objects.all().select_related("proyecto").order_by("-id")
    serializer_class = PlanoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(proyecto__idUsuario=self.request.user)
        proyecto_id = self.request.query_params.get("proyecto")
        if proyecto_id:
            qs = qs.filter(proyecto_id=proyecto_id)
        return qs


class AmbienteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Ambiente.objects.all().select_related("plano").order_by("id")
    serializer_class = AmbienteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(plano__proyecto__idUsuario=self.request.user)
        plano_id = self.request.query_params.get("plano")
        if plano_id:
            qs = qs.filter(plano_id=plano_id)
        return qs
