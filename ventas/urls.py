"""AutoGest ERP — URLs de Ventas"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, VentaUnidadViewSet, PagoVentaViewSet, ServicioTallerViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet)
router.register(r'ventas-unidades', VentaUnidadViewSet)
router.register(r'pagos-venta', PagoVentaViewSet)
router.register(r'servicios-taller', ServicioTallerViewSet)

urlpatterns = [path('', include(router.urls))]
