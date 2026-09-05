"""
AutoGest ERP — Permisos personalizados por rol
Sistema de autorización por estratos.
"""
from rest_framework.permissions import BasePermission
from .models import Rol


class EsGerencia(BasePermission):
    """Solo Gerencia General puede acceder."""
    message = 'Acceso restringido a Gerencia General.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol == Rol.GERENCIA_GENERAL
        )


class EsAuditor(BasePermission):
    """Solo el Auditor General puede acceder."""
    message = 'Acceso restringido a Auditoría General.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol == Rol.AUDITORIA
        )


class EsGerenciaOAuditor(BasePermission):
    """Gerencia General o Auditoría — pueden ver todo."""
    message = 'Acceso restringido a Gerencia General o Auditoría.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [Rol.GERENCIA_GENERAL, Rol.AUDITORIA]
        )


class EsTesoreria(BasePermission):
    """Tesorería o Gerencia."""
    message = 'Acceso restringido a Tesorería.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [Rol.GERENCIA_GENERAL, Rol.TESORERIA]
        )


class EsAdministracion(BasePermission):
    """Administración o superiores."""
    message = 'Acceso restringido a Administración.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [
                Rol.GERENCIA_GENERAL, Rol.ADMINISTRACION
            ]
        )


class EsVentas(BasePermission):
    """Ventas, Administración o Gerencia."""
    message = 'Acceso restringido a Ventas.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [
                Rol.GERENCIA_GENERAL, Rol.ADMINISTRACION, Rol.VENTAS
            ]
        )


class EsCompras(BasePermission):
    """Compras, Administración o Gerencia."""
    message = 'Acceso restringido a Compras.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [
                Rol.GERENCIA_GENERAL, Rol.ADMINISTRACION, Rol.COMPRAS
            ]
        )


class EsCaja(BasePermission):
    """Caja, Tesorería o Gerencia."""
    message = 'Acceso restringido a Caja.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [
                Rol.GERENCIA_GENERAL, Rol.TESORERIA, Rol.CAJA
            ]
        )


class EsRRHH(BasePermission):
    """RRHH, Administración o Gerencia."""
    message = 'Acceso restringido a Recursos Humanos.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.rol in [
                Rol.GERENCIA_GENERAL, Rol.ADMINISTRACION, Rol.RRHH
            ]
        )


class SoloLectura(BasePermission):
    """Permite solo métodos GET/HEAD/OPTIONS."""
    def has_permission(self, request, view):
        return request.method in ('GET', 'HEAD', 'OPTIONS')


class AuditorSoloLectura(BasePermission):
    """
    El auditor puede ver cualquier cosa pero NO puede modificar.
    Para usar en combinación: EsGerenciaOAuditor + AuditorSoloLectura
    """
    message = 'El Auditor tiene acceso de solo lectura.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.rol == Rol.AUDITORIA:
            return request.method in ('GET', 'HEAD', 'OPTIONS')
        return True
