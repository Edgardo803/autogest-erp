"""
AutoGest ERP — Módulo de RRHH
Empleados, sueldos y liquidaciones.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import ModeloBase


class Empleado(ModeloBase):
    """Ficha de empleado."""
    class Departamento(models.TextChoices):
        GERENCIA       = 'GER', _('Gerencia')
        VENTAS         = 'VEN', _('Ventas')
        COMPRAS        = 'COM', _('Compras')
        ADMINISTRACION = 'ADM', _('Administración')
        TALLER         = 'TAL', _('Taller')
        CAJA           = 'CAJ', _('Caja / Tesorería')
        RRHH           = 'RRH', _('RRHH')
        OTRO           = 'OTR', _('Otro')

    usuario = models.OneToOneField(
        'accounts.Usuario', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='empleado'
    )
    legajo = models.CharField(max_length=10, unique=True, verbose_name=_('N° de Legajo'))
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    dni_nie = models.CharField(max_length=15, blank=True, verbose_name=_('DNI/NIE'))
    fecha_nacimiento = models.DateField(null=True, blank=True)
    fecha_ingreso = models.DateField(verbose_name=_('Fecha de Ingreso'))
    departamento = models.CharField(max_length=5, choices=Departamento.choices)
    cargo = models.CharField(max_length=100)
    salario_bruto = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_('Salario Bruto Mensual (€)')
    )
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)

    class Meta:
        verbose_name = _('Empleado')
        verbose_name_plural = _('Empleados')
        ordering = ['apellidos', 'nombre']

    def __str__(self):
        return f"[{self.legajo}] {self.apellidos}, {self.nombre} — {self.cargo}"


class LiquidacionSueldo(ModeloBase):
    """Liquidación mensual de sueldo de un empleado."""
    empleado = models.ForeignKey(
        Empleado, on_delete=models.PROTECT, related_name='liquidaciones'
    )
    periodo_mes = models.PositiveSmallIntegerField(verbose_name=_('Mes'))
    periodo_año = models.PositiveSmallIntegerField(verbose_name=_('Año'))
    salario_bruto = models.DecimalField(max_digits=10, decimal_places=2)
    deducciones = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adicionales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    neto_a_pagar = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago = models.DateField(null=True, blank=True)
    pagado = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Liquidación de Sueldo')
        verbose_name_plural = _('Liquidaciones de Sueldos')
        unique_together = ['empleado', 'periodo_mes', 'periodo_año']
        ordering = ['-periodo_año', '-periodo_mes']

    def __str__(self):
        return f"{self.empleado} — {self.periodo_mes:02d}/{self.periodo_año} — €{self.neto_a_pagar}"
