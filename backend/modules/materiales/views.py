from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Material
from .serializers import MaterialSerializer


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all().order_by("nombre")
    serializer_class = MaterialSerializer


class BuscarPreciosMaterialesView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        materiales = request.data.get("materiales", [])
        if not isinstance(materiales, list):
            return Response(
                {"error": "El campo 'materiales' debe ser una lista de strings."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from materials.services.scraper_service import buscar_precios
        except ModuleNotFoundError as exc:
            return Response(
                {
                    "error": "Dependencias de scraping no instaladas.",
                    "detalle": str(exc),
                    "accion": "Instala requirements.txt en tu entorno virtual.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        resultados = buscar_precios(materiales)
        return Response({"resultados": resultados}, status=status.HTTP_200_OK)
