"""
AutoGest ERP — Módulo de Auditoría General
Reporta EXCLUSIVAMENTE a Gerencia General.
Acceso de solo lectura a todos los módulos.
Registro inmutable de todas las acciones del sistema.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import ModeloBase


class EventoAuditoria(ModeloBase):
    """
    Registro inmutable de eventos críticos del sistema.
    Todo cambio relevante genera un evento aquí.
    """
    class NivelEvento(models.TextChoices):
        INFO     = 'INFO',    _('Información')
        ALERTA   = 'ALERTA',  _('Alerta')
        CRITICO  = 'CRITICO', _('Crítico')

    class ModuloOrigen(models.TextChoices):
        VENTAS      = 'VENTAS',     _('Ventas')
        COMPRAS     = 'COMPRAS',    _('Compras')
        CAJA        = 'CAJA',       _('Caja / Tesorería')
        FINANCIERO  = 'FINANCIERO', _('Financiero')
        RRHH        = 'RRHH',       _('RRHH')
        INVENTARIO  = 'INVENTARIO', _('Inventario')
        ACCOUNTS    = 'ACCOUNTS',   _('Usuarios / Accesos')
        SISTEMA     = 'SISTEMA',    _('Sistema')

    timestamp = models.DateTimeField(auto_now_add=True)
    nivel = models.CharField(max_length=10, choices=NivelEvento.choices, default=NivelEvento.INFO)
    modulo = models.CharField(max_length=15, choices=ModuloOrigen.choices)
    accion = models.CharField(max_length=200, verbose_name=_('Acción'))
    descripcion = models.TextField(verbose_name=_('Descripción Detallada'))
    usuario = models.ForeignKey(
        'accounts.Usuario', null=True, on_delete=models.SET_NULL,
        related_name='eventos_auditoria'
    )
    ip_origen = models.GenericIPAddressField(null=True, blank=True)
    objeto_tipo = models.CharField(max_length=100, blank=True, verbose_name=_('Tipo de Objeto'))
    objeto_id = models.PositiveIntegerField(null=True, blank=True, verbose_name=_('ID del Objeto'))
    datos_previos = models.JSONField(null=True, blank=True, verbose_name=_('Datos Anteriores'))
    datos_nuevos = models.JSONField(null=True, blank=True, verbose_name=_('Datos Nuevos'))

    class Meta:
        verbose_name = _('Evento de Auditoría')
        verbose_name_plural = _('Eventos de Auditoría')
        ordering = ['-timestamp']
        # Los eventos de auditoría NUNCA se borran
        default_permissions = ('view',)  # Sin add/change/delete desde el admin

    def __str__(self):
        return f"[{self.nivel}] {self.timestamp.strftime('%d/%m/%Y %H:%M')} — {self.modulo} — {self.accion}"

    def save(self, *args, **kwargs):
        """Sobreescribir save para bloquear modificaciones."""
        if self.pk:
            raise PermissionError(
                "Los registros de auditoría son inmutables y no pueden modificarse."
            )
        super().save(*args, **kwargs)


class ProgramaAuditoria(ModeloBase):
    """
    Cronograma de auditorías planificadas que el Auditor DEBE seguir.
    """
    class EstadoAuditoria(models.TextChoices):
        PROGRAMADA  = 'PROGRAMADA',  _('Programada')
        EN_PROCESO  = 'EN_PROCESO',  _('En Proceso')
        COMPLETADA  = 'COMPLETADA',  _('Completada')
        CANCELADA   = 'CANCELADA',   _('Cancelada')

    titulo = models.CharField(max_length=200, verbose_name=_('Título de la Auditoría'))
    modulo_objetivo = models.CharField(
        max_length=15,
        choices=EventoAuditoria.ModuloOrigen.choices,
        verbose_name=_('Módulo a Auditar')
    )
    fecha_programada = models.DateField(verbose_name=_('Fecha Programada'))
    fecha_realizacion = models.DateField(null=True, blank=True)
    estado = models.CharField(
        max_length=15, choices=EstadoAuditoria.choices, default=EstadoAuditoria.PROGRAMADA
    )
    responsable = models.ForeignKey(
        'accounts.Usuario', on_delete=models.PROTECT,
        related_name='auditorias_programadas'
    )
    objetivos = models.TextField(verbose_name=_('Objetivos de la Auditoría'))
    hallazgos = models.TextField(blank=True, verbose_name=_('Hallazgos'))
    recomendaciones = models.TextField(blank=True)
    informe_generado = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('Programa de Auditoría')
        verbose_name_plural = _('Programas de Auditoría')
        ordering = ['fecha_programada']

    def __str__(self):
        return f"{self.titulo} — {self.fecha_programada} — {self.get_estado_display()}"


class InformeAuditoria(ModeloBase):
    """
    Informe final de una auditoría. Visible SOLO para Gerencia General.
    """
    programa = models.OneToOneField(
        ProgramaAuditoria, on_delete=models.CASCADE, related_name='informe'
    )
    fecha_informe = models.DateField()
    resumen_ejecutivo = models.TextField(verbose_name=_('Resumen Ejecutivo'))
    observaciones = models.TextField(verbose_name=_('Observaciones'))
    nivel_riesgo = models.CharField(
        max_length=10,
        choices=[('BAJO', 'Bajo'), ('MEDIO', 'Medio'), ('ALTO', 'Alto'), ('CRITICO', 'Crítico')],
        default='BAJO'
    )
    acciones_requeridas = models.TextField(blank=True, verbose_name=_('Acciones Requeridas'))
    fecha_seguimiento = models.DateField(null=True, blank=True, verbose_name=_('Fecha de Seguimiento'))

    class Meta:
        verbose_name = _('Informe de Auditoría')
        verbose_name_plural = _('Informes de Auditoría')
        ordering = ['-fecha_informe']

    def __str__(self):
        return f"Informe: {self.programa.titulo} — {self.fecha_informe} — Riesgo: {self.nivel_riesgo}"
