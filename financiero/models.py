"""
AutoGest ERP — Módulo de Proyección Financiera
El corazón del sistema. Calcula en tiempo real la posición financiera
de la empresa según la fórmula de las pautas del proyecto:

Proyección = (Caja + Pagarés vigentes + Σ Bancos) - (Cuotas unidades + Sueldos + Servicios + Proveedores)

Todos los cálculos son por horizonte temporal (ej: proyección a 30 días).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
from core.models import ModeloBase


class ProyeccionFinanciera(ModeloBase):
    """
    Snapshot de la proyección financiera en un momento dado.
    Se genera automáticamente vía señales Django cada vez que
    hay un movimiento de caja, un pago registrado, etc.
    """
    fecha_calculo = models.DateTimeField(
        default=timezone.now, verbose_name=_('Fecha y Hora del Cálculo')
    )
    fecha_horizonte = models.DateField(
        verbose_name=_('Fecha Horizonte (proyección hasta...)')
    )

    # ACTIVOS (lo que tenemos / esperamos cobrar)
    saldo_caja_actual = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Saldo de Caja Actual (€)')
    )
    pagares_en_cartera = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Pagarés en Cartera — Total (€)')
    )
    saldo_bancos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Saldo Total en Bancos (€)')
    )
    cobros_previstos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Cobros Previstos (cuotas clientes) hasta el horizonte (€)')
    )

    # PASIVOS (lo que debemos pagar)
    pagos_proveedores_unidades = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Cuotas de Unidades a Pagar — hasta horizonte (€)')
    )
    pagos_proveedores_insumos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Pagos a Proveedores (insumos) — hasta horizonte (€)')
    )
    sueldos_previstos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Sueldos a Pagar — hasta horizonte (€)')
    )
    servicios_previstos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Servicios (Luz, Gas, etc.) — hasta horizonte (€)')
    )

    # RESULTADO
    total_activos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Total Activos (€)')
    )
    total_pasivos = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Total Pasivos (€)')
    )
    posicion_neta = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        verbose_name=_('Posición Neta (€)')
    )
    alerta_activa = models.BooleanField(
        default=False,
        verbose_name=_('¡Alerta! Proyección por debajo del umbral')
    )

    class Meta:
        verbose_name = _('Proyección Financiera')
        verbose_name_plural = _('Proyecciones Financieras')
        ordering = ['-fecha_calculo']
        get_latest_by = 'fecha_calculo'

    def __str__(self):
        signo = '+' if self.posicion_neta >= 0 else ''
        return (
            f"Proyección al {self.fecha_horizonte} "
            f"[calculada: {self.fecha_calculo.strftime('%d/%m/%Y %H:%M')}] "
            f"Posición: {signo}€{self.posicion_neta}"
        )

    def calcular_totales(self):
        """Recalcula totales a partir de los parciales."""
        self.total_activos = (
            self.saldo_caja_actual +
            self.pagares_en_cartera +
            self.saldo_bancos +
            self.cobros_previstos
        )
        self.total_pasivos = (
            self.pagos_proveedores_unidades +
            self.pagos_proveedores_insumos +
            self.sueldos_previstos +
            self.servicios_previstos
        )
        self.posicion_neta = self.total_activos - self.total_pasivos


class ObligacionRecurrente(ModeloBase):
    """
    Obligaciones fijas de la empresa: sueldos, alquileres, servicios.
    Se usan para la proyección futura automática.
    """
    class TipoObligacion(models.TextChoices):
        SUELDO      = 'SUELDO',    _('Sueldo / Salario')
        ALQUILER    = 'ALQUILER',  _('Alquiler')
        SUMINISTRO  = 'SUMINIST',  _('Suministro (Luz, Gas, Agua, Internet)')
        SEGUROS     = 'SEGUROS',   _('Seguros')
        OTROS       = 'OTROS',     _('Otros gastos fijos')

    descripcion = models.CharField(max_length=200)
    tipo = models.CharField(max_length=10, choices=TipoObligacion.choices)
    monto_mensual = models.DecimalField(max_digits=12, decimal_places=2)
    dia_vencimiento = models.PositiveSmallIntegerField(
        verbose_name=_('Día de vencimiento del mes'),
        help_text=_('Ej: 28 para el día 28 de cada mes')
    )
    referencia_empleado_id = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name=_('ID del Empleado (si es sueldo)')
    )

    class Meta:
        verbose_name = _('Obligación Recurrente')
        verbose_name_plural = _('Obligaciones Recurrentes')

    def __str__(self):
        return f"{self.get_tipo_display()} — {self.descripcion} — €{self.monto_mensual}/mes"
