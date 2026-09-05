"""
AutoGest ERP — Views de Caja y Tesorería
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.utils import timezone
from accounts.permissions import EsCaja, EsTesoreria, EsGerenciaOAuditor, AuditorSoloLectura
from .models import MovimientoCaja, CuentaBancaria, Pagare, CierreDia
from core.serializers import (
    MovimientoCajaSerializer, CuentaBancariaSerializer,
    PagareSerializer, CierreDiaSerializer,
)


class MovimientoCajaViewSet(viewsets.ModelViewSet):
    """
    Registro central de todos los movimientos de caja.
    NOTA: Solo Caja y Tesorería pueden crear movimientos.
    Auditoría puede ver todo pero no modificar.
    """
    queryset = MovimientoCaja.objects.all().select_related('creado_por')
    serializer_class = MovimientoCajaSerializer
    permission_classes = [EsCaja | EsTesoreria | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['descripcion', 'numero_documento', 'concepto']
    ordering_fields = ['fecha', 'monto', 'tipo']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Los movimientos de caja NO se eliminan — solo se anulan con un contra-asiento."""
        return Response(
            {'detail': 'No se pueden eliminar movimientos de caja. Use un contra-asiento.'},
            status=status.HTTP_403_FORBIDDEN
        )

    @action(detail=False, methods=['get'], url_path='resumen-hoy')
    def resumen_hoy(self, request):
        """Resumen de movimientos del día actual."""
        hoy = timezone.now().date()
        movimientos = self.get_queryset().filter(fecha=hoy)
        ingresos = movimientos.filter(tipo='INGRESO').aggregate(total=Sum('monto'))['total'] or 0
        egresos = movimientos.filter(tipo='EGRESO').aggregate(total=Sum('monto'))['total'] or 0
        return Response({
            'fecha': hoy,
            'total_ingresos': ingresos,
            'total_egresos': egresos,
            'saldo_dia': ingresos - egresos,
            'cantidad_movimientos': movimientos.count(),
            'sin_cerrar': movimientos.filter(cerrado_en_dia=False).count(),
        })

    @action(detail=False, methods=['get'], url_path='pendientes-cierre')
    def pendientes_cierre(self, request):
        """Movimientos del día no incluidos en cierre."""
        movimientos = self.get_queryset().filter(cerrado_en_dia=False)
        serializer = MovimientoCajaSerializer(movimientos, many=True)
        return Response(serializer.data)


class CuentaBancariaViewSet(viewsets.ModelViewSet):
    queryset = CuentaBancaria.objects.filter(activo=True)
    serializer_class = CuentaBancariaSerializer
    permission_classes = [EsTesoreria | EsGerenciaOAuditor, AuditorSoloLectura]

    @action(detail=False, methods=['get'], url_path='saldo-total')
    def saldo_total(self, request):
        total = self.get_queryset().aggregate(total=Sum('saldo_actual'))['total'] or 0
        cuentas = CuentaBancariaSerializer(self.get_queryset(), many=True)
        return Response({
            'saldo_total_bancos': total,
            'cuentas': cuentas.data,
        })


class PagareViewSet(viewsets.ModelViewSet):
    queryset = Pagare.objects.all()
    serializer_class = PagareSerializer
    permission_classes = [EsCaja | EsTesoreria | EsGerenciaOAuditor, AuditorSoloLectura]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['numero', 'emisor']
    ordering_fields = ['fecha_vencimiento', 'monto', 'estado']

    @action(detail=False, methods=['get'], url_path='en-cartera')
    def en_cartera(self, request):
        """Pagarés activos en cartera (para proyección financiera)."""
        from django.db.models import Sum
        pagares = self.get_queryset().filter(estado='CARTERA')
        total = pagares.aggregate(total=Sum('monto'))['total'] or 0
        return Response({
            'total_en_cartera': total,
            'cantidad': pagares.count(),
            'pagares': PagareSerializer(pagares, many=True).data,
        })


class CierreDiaViewSet(viewsets.ModelViewSet):
    queryset = CierreDia.objects.all()
    serializer_class = CierreDiaSerializer
    permission_classes = [EsTesoreria | EsGerenciaOAuditor, AuditorSoloLectura]

    def perform_create(self, serializer):
        serializer.save(
            creado_por=self.request.user,
            autorizado_por=self.request.user
        )
