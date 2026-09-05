"""AutoGest ERP — URLs de Compras"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProveedorViewSet, CompraUnidadViewSet, PagoCompraUnidadViewSet, OrdenCompraInsumosViewSet

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'compras-unidades', CompraUnidadViewSet)
router.register(r'pagos-compra', PagoCompraUnidadViewSet)
router.register(r'ordenes-insumos', OrdenCompraInsumosViewSet)

urlpatterns = [path('', include(router.urls))]
