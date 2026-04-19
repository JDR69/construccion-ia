from django.contrib import admin

from .models import Material


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "categoria", "unidad", "precio_referencial")
    search_fields = ("nombre", "categoria")
