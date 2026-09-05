"""AutoGest ERP — URLs de Caja"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MovimientoCajaViewSet, CuentaBancariaViewSet, PagareViewSet, CierreDiaViewSet

router = DefaultRouter()
router.register(r'movimientos', MovimientoCajaViewSet)
router.register(r'cuentas-bancarias', CuentaBancariaViewSet)
router.register(r'pagares', PagareViewSet)
router.register(r'cierres-dia', CierreDiaViewSet)

urlpatterns = [path('', include(router.urls))]
