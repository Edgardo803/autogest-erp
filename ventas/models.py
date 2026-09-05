"""
AutoGest ERP — Modelos de Ventas
Venta de unidades, servicios de taller y clientes.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal
from core.models import ModeloBase


class Cliente(ModeloBase):
    """
    Ficha del cliente. Código según doc: CL001 Juan Pérez.
    """
    codigo = models.CharField(max_length=10, unique=True, verbose_name=_('Código Cliente'))
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    dni_nie = models.CharField(max_length=15, blank=True, verbose_name=_('DNI/NIE'))
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)

    class Meta:
        verbose_name = _('Cliente')
        verbose_name_plural = _('Clientes')
        ordering = ['apellidos', 'nombre']

    def __str__(self):
        return f"[{self.codigo}] {self.apellidos}, {self.nombre}"

    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellidos}"

    def save(self, *args, **kwargs):
        """Auto-genera código si no existe."""
        if not self.codigo:
            ultimo = Cliente.objects.order_by('-id').first()
            num = (ultimo.id + 1) if ultimo else 1
            self.codigo = f"CL{num:04d}"
        super().save(*args, **kwargs)


class VentaUnidad(ModeloBase):
    """
    Venta de un vehículo. Incluye condiciones de pago y financiación.
    """
    class EstadoPago(models.TextChoices):
        PENDIENTE  = 'PENDIENTE', _('Pendiente')
        PARCIAL    = 'PARCIAL',   _('Pago Parcial')
        COMPLETO   = 'COMPLETO',  _('Pagado Completo')
        FINANCIADO = 'FINANCIADO',_('Financiado')

    # Relaciones principales
    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name='ventas_unidades'
    )
    unidad = models.OneToOneField(
        'inventario.Unidad', on_delete=models.PROTECT, related_name='venta'
    )
    vendedor = models.ForeignKey(
        'accounts.Usuario', on_delete=models.PROTECT,
        related_name='ventas_realizadas', verbose_name=_('Vendedor')
    )

    # Datos de la operación
    fecha_venta = models.DateField(verbose_name=_('Fecha de Venta'))
    precio_acordado = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name=_('Precio Acordado (€)')
    )
    anticipo = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Anticipo (€)')
    )
    monto_financiado = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Monto Financiado (€)')
    )
    estado_pago = models.CharField(
        max_length=15, choices=EstadoPago.choices, default=EstadoPago.PENDIENTE
    )
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = _('Venta de Unidad')
        verbose_name_plural = _('Ventas de Unidades')

    def __str__(self):
        return f"Venta #{self.id} — {self.cliente} — {self.unidad}"

    @property
    def saldo_pendiente(self):
        return self.precio_acordado - self.anticipo - self.monto_financiado

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Actualizar estado de la unidad vendida
        from inventario.models import Unidad
        self.unidad.estado = Unidad.Estado.VENDIDA
        self.unidad.fecha_venta = self.fecha_venta
        self.unidad.save()


class PagoVenta(ModeloBase):
    """
    Registro de cuotas/pagos de una venta financiada.
    Cada cuota es un registro en este modelo.
    """
    venta = models.ForeignKey(
        VentaUnidad, on_delete=models.CASCADE, related_name='pagos'
    )
    numero_cuota = models.PositiveSmallIntegerField(verbose_name=_('N° Cuota'))
    fecha_vencimiento = models.DateField(verbose_name=_('Fecha de Vencimiento'))
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Monto (€)'))
    fecha_pago = models.DateField(null=True, blank=True, verbose_name=_('Fecha de Pago Real'))
    pagado = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Pago de Venta')
        verbose_name_plural = _('Pagos de Ventas')
        ordering = ['venta', 'numero_cuota']
        unique_together = ['venta', 'numero_cuota']

    def __str__(self):
        return f"Cuota {self.numero_cuota} — Venta #{self.venta_id} — {self.monto}€"


class ServicioTaller(ModeloBase):
    """
    Servicio realizado en el taller. Incluye mano de obra y repuestos.

    TIPOS:
      OT  — Orden de Trabajo externa (cliente). Puede facturarse. Genera cobro en Caja.
      ORI — Orden de Reparación Interna. NUNCA se factura. NUNCA genera movimiento de Caja.
            El costo se imputa al costo de la unidad en inventario (acondicionamiento para venta).
    """
    class TipoOrden(models.TextChoices):
        OT  = 'OT',  _('OT — Orden de Trabajo (cliente externo)')
        ORI = 'ORI', _('ORI — Orden Reparación Interna (uso propio)')

    class EstadoServicio(models.TextChoices):
        PRESUPUESTADO = 'PRESUPUESTADO', _('Presupuestado')
        EN_CURSO      = 'EN_CURSO',      _('En Curso')
        TERMINADO     = 'TERMINADO',     _('Terminado')
        FACTURADO     = 'FACTURADO',     _('Facturado')  # Solo permitido en OT
        CANCELADO     = 'CANCELADO',     _('Cancelado')

    # ── Tipo de orden ────────────────────────────────────────────
    tipo = models.CharField(
        max_length=3, choices=TipoOrden.choices, default=TipoOrden.OT,
        verbose_name=_('Tipo de Orden'),
        help_text=_('ORI = interno, nunca facturable, no genera movimiento de caja')
    )

    # ── Relaciones ───────────────────────────────────────────────
    # OT: cliente obligatorio. ORI: cliente puede ser el propio concesionario (null/blank)
    cliente = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name='servicios_taller',
        null=True, blank=True
    )
    # El auto puede ser del cliente (OT) o una unidad propia a acondicionar (ORI)
    unidad = models.ForeignKey(
        'inventario.Unidad', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='servicios'
    )
    matricula_cliente = models.CharField(
        max_length=20, blank=True,
        verbose_name=_('Matrícula (si no está en sistema)')
    )
    fecha_ingreso = models.DateField(verbose_name=_('Fecha de Ingreso'))
    fecha_entrega_estimada = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=15, choices=EstadoServicio.choices, default=EstadoServicio.PRESUPUESTADO
    )
    descripcion_trabajo = models.TextField(verbose_name=_('Descripción del Trabajo'))
    horas_mano_obra = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name=_('Horas de Mano de Obra')
    )
    precio_hora = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        verbose_name=_('Precio por Hora (€)')
    )
    # Solo ORI: imputa el costo total a la unidad al completarse
    costo_imputado_a_unidad = models.BooleanField(
        default=False,
        verbose_name=_('Costo imputado a unidad'),
        help_text=_('Solo ORI. Cuando True, el costo se sumó al precio_costo de la unidad.')
    )

    class Meta:
        verbose_name = _('Servicio de Taller')
        verbose_name_plural = _('Servicios de Taller')

    def __str__(self):
        tipo_str = f"[{self.tipo}] " if self.tipo else ""
        cliente_str = str(self.cliente) if self.cliente else "USO INTERNO"
        return f"{tipo_str}Servicio #{self.id} — {cliente_str} — {self.get_estado_display()}"

    @property
    def is_ori(self):
        return self.tipo == self.TipoOrden.ORI

    @property
    def subtotal_mano_obra(self):
        return self.horas_mano_obra * self.precio_hora

    @property
    def subtotal_repuestos(self):
        return sum(item.subtotal for item in self.repuestos_usados.all())

    @property
    def total_factura(self):
        return self.subtotal_mano_obra + self.subtotal_repuestos


class RepuestoUsadoEnServicio(ModeloBase):
    """
    Repuesto utilizado en un servicio de taller.
    Ejemplo doc: Filtro-Cod.F001 25€, Aceite A001 50€
    """
    servicio = models.ForeignKey(
        ServicioTaller, on_delete=models.CASCADE, related_name='repuestos_usados'
    )
    repuesto = models.ForeignKey(
        'inventario.Repuesto', on_delete=models.PROTECT
    )
    cantidad = models.PositiveSmallIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _('Repuesto Usado en Servicio')
        verbose_name_plural = _('Repuestos Usados en Servicios')

    def __str__(self):
        return f"{self.repuesto.codigo} x{self.cantidad} — Servicio #{self.servicio_id}"

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario
