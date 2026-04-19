from django.db import models


class Usuario(models.Model):
    idUsuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=40)
    apellido = models.CharField(max_length=40)
    correo = models.EmailField(max_length=50, unique=True)
    password = models.CharField(max_length=150)
    fechaNacimiento = models.DateField()

    class Meta:
        db_table = "Usuario"

    def __str__(self) -> str:
        return f"{self.nombre} {self.apellido}".strip()


class Proyecto(models.Model):
    idProyecto = models.AutoField(primary_key=True)
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        db_column="idUsuario",
        related_name="proyectos",
    )
    titulo = models.CharField(max_length=100)
    descripcion = models.CharField(max_length=250)
    fechaCreacion = models.DateField()

    class Meta:
        db_table = "Proyecto"

    def __str__(self) -> str:
        return self.titulo


class Planos(models.Model):
    idPlano = models.AutoField(primary_key=True)
    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.CASCADE,
        db_column="idProyecto",
        related_name="planos",
    )
    archivo = models.TextField()
    estado = models.CharField(max_length=50)
    datosVectoriales = models.JSONField(null=True, blank=True)
    fechaSubida = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Planos"


class Ambientes(models.Model):
    idAmbiente = models.AutoField(primary_key=True)
    plano = models.ForeignKey(
        Planos,
        on_delete=models.CASCADE,
        db_column="idPlano",
        related_name="ambientes",
    )
    nombre = models.CharField(max_length=100)
    areaM2 = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = "Ambientes"


class Materiales(models.Model):
    idMaterial = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=150)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    unidad = models.CharField(max_length=50)

    class Meta:
        db_table = "Materiales"

    def __str__(self) -> str:
        return self.nombre


class Presupuesto(models.Model):
    idPresupuesto = models.AutoField(primary_key=True)
    plano = models.ForeignKey(
        Planos,
        on_delete=models.CASCADE,
        db_column="idPlano",
        related_name="presupuestos",
    )
    costoTotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fechaGeneracion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "Presupuesto"


class ItemsPresupuesto(models.Model):
    idItemsPresupuesto = models.AutoField(primary_key=True)
    presupuesto = models.ForeignKey(
        Presupuesto,
        on_delete=models.CASCADE,
        db_column="idPresupuesto",
        related_name="items",
    )
    material = models.ForeignKey(
        Materiales,
        on_delete=models.PROTECT,
        db_column="idMaterial",
        related_name="items_presupuesto",
    )
    cantidadCalculada = models.DecimalField(max_digits=10, decimal_places=2)
    precioUnitario = models.DecimalField(max_digits=10, decimal_places=2)
    subTotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "itemsPresupuesto"


class AlertasAuditoria(models.Model):
    idAlertasAuditoria = models.AutoField(primary_key=True)
    presupuesto = models.ForeignKey(
        Presupuesto,
        on_delete=models.CASCADE,
        db_column="idPresupuesto",
        related_name="alertas_auditoria",
    )
    tipo = models.CharField(max_length=50)
    mensaje = models.TextField()
    fechaAnalisis = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "alertasAuditoria"
