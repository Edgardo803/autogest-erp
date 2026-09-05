"""AutoGest ERP — URLs de Inventario"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MarcaViewSet, ModeloViewSet, UnidadViewSet, CategoriaRepuestoViewSet, RepuestoViewSet

router = DefaultRouter()
router.register(r'marcas', MarcaViewSet)
router.register(r'modelos', ModeloViewSet)
router.register(r'unidades', UnidadViewSet)
router.register(r'categorias-repuesto', CategoriaRepuestoViewSet)
router.register(r'repuestos', RepuestoViewSet)

urlpatterns = [path('', include(router.urls))]
