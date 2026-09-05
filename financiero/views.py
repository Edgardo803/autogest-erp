"""
AutoGest ERP — Views de Proyección Financiera
El módulo más diferencial del sistema.
Solo Tesorería y Gerencia acceden. Auditoría puede ver.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum

from accounts.permissions import EsTesoreria, EsGerenciaOAuditor, AuditorSoloLectura
from .models import ProyeccionFinanciera, ObligacionRecurrente
from core.serializers import ProyeccionFinancieraSerializer, ObligacionRecurrenteSerializer


def calcular_proyeccion(horizonte_dias=30):
    """
    Calcula la Proyección Financiera según la fórmula de las pautas:
    Proyección = (Caja + Pagarés vigentes + Σ Bancos) - (Cuotas unidades + Sueldos + Servicios + Proveedores)
    """
    from caja.models import MovimientoCaja, CuentaBancaria, Pagare
    from ventas.models import PagoVenta
    from compras.models import PagoCompraUnidad
    from rrhh.models import LiquidacionSueldo

    hoy = timezone.now().date()
    horizonte = hoy + timedelta(days=horizonte_dias)

    # ── ACTIVOS ──────────────────────────────────────────────
    # 1. Saldo de caja actual (ingresos - egresos históricos)
    total_ingresos = MovimientoCaja.objects.filter(
        tipo='INGRESO'
    ).aggregate(t=Sum('monto'))['t'] or Decimal('0')
    total_egresos = MovimientoCaja.objects.filter(
        tipo='EGRESO'
    ).aggregate(t=Sum('monto'))['t'] or Decimal('0')
    saldo_caja = total_ingresos - total_egresos

    # 2. Pagarés en cartera (vigentes hasta el horizonte)
    pagares = Pagare.objects.filter(
        estado='CARTERA',
        fecha_vencimiento__lte=horizonte
    ).aggregate(t=Sum('monto'))['t'] or Decimal('0')

    # 3. Saldo total en bancos
    saldo_bancos = CuentaBancaria.objects.filter(
        activo=True
    ).aggregate(t=Sum('saldo_actual'))['t'] or Decimal('0')

    # 4. Cobros previstos: cuotas de clientes a vencer
    cobros_previstos = PagoVenta.objects.filter(
        pagado=False,
        fecha_vencimiento__lte=horizonte
    ).aggregate(t=Sum('monto'))['t'] or Decimal('0')

    # ── PASIVOS ──────────────────────────────────────────────
    # 5. Cuotas de unidades a pagar a proveedores
    pagos_unidades = PagoCompraUnidad.objects.filter(
        pagado=False,
        fecha_vencimiento__lte=horizonte
    ).aggregate(t=Sum('monto'))['t'] or Decimal('0')

    # 6. Sueldos previstos (obligaciones recurrentes tipo SUELDO)
    sueldos = ObligacionRecurrente.objects.filter(
        activo=True, tipo='SUELDO'
    ).aggregate(t=Sum('monto_mensual'))['t'] or Decimal('0')
    # Aproximar cuántos meses quedan hasta el horizonte
    meses = max(1, horizonte_dias // 30)
    sueldos_total = sueldos * meses

    # 7. Servicios (Luz, Gas, etc.)
    servicios = ObligacionRecurrente.objects.filter(
        activo=True, tipo='SUMINIST'
    ).aggregate(t=Sum('monto_mensual'))['t'] or Decimal('0')
    servicios_total = servicios * meses

    # 8. Otros pagos a proveedores (insumos pendientes)
    pagos_insumos = Decimal('0')  # Se expande en versiones futuras

    # ── CALCULAR TOTALES ──────────────────────────────────────
    total_activos = saldo_caja + pagares + saldo_bancos + cobros_previstos
    total_pasivos = pagos_unidades + sueldos_total + servicios_total + pagos_insumos
    posicion_neta = total_activos - total_pasivos

    return {
        'fecha_calculo': timezone.now(),
        'fecha_horizonte': horizonte,
        'horizonte_dias': horizonte_dias,
        'saldo_caja_actual': saldo_caja,
        'pagares_en_cartera': pagares,
        'saldo_bancos': saldo_bancos,
        'cobros_previstos': cobros_previstos,
        'pagos_proveedores_unidades': pagos_unidades,
        'pagos_proveedores_insumos': pagos_insumos,
        'sueldos_previstos': sueldos_total,
        'servicios_previstos': servicios_total,
        'total_activos': total_activos,
        'total_pasivos': total_pasivos,
        'posicion_neta': posicion_neta,
        'alerta_activa': posicion_neta < Decimal('0'),
    }


class ProyeccionFinancieraViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Historial de proyecciones financieras — SOLO LECTURA.
    Las proyecciones se generan automáticamente o bajo demanda.
    """
    queryset = ProyeccionFinanciera.objects.all()
    serializer_class = ProyeccionFinancieraSerializer
    permission_classes = [EsTesoreria | EsGerenciaOAuditor]

    @action(detail=False, methods=['get'], url_path='calcular')
    def calcular(self, request):
        """
        Calcula la proyección en tiempo real para 30, 60 y 90 días.
        No guarda en BD — es una consulta en vivo.
        """
        resultado = {
            '30_dias': calcular_proyeccion(30),
            '60_dias': calcular_proyeccion(60),
            '90_dias': calcular_proyeccion(90),
        }
        return Response(resultado)

    @action(detail=False, methods=['post'], url_path='guardar-snapshot')
    def guardar_snapshot(self, request):
        """
        Guarda un snapshot de la proyección actual en la BD.
        Útil para histórico y reportes de auditoría.
        """
        horizonte_dias = int(request.data.get('horizonte_dias', 30))
        datos = calcular_proyeccion(horizonte_dias)
        proyeccion = ProyeccionFinanciera.objects.create(
            creado_por=request.user,
            **{k: v for k, v in datos.items() if k != 'horizonte_dias'}
        )
        serializer = ProyeccionFinancieraSerializer(proyeccion)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """
        Datos para el dashboard ejecutivo de Gerencia.
        Incluye proyección a 30 días + últimos snapshots.
        """
        proyeccion_actual = calcular_proyeccion(30)
        ultimos_snapshots = ProyeccionFinanciera.objects.order_by('-fecha_calculo')[:10]
        historico = ProyeccionFinancieraSerializer(ultimos_snapshots, many=True).data

        return Response({
            'proyeccion_actual': proyeccion_actual,
            'historico_snapshots': historico,
            'resumen': {
                'posicion_neta': proyeccion_actual['posicion_neta'],
                'alerta': proyeccion_actual['alerta_activa'],
                'saldo_caja': proyeccion_actual['saldo_caja_actual'],
                'saldo_bancos': proyeccion_actual['saldo_bancos'],
                'cobros_30_dias': proyeccion_actual['cobros_previstos'],
                'pagos_30_dias': proyeccion_actual['total_pasivos'],
            }
        })


class ObligacionRecurrenteViewSet(viewsets.ModelViewSet):
    queryset = ObligacionRecurrente.objects.filter(activo=True)
    serializer_class = ObligacionRecurrenteSerializer
    permission_classes = [EsTesoreria | EsGerenciaOAuditor, AuditorSoloLectura]
