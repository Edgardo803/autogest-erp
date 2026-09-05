"""
AutoGest ERP — Modelos de Compras y Proveedores
Compras de unidades, insumos y gestión de proveedores.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from core.models import ModeloBase


class Proveedor(ModeloBase):
    """
    Proveedor de la empresa. Puede ser Gran Proveedor (marca de autos)
    o proveedor de repuestos/insumos.
    """
    class TipoProveedor(models.TextChoices):
        GRAN_PROVEEDOR = 'GRAN', _('Gran Proveedor (Marca Oficial)')
        REPUESTOS      = 'REP',  _('Repuestos / Insumos')
        SERVICIOS      = 'SRV',  _('Servicios Generales')
        OTRO           = 'OTR',  _('Otro')

    codigo = models.CharField(max_length=10, unique=True, verbose_name=_('Código Proveedor'))
    razon_social = models.CharField(max_length=200, verbose_name=_('Razón Social'))
    nombre_comercial = models.CharField(max_length=200, blank=True)
    cif_nif = models.CharField(max_length=20, blank=True, verbose_name=_('CIF/NIF'))
    tipo = models.CharField(
        max_length=5, choices=TipoProveedor.choices, default=TipoProveedor.REPUESTOS
    )
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    condiciones_pago = models.TextField(
        blank=True, verbose_name=_('Condiciones de Pago habituales')
    )
    limite_credito = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Límite de Crédito (€)')
    )

    class Meta:
        verbose_name = _('Proveedor')
        verbose_name_plural = _('Proveedores')
        ordering = ['razon_social']

    def __str__(self):
        return f"[{self.codigo}] {self.razon_social}"

    def save(self, *args, **kwargs):
        if not self.codigo:
            ultimo = Proveedor.objects.order_by('-id').first()
            num = (ultimo.id + 1) if ultimo else 1
            prefijo = 'GP' if self.tipo == self.TipoProveedor.GRAN_PROVEEDOR else 'PR'
            self.codigo = f"{prefijo}{num:04d}"
        super().save(*args, **kwargs)


class CompraUnidad(ModeloBase):
    """
    Compra de una unidad vehicular al proveedor.
    Incluye plan de pagos, registro de cada pago, número de serie, etc.
    """
    class TipoCompra(models.TextChoices):
        NUEVA       = 'NUEVA',      _('Unidad Nueva')
        USADA       = 'USADA',      _('Unidad Usada')
        CONSIGNACION = 'CONSIG',    _('En Consignación')

    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name='ventas_realizadas'
    )
    unidad = models.ForeignKey(
        'inventario.Unidad', on_delete=models.PROTECT, related_name='compra'
    )
    tipo_compra = models.CharField(
        max_length=10, choices=TipoCompra.choices, default=TipoCompra.NUEVA
    )
    fecha_compra = models.DateField(verbose_name=_('Fecha de Compra'))
    precio_compra = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name=_('Precio de Compra (€)')
    )
    anticipo_pagado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Anticipo Pagado (€)')
    )
    saldo_financiado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Saldo Financiado (€)')
    )
    numero_factura_proveedor = models.CharField(
        max_length=50, blank=True, verbose_name=_('N° Factura del Proveedor')
    )

    class Meta:
        verbose_name = _('Compra de Unidad')
        verbose_name_plural = _('Compras de Unidades')

    def __str__(self):
        return f"Compra #{self.id} — {self.proveedor} — {self.unidad}"

    @property
    def saldo_pendiente(self):
        """Saldo real pendiente = precio − anticipo − cuotas ya pagadas."""
        cuotas_pagadas = sum(p.monto for p in self.pagos.filter(pagado=True))
        return self.precio_compra - self.anticipo_pagado - cuotas_pagadas


class PagoCompraUnidad(ModeloBase):
    """Cuotas/pagos de la compra de una unidad al proveedor."""
    compra = models.ForeignKey(
        CompraUnidad, on_delete=models.CASCADE, related_name='pagos'
    )
    numero_cuota = models.PositiveSmallIntegerField(verbose_name=_('N° Cuota'))
    fecha_vencimiento = models.DateField(verbose_name=_('Fecha de Vencimiento'))
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Monto (€)'))
    fecha_pago = models.DateField(null=True, blank=True)
    pagado = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Pago de Compra de Unidad')
        verbose_name_plural = _('Pagos de Compras de Unidades')
        ordering = ['compra', 'numero_cuota']
        unique_together = ['compra', 'numero_cuota']

    def __str__(self):
        return f"Cuota {self.numero_cuota} — Compra #{self.compra_id} — {self.monto}€"


class OrdenCompraInsumos(ModeloBase):
    """
    Orden de compra de repuestos/insumos a un proveedor.
    """
    class EstadoOrden(models.TextChoices):
        BORRADOR   = 'BORRADOR',  _('Borrador')
        ENVIADA    = 'ENVIADA',   _('Enviada al Proveedor')
        RECIBIDA   = 'RECIBIDA',  _('Recibida')
        CANCELADA  = 'CANCELADA', _('Cancelada')

    proveedor = models.ForeignKey(
        Proveedor, on_delete=models.PROTECT, related_name='ordenes_compra'
    )
    numero_orden = models.CharField(max_length=20, unique=True, blank=True)
    fecha_pedido = models.DateField(verbose_name=_('Fecha del Pedido'))
    fecha_recepcion = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=10, choices=EstadoOrden.choices, default=EstadoOrden.BORRADOR
    )
    numero_factura = models.CharField(max_length=50, blank=True)
    condiciones_pago = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = _('Orden de Compra (Insumos)')
        verbose_name_plural = _('Órdenes de Compra (Insumos)')

    def __str__(self):
        return f"OC#{self.numero_orden} — {self.proveedor} — {self.get_estado_display()}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    def save(self, *args, **kwargs):
        if not self.numero_orden:
            ultimo = OrdenCompraInsumos.objects.order_by('-id').first()
            num = (ultimo.id + 1) if ultimo else 1
            self.numero_orden = f"OC{num:05d}"
        super().save(*args, **kwargs)


class ItemOrdenCompra(ModeloBase):
    """Línea de detalle de una orden de compra de insumos."""
    orden = models.ForeignKey(
        OrdenCompraInsumos, on_delete=models.CASCADE, related_name='items'
    )
    repuesto = models.ForeignKey('inventario.Repuesto', on_delete=models.PROTECT)
    cantidad_pedida = models.PositiveSmallIntegerField()
    cantidad_recibida = models.PositiveSmallIntegerField(default=0)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _('Ítem de Orden de Compra')
        verbose_name_plural = _('Ítems de Órdenes de Compra')

    def __str__(self):
        return f"{self.repuesto.codigo} x{self.cantidad_pedida} — OC#{self.orden.numero_orden}"

    @property
    def subtotal(self):
        return self.cantidad_pedida * self.precio_unitario
