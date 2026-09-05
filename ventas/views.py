"""
AutoGest ERP — Views de Ventas
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import EsVentas, EsCaja, EsGerenciaOAuditor, AuditorSoloLectura
from .models import Cliente, VentaUnidad, PagoVenta, ServicioTaller, RepuestoUsadoEnServicio
from .serializers import (
    ClienteSerializer,
    VentaUnidadSerializer, VentaUnidadCreateSerializer,
    PagoVentaSerializer,
    ServicioTallerSerializer, ServicioTallerCreateSerializer,
    RepuestoUsadoSerializer,
)


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.filter(activo=True)
    serializer_class = ClienteSerializer
    permission_classes = [EsVentas | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['codigo', 'nombre', 'apellidos', 'dni_nie', 'email', 'telefono']
    ordering_fields = ['apellidos', 'nombre', 'codigo']

    def destroy(self, request, *args, **kwargs):
        cliente = self.get_object()
        cliente.soft_delete(usuario=request.user)
        return Response({'detail': 'Cliente dado de baja.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='historial')
    def historial(self, request, pk=None):
        """Historial completo de un cliente: ventas + servicios."""
        cliente = self.get_object()
        ventas = VentaUnidadSerializer(
            cliente.ventas_unidades.all(), many=True
        ).data
        servicios = ServicioTallerSerializer(
            cliente.servicios_taller.all(), many=True
        ).data
        return Response({
            'cliente': ClienteSerializer(cliente).data,
            'ventas_unidades': ventas,
            'servicios_taller': servicios,
        })


class VentaUnidadViewSet(viewsets.ModelViewSet):
    queryset = VentaUnidad.objects.all().select_related('cliente', 'unidad', 'vendedor')
    permission_classes = [EsVentas | EsCaja | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'cliente__apellidos', 'cliente__codigo',
        'unidad__numero_serie', 'unidad__matricula',
    ]
    ordering_fields = ['fecha_venta', 'precio_acordado', 'estado_pago']

    def get_serializer_class(self):
        if self.action == 'create':
            return VentaUnidadCreateSerializer
        return VentaUnidadSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='pendientes-cobro')
    def pendientes_cobro(self, request):
        """Ventas con saldo pendiente de cobro."""
        ventas = self.get_queryset().exclude(estado_pago='COMPLETO')
        serializer = VentaUnidadSerializer(ventas, many=True)
        return Response(serializer.data)


class PagoVentaViewSet(viewsets.ModelViewSet):
    queryset = PagoVenta.objects.all().select_related('venta__cliente')
    serializer_class = PagoVentaSerializer
    permission_classes = [EsCaja | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['fecha_vencimiento', 'pagado']

    @action(detail=False, methods=['get'], url_path='proximos-vencimientos')
    def proximos_vencimientos(self, request):
        """Cuotas próximas a vencer (30 días) no cobradas."""
        from django.utils import timezone
        from datetime import timedelta
        limite = timezone.now().date() + timedelta(days=30)
        cuotas = self.get_queryset().filter(
            pagado=False,
            fecha_vencimiento__lte=limite
        ).order_by('fecha_vencimiento')
        serializer = PagoVentaSerializer(cuotas, many=True)
        return Response(serializer.data)


class ServicioTallerViewSet(viewsets.ModelViewSet):
    queryset = ServicioTaller.objects.all().select_related('cliente')
    permission_classes = [EsVentas | EsCaja | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['cliente__apellidos', 'cliente__codigo', 'matricula_cliente', 'descripcion_trabajo']
    ordering_fields = ['fecha_ingreso', 'estado']

    def get_serializer_class(self):
        if self.action == 'create':
            return ServicioTallerCreateSerializer
        return ServicioTallerSerializer

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='en-curso')
    def en_curso(self, request):
        servicios = self.get_queryset().filter(estado__in=['EN_CURSO', 'PRESUPUESTADO'])
        serializer = ServicioTallerSerializer(servicios, many=True)
        return Response(serializer.data)
