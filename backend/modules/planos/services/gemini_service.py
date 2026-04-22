import json
import ast
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from django.conf import settings


@dataclass
class GeminiParseResult:
    vector_data: List[Dict[str, Any]]
    raw_text: str


class GeminiServiceError(Exception):
    """Errores controlados del servicio Gemini (para devolver 4xx al frontend)."""


SYSTEM_PROMPT = (
    "Actúa como un arquitecto experto. Analiza esta imagen de un plano y extrae la geometría. "
    "Devuelve ÚNICAMENTE un array JSON válido sin formato markdown. "
    "Formato esperado: "
    "[{\"id\": \"m1\", \"tipo\": \"muro\", \"x\": 0, \"y\": 0, \"longitud\": 300, \"grosor\": 15, \"orientacion\": \"horizontal\"}, "
    "{\"id\": \"p1\", \"tipo\": \"puerta\", \"x\": 100, \"y\": 0, \"ancho\": 90, \"rotacion\": 0}]. "
    "Escala aprox a pixeles."
)


_ALLOWED_TIPOS = {"muro", "puerta", "ventana"}


def _extract_code_fence_payload(s: str) -> Optional[str]:
    # Busca el primer bloque ```...``` y devuelve su contenido.
    start = s.find("```")
    if start == -1:
        return None
    end = s.find("```", start + 3)
    if end == -1:
        return None

    inner = s[start + 3 : end]
    # Soporta ```json\n...```
    inner = inner.lstrip()
    if inner.lower().startswith("json"):
        inner = inner[4:]
    return inner.strip()


def _repair_truncated_json_array(s: str) -> Optional[str]:
    """Repara casos comunes: array que termina en coma y/o sin cerrar ']' (respuesta cortada)."""
    if not isinstance(s, str):
        return None
    t = s.strip()
    if not t.startswith("["):
        return None

    # Quita cualquier cosa antes del primer '[' (por si hay texto)
    start = t.find("[")
    t = t[start:]

    # Elimina paréntesis finales accidentales
    t = re.sub(r"\)+\s*$", "", t)

    # Quita comas colgantes antes de cierre y al final
    t = re.sub(r",\s*([\]}])", r"\1", t)
    t = re.sub(r",\s*$", "", t)

    # Si no cierra el array pero parece terminar en '}' o ']' agregamos cierre.
    if "]" not in t:
        tt = t.rstrip()
        if tt.endswith("}"):
            t = tt + "]"
        elif tt.endswith("]"):
            t = tt
        else:
            # Si termina en coma ya la quitamos; intentamos cerrar igual.
            t = tt + "]"

    return t


def _salvage_partial_json_array(s: str) -> Optional[str]:
    """Si el array está truncado dentro de un objeto, conserva elementos completos."""
    if not isinstance(s, str):
        return None
    t = s.strip()
    if not t.startswith("["):
        return None

    last_obj_end = t.rfind("}")
    if last_obj_end == -1:
        return None

    cut = t[: last_obj_end + 1]
    # Quita comas colgantes al final del array parcial
    cut = re.sub(r",\s*$", "", cut.strip())
    return cut + "]"


def _extract_balanced_slice(s: str, open_ch: str, close_ch: str) -> Optional[str]:
    """Extrae el primer bloque balanceado ([], {}) ignorando brackets dentro de strings."""
    start = s.find(open_ch)
    if start == -1:
        return None

    depth = 0
    in_string = False
    string_quote = ""
    escape = False
    for i in range(start, len(s)):
        ch = s[i]

        if in_string:
            if escape:
                escape = False
                continue
            if ch == "\\":
                escape = True
                continue
            if ch == string_quote:
                in_string = False
                string_quote = ""
            continue

        if ch in ('"', "'"):
            in_string = True
            string_quote = ch
            continue

        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return s[start : i + 1]

    return None


def _unwrap_to_list(obj: Any) -> Any:
    if isinstance(obj, list):
        return obj
    if isinstance(obj, dict):
        for key in ("vector_data", "items", "data", "elements", "result", "shapes"):
            val = obj.get(key)
            if isinstance(val, list):
                return val
    return obj


def _select_gemini_model_name(genai) -> str:
    forced = str(getattr(settings, "GEMINI_MODEL", "") or "").strip()
    if forced:
        return forced

    preferred = [
        "models/gemini-2.5-flash",
        "models/gemini-2.0-flash",
        "models/gemini-flash-latest",
        "models/gemini-2.0-flash-lite",
        "models/gemini-pro-latest",
    ]

    try:
        available: List[str] = []
        for m in genai.list_models():
            name = str(getattr(m, "name", "") or "")
            methods = set(getattr(m, "supported_generation_methods", []) or [])
            if name and "generateContent" in methods:
                available.append(name)

        for p in preferred:
            if p in available:
                return p

        for name in available:
            if name.startswith("models/gemini"):
                return name

        if available:
            return available[0]
    except Exception:
        pass

    # Fallback conservador si list_models falla.
    return "models/gemini-2.0-flash"


def _extract_json_array(text: str) -> Any:
    """Extrae el primer array JSON del texto (si Gemini añade texto extra)."""
    if not isinstance(text, str):
        raise GeminiServiceError("Respuesta inválida de Gemini (no es texto)")

    s = text.strip()

    # Si viene en bloque ```json ...```, usamos solo el contenido.
    fenced = _extract_code_fence_payload(s)
    if fenced:
        s = fenced

    # Reparación rápida (coma final / falta cierre).
    repaired = _repair_truncated_json_array(s)
    if repaired:
        s = repaired

    # Caso ideal: ya es JSON.
    try:
        return _unwrap_to_list(json.loads(s))
    except Exception:
        pass

    # Fallback seguro: a veces Gemini devuelve formato tipo Python (comillas simples).
    try:
        literal = ast.literal_eval(s)
        return _unwrap_to_list(literal)
    except Exception:
        pass

    # Salvataje: si parece truncado dentro de un objeto, recortamos a lo último completo.
    salvaged = _salvage_partial_json_array(s)
    if salvaged:
        try:
            return _unwrap_to_list(json.loads(salvaged))
        except Exception:
            try:
                return _unwrap_to_list(ast.literal_eval(salvaged))
            except Exception:
                pass

    # Intento: encontrar el primer bloque balanceado [ ... ] o { ... }.
    candidate = _extract_balanced_slice(s, "[", "]")
    if candidate is None:
        candidate = _extract_balanced_slice(s, "{", "}")
    if candidate is None:
        # Último intento: si inicia con '[' asumimos truncado y reparamos.
        repaired2 = _repair_truncated_json_array(s)
        if repaired2:
            candidate = repaired2
    if candidate and isinstance(candidate, str) and candidate.strip().startswith("["):
        salvaged2 = _salvage_partial_json_array(candidate)
        if salvaged2:
            candidate = salvaged2
    if candidate is None:
        raise GeminiServiceError(
            "La IA no devolvió un JSON reconocible. Intenta con una imagen más nítida o recorta el plano."
        )

    try:
        return _unwrap_to_list(json.loads(candidate))
    except Exception as e:
        try:
            literal = ast.literal_eval(candidate)
            return _unwrap_to_list(literal)
        except Exception:
            pass

        raise GeminiServiceError(
            "La IA devolvió JSON inválido. Intenta con otra imagen o recorta el plano."
        ) from e


def _coerce_number(v: Any) -> Optional[float]:
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).strip())
    except Exception:
        return None


def _sanitize_vector_item(item: Any, idx: int) -> Dict[str, Any]:
    if not isinstance(item, dict):
        raise GeminiServiceError(f"Elemento #{idx + 1} no es un objeto JSON")

    tipo = str(item.get("tipo") or "").strip().lower()
    if tipo not in _ALLOWED_TIPOS:
        raise GeminiServiceError(
            f"Elemento #{idx + 1}: 'tipo' inválido (esperado: muro, puerta o ventana)"
        )

    out: Dict[str, Any] = {
        "id": str(item.get("id") or f"{tipo[0]}{idx+1}"),
        "tipo": tipo,
    }

    # Coordenadas base
    x = _coerce_number(item.get("x"))
    y = _coerce_number(item.get("y"))
    if x is None or y is None:
        raise GeminiServiceError(f"Elemento #{idx + 1}: faltan 'x'/'y' numéricos")
    out["x"] = x
    out["y"] = y

    # Campos esperados (tolerante): muro usa longitud/grosor/orientacion o width/height.
    if tipo == "muro":
        longitud = _coerce_number(item.get("longitud"))
        grosor = _coerce_number(item.get("grosor"))
        orientacion = str(item.get("orientacion") or "").strip().lower()

        width = _coerce_number(item.get("width"))
        height = _coerce_number(item.get("height"))

        if width is not None and height is not None:
            out["width"] = width
            out["height"] = height
        elif longitud is not None and grosor is not None:
            # Convertimos a width/height para el canvas (horizontal por defecto)
            if orientacion not in {"horizontal", "vertical"}:
                orientacion = "horizontal"
            out["width"] = longitud if orientacion == "horizontal" else grosor
            out["height"] = grosor if orientacion == "horizontal" else longitud
        else:
            raise GeminiServiceError(
                f"Elemento #{idx + 1}: muro requiere width/height o longitud/grosor"
            )

    else:
        # puerta/ventana: usamos ancho (y opcional alto) o width/height
        width = _coerce_number(item.get("width"))
        height = _coerce_number(item.get("height"))
        ancho = _coerce_number(item.get("ancho"))
        alto = _coerce_number(item.get("alto"))

        if width is not None and height is not None:
            out["width"] = width
            out["height"] = height
        elif ancho is not None:
            out["width"] = ancho
            out["height"] = alto if alto is not None else 15.0
        else:
            raise GeminiServiceError(
                f"Elemento #{idx + 1}: {tipo} requiere width/height o ancho"
            )

        rot = _coerce_number(item.get("rotacion"))
        if rot is not None:
            out["rotation"] = rot

    return out


def _validate_vector_data(data: Any) -> List[Dict[str, Any]]:
    if not isinstance(data, list):
        raise GeminiServiceError("La IA no devolvió un array JSON")
    if len(data) == 0:
        raise GeminiServiceError(
            "La IA no detectó geometría. Intenta con una imagen con mayor contraste."
        )

    sanitized: List[Dict[str, Any]] = []
    for idx, it in enumerate(data):
        sanitized.append(_sanitize_vector_item(it, idx))
    return sanitized


def procesar_plano_con_gemini(*, image_pil) -> GeminiParseResult:
    """Llama a Gemini multimodal y devuelve datos vectoriales como array JSON validado."""
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise GeminiServiceError(
            "GEMINI_API_KEY no está configurada en el backend."
        )

    try:
        import google.generativeai as genai
    except Exception as e:
        raise GeminiServiceError(
            "Dependencia google-generativeai no instalada en el backend."
        ) from e

    genai.configure(api_key=api_key)

    model_name = _select_gemini_model_name(genai)
    raw = ""

    try:
        model = genai.GenerativeModel(model_name, system_instruction=SYSTEM_PROMPT)

        # Prompt del usuario (minimalista): el system prompt ya es estricto.
        resp = model.generate_content(
            [
                "Devuelve SOLO un array JSON válido (sin markdown). No uses comas finales. Cierra el array con ']'.",
                image_pil,
            ],
            generation_config={
                "temperature": 0.0,
                "top_p": 0.1,
                "max_output_tokens": 4096,
                "response_mime_type": "application/json",
            },
        )

        text = getattr(resp, "text", None)
        if not text:
            raise GeminiServiceError(
                "Gemini no devolvió texto. Intenta con otra imagen."
            )

        raw = str(text)
        parsed = _extract_json_array(raw)
        vector_data = _validate_vector_data(parsed)
        return GeminiParseResult(vector_data=vector_data, raw_text=raw)

    except GeminiServiceError as e:
        if getattr(settings, "DEBUG", False):
            cleaned = (raw or "").strip().replace("\r", " ").replace("\n", " ")
            start_preview = cleaned[:500]
            end_preview = cleaned[-300:] if len(cleaned) > 300 else cleaned
            raise GeminiServiceError(
                f"{e} (model={model_name}) (len={len(raw)}) (start={start_preview}) (end={end_preview})"
            ) from e
        raise
    except Exception as e:
        # En DEBUG devolvemos un hint del error real (sin exponer secretos)
        if getattr(settings, "DEBUG", False):
            msg = f"No se pudo procesar el plano con IA. (model={model_name}) ({type(e).__name__}: {e})"
        else:
            msg = "No se pudo procesar el plano con IA. Intenta nuevamente."
        raise GeminiServiceError(msg) from e
