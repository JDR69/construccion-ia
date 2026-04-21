import logging
import os
import time
from collections.abc import Callable

from materials.services.utils.normalizer import normalizar_material

logger = logging.getLogger(__name__)

DELAY_ENTRE_REQUESTS = float(os.getenv("SCRAPER_DELAY_SECONDS", "0"))
TIMEOUT_REQUEST = int(os.getenv("SCRAPER_TIMEOUT_SECONDS", "8"))


def _obtener_scrapers() -> tuple[Callable[[str, int], list[dict]], ...]:
    # Import diferido para no bloquear el arranque de Django si falta requests/bs4.
    from materials.services.scrapers.scraper_ejemplo1 import scraper_ejemplo1
    from materials.services.scrapers.scraper_ejemplo2 import scraper_ejemplo2

    return (scraper_ejemplo1, scraper_ejemplo2)


def buscar_precios(materiales: list[str]) -> dict[str, list[dict]]:
    """Busca precios por material en las dos fuentes configuradas."""
    resultados_por_material: dict[str, list[dict]] = {}
    scrapers = _obtener_scrapers()

    for material in materiales:
        if not isinstance(material, str) or not material.strip():
            logger.warning("Material invalido omitido: %s", material)
            continue

        nombre_material = normalizar_material(material)
        resultados_por_material.setdefault(nombre_material, [])

        for scraper in scrapers:
            try:
                resultados = scraper(nombre_material, TIMEOUT_REQUEST)
                resultados_por_material[nombre_material].extend(resultados)
            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "Error en scraper %s para %s: %s",
                    scraper.__name__,
                    nombre_material,
                    exc,
                )

            if DELAY_ENTRE_REQUESTS > 0:
                time.sleep(DELAY_ENTRE_REQUESTS)

    for material, lista in resultados_por_material.items():
        lista.sort(key=lambda item: item.get("precio", 0))

    return resultados_por_material
