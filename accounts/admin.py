"""AutoGest ERP — Admin de Accounts"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol

# Ocultar modelos internos de JWT que no son relevantes para el usuario
try:
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
    admin.site.unregister(OutstandingToken)
    admin.site.unregister(BlacklistedToken)
except Exception:
    pass


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = [
        'username', 'get_full_name', 'email', 'rol',
        'activo_sistema', 'ultimo_acceso_ip', 'fecha_creacion'
    ]
    list_filter = ['rol', 'activo_sistema', 'is_staff']
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering = ['last_name', 'first_name']

    fieldsets = UserAdmin.fieldsets + (
        ('AutoGest ERP', {
            'fields': ('rol', 'telefono', 'activo_sistema', 'ultimo_acceso_ip'),
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('AutoGest ERP', {
            'fields': ('email', 'first_name', 'last_name', 'rol', 'telefono'),
        }),
    )

    readonly_fields = ['ultimo_acceso_ip', 'fecha_creacion', 'fecha_modificacion']

    def get_rol_display(self, obj):
        return obj.get_rol_display()
    get_rol_display.short_description = 'Rol'
