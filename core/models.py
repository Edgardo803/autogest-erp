"""
AutoGest ERP — Modelos base (core)
Todos los modelos del sistema heredan de aquí para tener
auditoría automática, soft-delete y metadatos uniformes.
"""
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class ModeloBase(models.Model):
    """
    Clase base abstracta para todos los modelos de AutoGest ERP.
    Provee:
      - Timestamps automáticos (creado_en, modificado_en)
      - Registro del usuario que creó/modificó
      - Soft-delete (activo=False en lugar de borrar físicamente)
      - Notas internas
    """
    creado_en = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Fecha de creación')
    )
    modificado_en = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Última modificación')
    )
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_creados',
        verbose_name=_('Creado por')
    )
    modificado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='%(class)s_modificados',
        verbose_name=_('Modificado por')
    )
    activo = models.BooleanField(
        default=True,
        verbose_name=_('Activo'),
        help_text=_('Desactivar en lugar de eliminar registros.')
    )
    notas = models.TextField(
        blank=True,
        verbose_name=_('Notas internas')
    )

    class Meta:
        abstract = True
        ordering = ['-creado_en']

    def soft_delete(self, usuario=None):
        """Marca el registro como inactivo (no lo borra físicamente)."""
        self.activo = False
        if usuario:
            self.modificado_por = usuario
        self.save()


class Empresa(ModeloBase):
    """
    Configuración de la empresa / concesionario.
    El sistema es multi-empresa desde el diseño base.
    """
    nombre = models.CharField(max_length=200, verbose_name=_('Nombre de la empresa'))
    razon_social = models.CharField(max_length=200, blank=True)
    cif_nif = models.CharField(max_length=20, blank=True, verbose_name=_('CIF/NIF'))
    direccion = models.TextField(blank=True, verbose_name=_('Dirección'))
    telefono = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    web = models.URLField(blank=True)
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    moneda = models.CharField(max_length=3, default='EUR', verbose_name=_('Moneda'))

    # Configuración de módulos activos
    modulo_ventas = models.BooleanField(default=True)
    modulo_compras = models.BooleanField(default=True)
    modulo_taller = models.BooleanField(default=True)
    modulo_rrhh = models.BooleanField(default=True)
    modulo_financiero = models.BooleanField(default=True)

    # Alertas financieras
    alerta_proyeccion_minima = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        verbose_name=_('Alerta cuando proyección baje de (€)')
    )

    class Meta:
        verbose_name = _('Empresa')
        verbose_name_plural = _('Empresas')

    def __str__(self):
        return self.nombre
