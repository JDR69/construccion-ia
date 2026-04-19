from django.db import models


class Material(models.Model):
    nombre = models.CharField(max_length=200)
    categoria = models.CharField(max_length=120, blank=True)
    unidad = models.CharField(max_length=50, blank=True)
    precio_referencial = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre
