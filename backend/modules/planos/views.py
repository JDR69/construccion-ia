from rest_framework import viewsets

from .models import Ambiente, Plano
from .serializers import AmbienteSerializer, PlanoSerializer


class PlanoViewSet(viewsets.ModelViewSet):
    queryset = Plano.objects.all().select_related("proyecto").order_by("-id")
    serializer_class = PlanoSerializer


class AmbienteViewSet(viewsets.ModelViewSet):
    queryset = Ambiente.objects.all().select_related("plano").order_by("id")
    serializer_class = AmbienteSerializer
