from decimal import Decimal

from django.db import transaction

from modules.materiales.models import Material

from ..models import Presupuesto, PresupuestoItem

COEFICIENTES_BASE_M2 = [
    {"material": "cemento", "unidad": "bolsa", "cantidad_m2": Decimal("0.12")},
    {"material": "arena", "unidad": "m3", "cantidad_m2": Decimal("0.05")},
    {"material": "ladrillo", "unidad": "unidad", "cantidad_m2": Decimal("35")},
    {"material": "hierro", "unidad": "kg", "cantidad_m2": Decimal("4.2")},
    {"material": "pintura", "unidad": "litro", "cantidad_m2": Decimal("0.08")},
]

AJUSTE_POR_AMBIENTE = {
    "bano": {"cemento": Decimal("1.10"), "pintura": Decimal("0.90")},
    "baño": {"cemento": Decimal("1.10"), "pintura": Decimal("0.90")},
    "cocina": {"cemento": Decimal("1.05"), "hierro": Decimal("1.05")},
    "dormitorio": {"pintura": Decimal("1.15")},
}


def _obtener_material(nombre: str, unidad: str) -> Material:
    material, _ = Material.objects.get_or_create(
        nombre=nombre,
        defaults={"unidad": unidad},
    )
    if not material.unidad and unidad:
        material.unidad = unidad
        material.save(update_fields=["unidad", "actualizado_en"])
    return material


def _calcular_area_total(presupuesto: Presupuesto) -> Decimal:
    """Calcula el área total considerando todos los ambientes del proyecto."""
    presupuesto_obj = presupuesto
    proyecto = presupuesto_obj.proyecto
    
    if not proyecto:
        return Decimal("80")
    
    try:
        num_pisos = int(getattr(proyecto, 'num_pisos', 1) or 1)
    except Exception:
        num_pisos = 1
    
    # Si el presupuesto tiene un ambiente específico y este tiene área, la usamos
    if presupuesto_obj.ambiente and presupuesto_obj.ambiente.area_m2:
        area_ambiente = Decimal(str(presupuesto_obj.ambiente.area_m2))
        return area_ambiente * Decimal(str(max(num_pisos, 1)))
    
    # Calcular área total desde los ambientes del proyecto
    from modules.planos.models import Ambiente, Plano
    try:
        ambientes = Ambiente.objects.filter(plano__proyecto=proyecto)
    except Exception:
        ambientes = []
    
    area_total = Decimal("0")
    for amb in ambientes:
        if amb.area_m2 and amb.area_m2 > 0:
            area_total += Decimal(str(amb.area_m2))
    
    if area_total > 0:
        return area_total * Decimal(str(max(num_pisos, 1)))
    
    # Si no hay áreas calculadas en los ambientes, calcular por vectores en los planos del proyecto
    try:
        if presupuesto_obj.ambiente and presupuesto_obj.ambiente.plano:
            planos = [presupuesto_obj.ambiente.plano]
        else:
            planos = Plano.objects.filter(proyecto=proyecto)
            
        area_estimada = Decimal("0")
        areas_elementos = {
            'muro': Decimal('30'),    # ~3m x 10m
            'puerta': Decimal('1.8'),  # ~1.8m x 1m
            'ventana': Decimal('1.5'), # ~1.5m x 1m
        }
        
        for plano in planos:
            vector = plano.datos_vectoriales if isinstance(plano.datos_vectoriales, list) else []
            for elemento in vector:
                if isinstance(elemento, dict):
                    tipo = str(elemento.get('tipo', '')).lower()
                    if tipo in areas_elementos:
                        area_estimada += areas_elementos[tipo]
                        
        if area_estimada > 0:
            return area_estimada * Decimal(str(max(num_pisos, 1)))
    except Exception:
        pass
    
    # Si todo falla, usar un tamaño por defecto
    return Decimal("80")


def _factor_refinado(presupuesto: Presupuesto) -> Decimal:
    ambiente = presupuesto.ambiente
    if not ambiente or not ambiente.plano:
        return Decimal("1.00")

    plano = ambiente.plano
    vector = plano.datos_vectoriales if isinstance(plano.datos_vectoriales, list) else []
    if not vector:
        return Decimal("1.00")

    try:
        escala = Decimal(str(plano.escala_metros_por_pixel or 0.01))
    except Exception:  # noqa: BLE001
        escala = Decimal("0.01")

    muros = [item for item in vector if str(item.get("tipo") or "").lower() == "muro"]
    puertas = [item for item in vector if str(item.get("tipo") or "").lower() == "puerta"]
    ventanas = [item for item in vector if str(item.get("tipo") or "").lower() == "ventana"]

    longitud_muros = Decimal("0")
    for muro in muros:
        w = Decimal(str(muro.get("width") or 0))
        h = Decimal(str(muro.get("height") or 0))
        longitud_muros += max(w, h) * escala

    # Ajuste pequeño para aproximar complejidad de diseño.
    ajuste_muros = min(Decimal("0.25"), longitud_muros / Decimal("120"))
    ajuste_aperturas = min(Decimal("0.10"), Decimal(len(puertas) + len(ventanas)) * Decimal("0.005"))
    factor = Decimal("1.00") + ajuste_muros + ajuste_aperturas
    return min(Decimal("1.35"), factor).quantize(Decimal("0.01"))


def generar_items_presupuesto(
    presupuesto: Presupuesto,
    *,
    modo: str = "rapido",
    limpiar_existente: bool = True,
) -> dict:
    area_m2 = _calcular_area_total(presupuesto)
    if area_m2 <= 0:
        area_m2 = Decimal("80")

    tipo_ambiente = str(getattr(presupuesto.ambiente, "tipo", "") or "").strip().lower()
    ajustes = AJUSTE_POR_AMBIENTE.get(tipo_ambiente, {})

    factor_refinado = Decimal("1.00")
    if modo in {"refinado", "hibrido"}:
        factor_refinado = _factor_refinado(presupuesto)

    with transaction.atomic():
        if limpiar_existente:
            presupuesto.items.all().delete()

        creados = 0
        for base in COEFICIENTES_BASE_M2:
            nombre_material = base["material"]
            unidad = base["unidad"]
            coeficiente = base["cantidad_m2"]
            multiplicador = ajustes.get(nombre_material, Decimal("1.00"))

            cantidad = (area_m2 * coeficiente * multiplicador * factor_refinado).quantize(Decimal("0.01"))
            if cantidad <= 0:
                continue

            material = _obtener_material(nombre_material, unidad)
            precio_unitario = Decimal(str(material.precio_referencial or 0)).quantize(Decimal("0.01"))

            PresupuestoItem.objects.create(
                presupuesto=presupuesto,
                material=material,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
            )
            creados += 1

    return {
        "modo": modo,
        "area_m2": float(area_m2),
        "factor_refinado": float(factor_refinado),
        "items_creados": creados,
        "total_estimado": float(presupuesto.total),
    }
