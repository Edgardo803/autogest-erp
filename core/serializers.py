"""
AutoGest ERP — Serializers de Caja, Financiero, RRHH y Auditoría
"""
# ============================================================
# CAJA
# ============================================================
from rest_framework import serializers
from caja.models import MovimientoCaja, CuentaBancaria, Pagare, CierreDia
from financiero.models import ProyeccionFinanciera, ObligacionRecurrente
from rrhh.models import Empleado, LiquidacionSueldo
from auditoria.models import EventoAuditoria, ProgramaAuditoria, InformeAuditoria


class MovimientoCajaSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    concepto_display = serializers.CharField(source='get_concepto_display', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)

    class Meta:
        model = MovimientoCaja
        fields = [
            'id', 'tipo', 'tipo_display', 'concepto', 'concepto_display',
            'monto', 'fecha', 'descripcion', 'numero_documento',
            'referencia_venta_id', 'referencia_compra_id', 'referencia_servicio_id',
            'cerrado_en_dia', 'creado_por_nombre', 'creado_en',
        ]


class CuentaBancariaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CuentaBancaria
        fields = ['id', 'banco', 'numero_cuenta', 'iban', 'saldo_actual', 'moneda', 'activo']


class PagareSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Pagare
        fields = [
            'id', 'numero', 'emisor', 'monto',
            'fecha_emision', 'fecha_vencimiento',
            'estado', 'estado_display', 'referencia_venta_id',
        ]


class CierreDiaSerializer(serializers.ModelSerializer):
    autorizado_por_nombre = serializers.CharField(
        source='autorizado_por.get_full_name', read_only=True
    )

    class Meta:
        model = CierreDia
        fields = [
            'id', 'fecha', 'saldo_caja_apertura', 'total_ingresos',
            'total_egresos', 'saldo_caja_cierre', 'operaciones_pendientes',
            'autorizado_por', 'autorizado_por_nombre', 'observaciones',
        ]


# ============================================================
# FINANCIERO — Proyección Financiera
# ============================================================
class ProyeccionFinancieraSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProyeccionFinanciera
        fields = [
            'id', 'fecha_calculo', 'fecha_horizonte',
            'saldo_caja_actual', 'pagares_en_cartera', 'saldo_bancos', 'cobros_previstos',
            'pagos_proveedores_unidades', 'pagos_proveedores_insumos',
            'sueldos_previstos', 'servicios_previstos',
            'total_activos', 'total_pasivos', 'posicion_neta',
            'alerta_activa',
        ]
        read_only_fields = ['total_activos', 'total_pasivos', 'posicion_neta']


class ObligacionRecurrenteSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = ObligacionRecurrente
        fields = [
            'id', 'descripcion', 'tipo', 'tipo_display',
            'monto_mensual', 'dia_vencimiento',
            'referencia_empleado_id', 'activo',
        ]


# ============================================================
# RRHH
# ============================================================
class EmpleadoSerializer(serializers.ModelSerializer):
    departamento_display = serializers.CharField(source='get_departamento_display', read_only=True)

    class Meta:
        model = Empleado
        fields = [
            'id', 'legajo', 'nombre', 'apellidos', 'dni_nie',
            'fecha_nacimiento', 'fecha_ingreso',
            'departamento', 'departamento_display', 'cargo',
            'salario_bruto', 'email', 'telefono', 'activo',
        ]


class LiquidacionSueldoSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.__str__', read_only=True)

    class Meta:
        model = LiquidacionSueldo
        fields = [
            'id', 'empleado', 'empleado_nombre',
            'periodo_mes', 'periodo_año',
            'salario_bruto', 'deducciones', 'adicionales', 'neto_a_pagar',
            'fecha_pago', 'pagado',
        ]


# ============================================================
# AUDITORÍA
# ============================================================
class EventoAuditoriaSerializer(serializers.ModelSerializer):
    """Solo lectura — los eventos son inmutables."""
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    modulo_display = serializers.CharField(source='get_modulo_display', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.get_full_name', read_only=True)

    class Meta:
        model = EventoAuditoria
        fields = [
            'id', 'timestamp', 'nivel', 'nivel_display',
            'modulo', 'modulo_display', 'accion', 'descripcion',
            'usuario', 'usuario_nombre', 'ip_origen',
            'objeto_tipo', 'objeto_id',
            'datos_previos', 'datos_nuevos',
        ]
        read_only_fields = fields  # Inmutable


class ProgramaAuditoriaSerializer(serializers.ModelSerializer):
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    modulo_display = serializers.CharField(source='get_modulo_objetivo_display', read_only=True)
    responsable_nombre = serializers.CharField(source='responsable.get_full_name', read_only=True)

    class Meta:
        model = ProgramaAuditoria
        fields = [
            'id', 'titulo', 'modulo_objetivo', 'modulo_display',
            'fecha_programada', 'fecha_realizacion',
            'estado', 'estado_display',
            'responsable', 'responsable_nombre',
            'objetivos', 'hallazgos', 'recomendaciones',
            'informe_generado', 'creado_en',
        ]


class InformeAuditoriaSerializer(serializers.ModelSerializer):
    """SOLO visible para Gerencia General."""
    programa_titulo = serializers.CharField(source='programa.titulo', read_only=True)

    class Meta:
        model = InformeAuditoria
        fields = [
            'id', 'programa', 'programa_titulo',
            'fecha_informe', 'resumen_ejecutivo', 'observaciones',
            'nivel_riesgo', 'acciones_requeridas', 'fecha_seguimiento',
        ]
