import re
from typing import Optional


def normalizar_material(material: str) -> str:
    """Normaliza el nombre del material para comparaciones y busqueda."""
    return material.strip().lower()


def normalizar_precio(texto: str) -> Optional[float]:
    """Convierte textos como 'Bs 1.250,50' o 'BOB 50' en float."""
    if not texto:
        return None

    limpio = texto.strip().replace("BOB", "").replace("Bs.", "").replace("Bs", "")
    limpio = limpio.replace(" ", "")

    coincidencia = re.search(r"-?[\d\.,]+", limpio)
    if not coincidencia:
        return None

    numero = coincidencia.group(0)

    # Soporta formatos: 1.234,56 | 1,234.56 | 1234.56 | 1234,56
    if "," in numero and "." in numero:
        if numero.rfind(",") > numero.rfind("."):
            numero = numero.replace(".", "").replace(",", ".")
        else:
            numero = numero.replace(",", "")
    elif "," in numero:
        numero = numero.replace(",", ".")

    try:
        return float(numero)
    except ValueError:
        return None
