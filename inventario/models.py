"""
AutoGest ERP — Modelos de Inventario
Stock de unidades (autos), repuestos e insumos.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import ModeloBase


class Marca(ModeloBase):
    nombre = models.CharField(max_length=100, unique=True)
    pais_origen = models.CharField(max_length=100, blank=True)

    class Meta:
        verbose_name = _('Marca')
        verbose_name_plural = _('Marcas')
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Modelo(ModeloBase):
    marca = models.ForeignKey(Marca, on_delete=models.CASCADE, related_name='modelos')
    nombre = models.CharField(max_length=100)
    año = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_('Año'))
    tipo = models.CharField(
        max_length=30,
        choices=[
            ('TURISMO', 'Turismo'), ('SUV', 'SUV'), ('FURGON', 'Furgón'),
            ('PICKUP', 'Pickup'), ('MOTO', 'Moto'), ('OTRO', 'Otro'),
        ],
        default='TURISMO'
    )

    class Meta:
        verbose_name = _('Modelo')
        verbose_name_plural = _('Modelos')
        unique_together = ['marca', 'nombre', 'año']

    def __str__(self):
        return f"{self.marca} {self.nombre} {self.año or ''}"


class Unidad(ModeloBase):
    """
    Unidad vehicular en stock — nueva, usada o en consignación.
    """
    class Estado(models.TextChoices):
        NUEVA         = 'NUEVA',        _('Nueva')
        USADA         = 'USADA',        _('Usada')
        CONSIGNACION  = 'CONSIGNACION', _('En Consignación')
        VENDIDA       = 'VENDIDA',      _('Vendida')
        RESERVADA     = 'RESERVADA',    _('Reservada')
        BAJA          = 'BAJA',         _('Dada de Baja')

    # Identificación de la unidad
    modelo = models.ForeignKey(Modelo, on_delete=models.PROTECT, related_name='unidades')
    numero_serie = models.CharField(
        max_length=50, unique=True, verbose_name=_('Número de Serie (Chasis)')
    )
    matricula = models.CharField(
        max_length=20, blank=True, verbose_name=_('Matrícula')
    )
    color = models.CharField(max_length=50, blank=True)
    kilometros = models.PositiveIntegerField(default=0, verbose_name=_('Kilómetros'))

    # Estado y precios
    estado = models.CharField(
        max_length=15, choices=Estado.choices, default=Estado.NUEVA
    )
    precio_costo = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name=_('Precio de Costo (€)')
    )
    precio_venta = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name=_('Precio de Venta (€)')
    )

    # Datos del proveedor (para nuevas y consignación)
    proveedor = models.ForeignKey(
        'compras.Proveedor', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='unidades_provistas'
    )
    fecha_ingreso = models.DateField(null=True, blank=True, verbose_name=_('Fecha de Ingreso'))
    fecha_venta = models.DateField(null=True, blank=True, verbose_name=_('Fecha de Venta'))

    class Meta:
        verbose_name = _('Unidad')
        verbose_name_plural = _('Unidades')

    def __str__(self):
        return f"{self.modelo} | Serie: {self.numero_serie} | {self.get_estado_display()}"


class CategoriaRepuesto(ModeloBase):
    nombre = models.CharField(max_length=100, unique=True)
    codigo = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name = _('Categoría de Repuesto')
        verbose_name_plural = _('Categorías de Repuesto')

    def __str__(self):
        return f"[{self.codigo}] {self.nombre}"


class Repuesto(ModeloBase):
    """
    Repuesto o insumo en stock. Código según doc: Filtro-Cod.F001, Aceite A001.
    """
    codigo = models.CharField(max_length=20, unique=True, verbose_name=_('Código'))
    descripcion = models.CharField(max_length=200, verbose_name=_('Descripción'))
    categoria = models.ForeignKey(
        CategoriaRepuesto, on_delete=models.PROTECT, related_name='repuestos'
    )
    stock_actual = models.PositiveIntegerField(default=0, verbose_name=_('Stock Actual'))
    stock_minimo = models.PositiveIntegerField(default=0, verbose_name=_('Stock Mínimo'))
    precio_costo = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    unidad_medida = models.CharField(
        max_length=20, default='unidad',
        verbose_name=_('Unidad de Medida')
    )

    class Meta:
        verbose_name = _('Repuesto / Insumo')
        verbose_name_plural = _('Repuestos / Insumos')
        ordering = ['codigo']

    def __str__(self):
        return f"[{self.codigo}] {self.descripcion}"

    @property
    def stock_bajo(self):
        return self.stock_actual <= self.stock_minimo
