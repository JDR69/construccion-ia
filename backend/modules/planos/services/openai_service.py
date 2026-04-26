import base64
import io
import logging
from typing import Any

from django.conf import settings

from .gemini_service import (
    GeminiParseResult,
    GeminiServiceError,
    construir_prompt_dinamico,
    _extract_json_array,
    _validate_vector_data,
)


logger = logging.getLogger(__name__)


def _pil_to_base64(image_pil) -> str:
    buf = io.BytesIO()
    image_pil.save(buf, format="JPEG", quality=80, optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii")


def procesar_plano_con_openai(*, image_pil=None, prompt_usuario: str = "", opciones=None, modo: str = "image") -> GeminiParseResult:
    """Procesa una imagen con OpenAI Vision y devuelve vector_data como array JSON validado."""

    api_key = str(getattr(settings, "OPENAI_API_KEY", "") or "").strip()
    if not api_key:
        raise GeminiServiceError("OPENAI_API_KEY no está configurada en el backend.")

    # Modelo debe soportar vision: gpt-4o, gpt-4o-mini o gpt-4turbo
    model = str(getattr(settings, "OPENAI_MODEL", "gpt-4o") or "").strip()
    if not model:
        model = "gpt-4o"
    
    # Si hay imagen, forzar modelo con vision
    if image_pil is not None and model != "gpt-4o":
        model = "gpt-4o"

    try:
        from openai import OpenAI
    except Exception as e:
        raise GeminiServiceError(
            "Dependencia openai no instalada en el backend. Agrega 'openai' a requirements.txt."
        ) from e

    client = OpenAI(api_key=api_key)

    modo = str(modo or "image").strip().lower()
    if modo not in {"image", "text", "hybrid"}:
        modo = "image"
    if modo in {"image", "hybrid"} and image_pil is None:
        raise GeminiServiceError("Debes enviar una imagen para modo image/hybrid.")

    prompt = construir_prompt_dinamico(
        modo=modo,
        prompt_usuario=prompt_usuario,
        opciones=opciones,
    )

    try:
        # Usamos Chat Completions API (mas estable para vision que responses.create)
        contenido: list[dict] = [{"type": "text", "text": prompt}]
        if image_pil is not None:
            b64_img = _pil_to_base64(image_pil)
            contenido.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"},
            })

        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": contenido}],
        )

        raw_text = str(resp.choices[0].message.content or "")
        if not raw_text:
            raise GeminiServiceError("OpenAI no devolvio texto en la respuesta.")

        parsed = _extract_json_array(raw_text)
        vector_data = _validate_vector_data(parsed)
        return GeminiParseResult(vector_data=vector_data, raw_text=raw_text)

    except GeminiServiceError:
        raise
    except Exception as e:
        logger.exception("Fallo OpenAI Vision procesando plano")
        if getattr(settings, "DEBUG", False):
            msg = f"No se pudo procesar el plano con OpenAI. (model={model}) ({type(e).__name__}: {e})"
        else:
            msg = "No se pudo procesar el plano con IA. Intenta nuevamente."
        raise GeminiServiceError(msg) from e
