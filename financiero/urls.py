"""AutoGest ERP — URLs de Financiero"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProyeccionFinancieraViewSet, ObligacionRecurrenteViewSet

router = DefaultRouter()
router.register(r'proyecciones', ProyeccionFinancieraViewSet)
router.register(r'obligaciones', ObligacionRecurrenteViewSet)

urlpatterns = [path('', include(router.urls))]
