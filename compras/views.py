"""
AutoGest ERP — Views de Compras
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import EsCompras, EsAdministracion, EsGerenciaOAuditor, AuditorSoloLectura
from .models import Proveedor, CompraUnidad, PagoCompraUnidad, OrdenCompraInsumos, ItemOrdenCompra
from .serializers import (
    ProveedorSerializer,
    CompraUnidadSerializer,
    PagoCompraUnidadSerializer,
    OrdenCompraInsumosSerializer, OrdenCompraInsumosCreateSerializer,
    ItemOrdenCompraSerializer,
)


class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.filter(activo=True)
    serializer_class = ProveedorSerializer
    permission_classes = [EsCompras | EsAdministracion | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'razon_social', 'nombre_comercial', 'cif_nif']
    ordering_fields = ['razon_social', 'tipo']

    def destroy(self, request, *args, **kwargs):
        proveedor = self.get_object()
        proveedor.soft_delete(usuario=request.user)
        return Response({'detail': 'Proveedor dado de baja.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='grandes-proveedores')
    def grandes_proveedores(self, request):
        """Solo los Grandes Proveedores (marcas de autos)."""
        qs = self.get_queryset().filter(tipo='GRAN')
        serializer = ProveedorSerializer(qs, many=True)
        return Response(serializer.data)


class CompraUnidadViewSet(viewsets.ModelViewSet):
    queryset = CompraUnidad.objects.all().select_related('proveedor', 'unidad')
    permission_classes = [EsCompras | EsAdministracion | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['proveedor__razon_social', 'unidad__numero_serie', 'numero_factura_proveedor']
    ordering_fields = ['fecha_compra', 'precio_compra']

    def get_serializer_class(self):
        return CompraUnidadSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='saldos-pendientes')
    def saldos_pendientes(self, request):
        """Compras de unidades con saldo pendiente de pago."""
        compras = self.get_queryset()
        pendientes = [c for c in compras if c.saldo_pendiente > 0]
        serializer = CompraUnidadSerializer(pendientes, many=True)
        return Response(serializer.data)


class PagoCompraUnidadViewSet(viewsets.ModelViewSet):
    queryset = PagoCompraUnidad.objects.all()
    serializer_class = PagoCompraUnidadSerializer
    permission_classes = [EsCompras | EsAdministracion | EsGerenciaOAuditor, AuditorSoloLectura]

    @action(detail=False, methods=['get'], url_path='proximos-vencimientos')
    def proximos_vencimientos(self, request):
        """Pagos a proveedores por vencer en 30 días."""
        from django.utils import timezone
        from datetime import timedelta
        limite = timezone.now().date() + timedelta(days=30)
        pagos = self.get_queryset().filter(
            pagado=False,
            fecha_vencimiento__lte=limite
        ).order_by('fecha_vencimiento')
        serializer = PagoCompraUnidadSerializer(pagos, many=True)
        return Response(serializer.data)


class OrdenCompraInsumosViewSet(viewsets.ModelViewSet):
    queryset = OrdenCompraInsumos.objects.all().select_related('proveedor').prefetch_related('items')
    permission_classes = [EsCompras | EsAdministracion | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter]
    search_fields = ['numero_orden', 'proveedor__razon_social']

    def get_serializer_class(self):
        if self.action == 'create':
            return OrdenCompraInsumosCreateSerializer
        return OrdenCompraInsumosSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
