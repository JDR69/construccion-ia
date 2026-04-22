from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .services.gemini_service import GeminiServiceError, procesar_plano_con_gemini

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

    @action(
        detail=True,
        methods=["post"],
        url_path="procesar-ia",
        parser_classes=[MultiPartParser, FormParser],
    )
    def procesar_ia(self, request, pk=None):
        plano = self.get_object()

        upload = request.FILES.get("file") or request.FILES.get("image")
        if not upload:
            return Response(
                {"detail": "Debes enviar un archivo en multipart/form-data con el campo 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        max_mb = 10
        if getattr(upload, "size", 0) and upload.size > max_mb * 1024 * 1024:
            return Response(
                {"detail": f"La imagen es demasiado grande (máximo {max_mb}MB)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from PIL import Image
        except Exception:
            return Response(
                {"detail": "Pillow no está instalado en el backend."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            img = Image.open(upload)
            img = img.convert("RGB")

            # Reducción segura para evitar inputs enormes
            max_side = 1600
            if max(img.size) > max_side:
                img.thumbnail((max_side, max_side))

            result = procesar_plano_con_gemini(image_pil=img)
            plano.datos_vectoriales = result.vector_data
            plano.save(update_fields=["datos_vectoriales", "actualizado_en"])

            return Response(result.vector_data, status=status.HTTP_200_OK)

        except GeminiServiceError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"detail": "Error inesperado procesando la imagen."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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
