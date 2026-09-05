"""
AutoGest ERP — Views de Inventario
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import EsCompras, EsVentas, EsGerenciaOAuditor, AuditorSoloLectura
from .models import Marca, Modelo, Unidad, CategoriaRepuesto, Repuesto
from .serializers import (
    MarcaSerializer, ModeloSerializer,
    UnidadSerializer, UnidadListSerializer,
    CategoriaRepuestoSerializer, RepuestoSerializer,
)


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.filter(activo=True)
    serializer_class = MarcaSerializer
    permission_classes = [EsCompras | EsGerenciaOAuditor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'pais_origen']
    ordering_fields = ['nombre']


class ModeloViewSet(viewsets.ModelViewSet):
    queryset = Modelo.objects.filter(activo=True).select_related('marca')
    serializer_class = ModeloSerializer
    permission_classes = [EsCompras | EsGerenciaOAuditor]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre', 'marca__nombre']


class UnidadViewSet(viewsets.ModelViewSet):
    """
    CRUD de unidades vehiculares.
    Ventas puede ver. Compras puede crear/editar. Auditoría solo lee.
    """
    queryset = Unidad.objects.filter(activo=True).select_related('modelo__marca', 'proveedor')
    permission_classes = [EsVentas | EsCompras | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero_serie', 'matricula', 'modelo__nombre', 'modelo__marca__nombre']
    ordering_fields = ['precio_venta', 'fecha_ingreso', 'estado']

    def get_serializer_class(self):
        if self.action == 'list':
            return UnidadListSerializer
        return UnidadSerializer

    @action(detail=False, methods=['get'], url_path='disponibles')
    def disponibles(self, request):
        """Unidades disponibles para vender (NUEVA, USADA, CONSIGNACION)."""
        qs = self.get_queryset().filter(
            estado__in=['NUEVA', 'USADA', 'CONSIGNACION']
        )
        serializer = UnidadListSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stock-bajo-repuestos')
    def stock_bajo_repuestos(self, request):
        """Repuestos con stock por debajo del mínimo."""
        repuestos = Repuesto.objects.filter(activo=True)
        bajo = [r for r in repuestos if r.stock_bajo]
        serializer = RepuestoSerializer(bajo, many=True)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        unidad = self.get_object()
        unidad.soft_delete(usuario=request.user)
        return Response({'detail': 'Unidad dada de baja.'}, status=status.HTTP_200_OK)


class CategoriaRepuestoViewSet(viewsets.ModelViewSet):
    queryset = CategoriaRepuesto.objects.filter(activo=True)
    serializer_class = CategoriaRepuestoSerializer
    permission_classes = [EsCompras | EsGerenciaOAuditor]


class RepuestoViewSet(viewsets.ModelViewSet):
    queryset = Repuesto.objects.filter(activo=True).select_related('categoria')
    serializer_class = RepuestoSerializer
    permission_classes = [EsCompras | EsVentas | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'descripcion', 'categoria__nombre']
    ordering_fields = ['codigo', 'stock_actual', 'precio_venta']

    def destroy(self, request, *args, **kwargs):
        repuesto = self.get_object()
        repuesto.soft_delete(usuario=request.user)
        return Response({'detail': 'Repuesto dado de baja.'}, status=status.HTTP_200_OK)
