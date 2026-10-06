"""
AutoGest ERP — Comando: init_production
Asegura que las tablas y los usuarios de demostración existan
con sus contraseñas exactas y permisos activos en producción.
"""
from django.core.management.base import BaseCommand
from accounts.models import Usuario


class Command(BaseCommand):
    help = 'Asegura los 4 usuarios de demostración con contraseñas correctas'

    def handle(self, *args, **options):
        usuarios = [
            ('gerencia', 'AutoGest2026!', 'GERENCIA', 'Edgardo', 'Burgos', True),
            ('auditoria', 'Audit2026!', 'AUDITORIA', 'Carlos', 'Auditor', False),
            ('ventas01', 'Ventas2026!', 'VENTAS', 'Laura', 'Ventas', False),
            ('tesoreria', 'Tesor2026!', 'TESORERIA', 'Ana', 'Tesorera', False),
        ]

        for username, pwd, rol, fn, ln, superuser in usuarios:
            user, _ = Usuario.objects.get_or_create(
                username=username,
                defaults={
                    'rol': rol,
                    'first_name': fn,
                    'last_name': ln,
                    'email': f'{username}@autogest.com',
                    'is_staff': True if rol in ['GERENCIA', 'AUDITORIA'] else False,
                    'is_superuser': superuser,
                    'activo_sistema': True,
                }
            )
            user.set_password(pwd)
            user.rol = rol
            user.activo_sistema = True
            user.is_active = True
            if superuser:
                user.is_superuser = True
                user.is_staff = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Usuario {username} listo y activo.'))
