import base64
import io
import logging
from typing import Any

from django.conf import settings

from .gemini_service import (
    GeminiParseResult,
    GeminiServiceError,
    SYSTEM_PROMPT,
    _extract_json_array,
    _validate_vector_data,
)


logger = logging.getLogger(__name__)


def _pil_to_data_url(image_pil) -> str:
    buf = io.BytesIO()
    # JPEG reduce MUCHO el tamaño vs PNG (data URL), evitando errores por payload grande.
    # Para planos/fotos de celular, quality 80 suele ser suficiente.
    image_pil.save(buf, format="JPEG", quality=80, optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def procesar_plano_con_openai(*, image_pil) -> GeminiParseResult:
    """Procesa una imagen con OpenAI Vision y devuelve vector_data como array JSON validado."""

    api_key = str(getattr(settings, "OPENAI_API_KEY", "") or "").strip()
    if not api_key:
        raise GeminiServiceError("OPENAI_API_KEY no está configurada en el backend.")

    model = str(getattr(settings, "OPENAI_MODEL", "gpt-4o-mini") or "").strip()
    if not model:
        model = "gpt-4o-mini"

    try:
        from openai import OpenAI
    except Exception as e:
        raise GeminiServiceError(
            "Dependencia openai no instalada en el backend. Agrega 'openai' a requirements.txt."
        ) from e

    client = OpenAI(api_key=api_key)

    prompt = (
        SYSTEM_PROMPT
        + "\n\n"
        + "Instrucción final: devuelve SOLO un array JSON válido (sin markdown, sin texto adicional). "
        + "No uses comas finales. Cierra el array con ']'. Si no detectas nada, devuelve []."
    )

    data_url = _pil_to_data_url(image_pil)

    try:
        # API Responses (OpenAI): multimodal con input_text + input_image
        resp = client.responses.create(
            model=model,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": data_url},
                    ],
                }
            ],
        )

        # SDK: output_text agrega el texto concatenado de salidas
        raw_text: Any = getattr(resp, "output_text", None)
        if not raw_text:
            # fallback defensivo por si cambia la forma
            raw_text = str(resp)

        raw = str(raw_text)
        parsed = _extract_json_array(raw)
        vector_data = _validate_vector_data(parsed)
        return GeminiParseResult(vector_data=vector_data, raw_text=raw)

    except GeminiServiceError:
        raise
    except Exception as e:
        logger.exception("Fallo OpenAI Vision procesando plano")
        if getattr(settings, "DEBUG", False):
            msg = f"No se pudo procesar el plano con OpenAI. (model={model}) ({type(e).__name__}: {e})"
        else:
            msg = "No se pudo procesar el plano con IA. Intenta nuevamente."
        raise GeminiServiceError(msg) from e
