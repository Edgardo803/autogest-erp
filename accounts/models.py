"""
AutoGest ERP — Modelos de Accounts
Sistema de usuarios personalizados con roles y estratos de autorización
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class Rol(models.TextChoices):
    """
    Estratos de autorización del sistema.
    Cada rol determina qué módulos puede ver y operar el usuario.
    """
    GERENCIA_GENERAL   = 'GERENCIA',    _('Gerencia General')
    TESORERIA          = 'TESORERIA',   _('Tesorería')
    ADMINISTRACION     = 'ADMIN',       _('Administración')
    VENTAS             = 'VENTAS',      _('Ventas')
    COMPRAS            = 'COMPRAS',     _('Compras')
    RRHH               = 'RRHH',        _('Recursos Humanos')
    CAJA               = 'CAJA',        _('Caja')
    AUDITORIA          = 'AUDITORIA',   _('Auditoría General')


class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado para AutoGest ERP.
    Extiende AbstractUser con campos específicos del sistema.
    """
    email = models.EmailField(_('correo electrónico'), unique=True)
    rol = models.CharField(
        max_length=20,
        choices=Rol.choices,
        default=Rol.VENTAS,
        verbose_name=_('Rol / Estrato')
    )
    telefono = models.CharField(max_length=20, blank=True, verbose_name=_('Teléfono'))
    activo_sistema = models.BooleanField(
        default=True,
        verbose_name=_('Activo en el sistema'),
        help_text=_('Desactivar en lugar de borrar usuarios.')
    )
    ultimo_acceso_ip = models.GenericIPAddressField(
        null=True, blank=True,
        verbose_name=_('Última IP de acceso')
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_modificacion = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'rol']

    class Meta:
        verbose_name = _('Usuario')
        verbose_name_plural = _('Usuarios')
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.get_full_name()} [{self.get_rol_display()}]"

    # --------------------------------------------------------
    # Propiedades de conveniencia para permisos en vistas/APIs
    # --------------------------------------------------------
    @property
    def es_gerencia(self):
        return self.rol == Rol.GERENCIA_GENERAL

    @property
    def es_auditor(self):
        return self.rol == Rol.AUDITORIA

    @property
    def es_tesoreria(self):
        return self.rol == Rol.TESORERIA

    @property
    def es_administracion(self):
        return self.rol == Rol.ADMINISTRACION

    @property
    def es_ventas(self):
        return self.rol == Rol.VENTAS

    @property
    def es_compras(self):
        return self.rol == Rol.COMPRAS

    @property
    def es_rrhh(self):
        return self.rol == Rol.RRHH

    @property
    def es_caja(self):
        return self.rol == Rol.CAJA

    @property
    def puede_ver_financiero(self):
        """Solo Gerencia y Tesorería ven el módulo financiero completo."""
        return self.rol in [Rol.GERENCIA_GENERAL, Rol.TESORERIA]

    @property
    def puede_ver_todo(self):
        """Solo Gerencia y Auditoría pueden ver todos los módulos."""
        return self.rol in [Rol.GERENCIA_GENERAL, Rol.AUDITORIA]
