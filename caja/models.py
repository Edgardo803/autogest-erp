"""
AutoGest ERP — Modelos de Caja y Tesorería
Toda operación que afecte el estado financiero pasa por aquí.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
from core.models import ModeloBase


class CuentaBancaria(ModeloBase):
    """Cuentas bancarias de la empresa."""
    banco = models.CharField(max_length=100)
    numero_cuenta = models.CharField(max_length=30, unique=True)
    iban = models.CharField(max_length=30, blank=True)
    saldo_actual = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    moneda = models.CharField(max_length=3, default='EUR')

    class Meta:
        verbose_name = _('Cuenta Bancaria')
        verbose_name_plural = _('Cuentas Bancarias')

    def __str__(self):
        return f"{self.banco} — {self.numero_cuenta}"


class MovimientoCaja(ModeloBase):
    """
    Registro de TODOS los movimientos de caja.
    Toda operación que afecte el estado financiero pasa por aquí.
    Según las pautas: 'Todas las operaciones que afecten de manera directa
    el estado financiero deberán pasar por Caja.'
    """
    class TipoMovimiento(models.TextChoices):
        INGRESO = 'INGRESO', _('Ingreso')
        EGRESO  = 'EGRESO',  _('Egreso')

    class Concepto(models.TextChoices):
        COBRO_VENTA_UNIDAD      = 'CVU',  _('Cobro Venta de Unidad')
        COBRO_SERVICIO_TALLER   = 'CST',  _('Cobro Servicio de Taller')
        COBRO_CUOTA_CLIENTE     = 'CCC',  _('Cobro Cuota a Cliente')
        PAGO_PROVEEDOR_UNIDAD   = 'PPU',  _('Pago a Proveedor — Unidad')
        PAGO_PROVEEDOR_INSUMO   = 'PPI',  _('Pago a Proveedor — Insumo')
        PAGO_SUELDO             = 'PSU',  _('Pago de Sueldo')
        PAGO_SERVICIO           = 'PSR',  _('Pago de Servicio (Luz, Gas, etc.)')
        DEPOSITO_BANCO          = 'DBA',  _('Depósito en Banco')
        EXTRACCION_BANCO        = 'EBA',  _('Extracción de Banco')
        OTRO                    = 'OTR',  _('Otro')

    tipo = models.CharField(
        max_length=10, choices=TipoMovimiento.choices,
        verbose_name=_('Tipo')
    )
    concepto = models.CharField(
        max_length=5, choices=Concepto.choices,
        verbose_name=_('Concepto')
    )
    monto = models.DecimalField(
        max_digits=14, decimal_places=2, verbose_name=_('Monto (€)')
    )
    fecha = models.DateField(verbose_name=_('Fecha del Movimiento'))
    descripcion = models.CharField(max_length=300, verbose_name=_('Descripción'))
    numero_documento = models.CharField(
        max_length=50, blank=True, verbose_name=_('N° Documento / Factura')
    )

    # Referencias opcionales a operaciones que generaron este movimiento
    referencia_venta_id = models.PositiveIntegerField(null=True, blank=True)
    referencia_compra_id = models.PositiveIntegerField(null=True, blank=True)
    referencia_servicio_id = models.PositiveIntegerField(null=True, blank=True)

    # Confirmación de cierre diario
    cerrado_en_dia = models.BooleanField(
        default=False,
        verbose_name=_('Incluido en cierre del día')
    )

    class Meta:
        verbose_name = _('Movimiento de Caja')
        verbose_name_plural = _('Movimientos de Caja')
        ordering = ['-fecha', '-creado_en']

    def __str__(self):
        simbolo = '+' if self.tipo == self.TipoMovimiento.INGRESO else '-'
        return f"{self.fecha} {simbolo}€{self.monto} — {self.get_concepto_display()}"


class Pagare(ModeloBase):
    """
    Pagarés y valores a plazo en cartera.
    Son parte del cálculo de Proyección Financiera.
    """
    class EstadoPagare(models.TextChoices):
        EN_CARTERA = 'CARTERA',  _('En Cartera')
        COBRADO    = 'COBRADO',  _('Cobrado')
        PROTESTADO = 'PROTEST',  _('Protestado')
        CEDIDO     = 'CEDIDO',   _('Cedido al Banco')

    numero = models.CharField(max_length=30, unique=True, verbose_name=_('N° de Pagaré'))
    emisor = models.CharField(max_length=200, verbose_name=_('Emisor / Librador'))
    monto = models.DecimalField(max_digits=12, decimal_places=2, verbose_name=_('Monto (€)'))
    fecha_emision = models.DateField(verbose_name=_('Fecha de Emisión'))
    fecha_vencimiento = models.DateField(verbose_name=_('Fecha de Vencimiento'))
    estado = models.CharField(
        max_length=10, choices=EstadoPagare.choices, default=EstadoPagare.EN_CARTERA
    )
    referencia_venta_id = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = _('Pagaré')
        verbose_name_plural = _('Pagarés')
        ordering = ['fecha_vencimiento']

    def __str__(self):
        return f"Pagaré #{self.numero} — {self.emisor} — {self.monto}€ — {self.fecha_vencimiento}"


class CierreDia(ModeloBase):
    """
    Registro del cierre contable diario.
    Al cierre, no deben quedar operaciones sin registrar (según pautas).
    """
    fecha = models.DateField(unique=True, verbose_name=_('Fecha del Cierre'))
    saldo_caja_apertura = models.DecimalField(max_digits=14, decimal_places=2)
    total_ingresos = models.DecimalField(max_digits=14, decimal_places=2)
    total_egresos = models.DecimalField(max_digits=14, decimal_places=2)
    saldo_caja_cierre = models.DecimalField(max_digits=14, decimal_places=2)
    operaciones_pendientes = models.PositiveSmallIntegerField(
        default=0, verbose_name=_('Operaciones Pendientes de Registro')
    )
    autorizado_por = models.ForeignKey(
        'accounts.Usuario', on_delete=models.PROTECT,
        related_name='cierres_autorizados', null=True, blank=True
    )
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = _('Cierre del Día')
        verbose_name_plural = _('Cierres del Día')
        ordering = ['-fecha']

    def __str__(self):
        return f"Cierre {self.fecha} — Saldo: €{self.saldo_caja_cierre}"
