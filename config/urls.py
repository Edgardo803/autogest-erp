"""
AutoGest ERP — URLs principales
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

admin.site.site_header = "AutoGest ERP — Administración"
admin.site.site_title = "AutoGest ERP"
admin.site.index_title = "Panel de Control"

urlpatterns = [
    # Panel de administración Django
    path('admin/', admin.site.urls),

    # Autenticación JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # APIs de cada módulo
    path('api/accounts/', include('accounts.urls')),
    path('api/core/', include('core.urls')),
    path('api/inventario/', include('inventario.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/compras/', include('compras.urls')),
    path('api/caja/', include('caja.urls')),
    path('api/financiero/', include('financiero.urls')),
    path('api/rrhh/', include('rrhh.urls')),
    path('api/auditoria/', include('auditoria.urls')),
    path('api/informes/', include('informes.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ── Catch-all: cualquier ruta que no sea /api/ ni /admin/ → React SPA ──
# DEBE ir al final para no interceptar las rutas de API
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(
        template_name='index.html',
        content_type='text/html',
    ), name='spa'),
]
