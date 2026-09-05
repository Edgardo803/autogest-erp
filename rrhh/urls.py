"""AutoGest ERP — URLs de RRHH"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import EsRRHH, EsGerenciaOAuditor, AuditorSoloLectura
from .models import Empleado, LiquidacionSueldo
from core.serializers import EmpleadoSerializer, LiquidacionSueldoSerializer

class EmpleadoViewSet(viewsets.ModelViewSet):
    queryset = Empleado.objects.filter(activo=True)
    serializer_class = EmpleadoSerializer
    permission_classes = [EsRRHH | EsGerenciaOAuditor, AuditorSoloLectura]

class LiquidacionViewSet(viewsets.ModelViewSet):
    queryset = LiquidacionSueldo.objects.all().select_related('empleado')
    serializer_class = LiquidacionSueldoSerializer
    permission_classes = [EsRRHH | EsGerenciaOAuditor, AuditorSoloLectura]

router = DefaultRouter()
router.register(r'empleados', EmpleadoViewSet)
router.register(r'liquidaciones', LiquidacionViewSet)

urlpatterns = [path('', include(router.urls))]
