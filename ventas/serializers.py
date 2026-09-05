"""
AutoGest ERP — Serializers de Ventas
"""
from rest_framework import serializers
from .models import Cliente, VentaUnidad, PagoVenta, ServicioTaller, RepuestoUsadoEnServicio


class ClienteSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.CharField(read_only=True)

    class Meta:
        model = Cliente
        fields = [
            'id', 'codigo', 'nombre', 'apellidos', 'nombre_completo',
            'dni_nie', 'telefono', 'email', 'direccion', 'activo', 'creado_en',
        ]
        read_only_fields = ['codigo']


class PagoVentaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoVenta
        fields = [
            'id', 'venta', 'numero_cuota', 'fecha_vencimiento',
            'monto', 'fecha_pago', 'pagado',
        ]


class VentaUnidadSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.CharField(source='cliente.__str__', read_only=True)
    unidad_display = serializers.CharField(source='unidad.__str__', read_only=True)
    vendedor_nombre = serializers.CharField(source='vendedor.get_full_name', read_only=True)
    estado_pago_display = serializers.CharField(source='get_estado_pago_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    pagos = PagoVentaSerializer(many=True, read_only=True)

    class Meta:
        model = VentaUnidad
        fields = [
            'id', 'cliente', 'cliente_nombre', 'unidad', 'unidad_display',
            'vendedor', 'vendedor_nombre', 'fecha_venta',
            'precio_acordado', 'anticipo', 'monto_financiado',
            'estado_pago', 'estado_pago_display', 'saldo_pendiente',
            'observaciones', 'pagos', 'creado_en',
        ]


class VentaUnidadCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear una venta con sus cuotas."""
    cuotas = PagoVentaSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = VentaUnidad
        fields = [
            'cliente', 'unidad', 'vendedor', 'fecha_venta',
            'precio_acordado', 'anticipo', 'monto_financiado',
            'estado_pago', 'observaciones', 'cuotas',
        ]

    def create(self, validated_data):
        cuotas_data = validated_data.pop('cuotas', [])
        venta = VentaUnidad.objects.create(**validated_data)
        for cuota_data in cuotas_data:
            PagoVenta.objects.create(venta=venta, **cuota_data)
        return venta


class RepuestoUsadoSerializer(serializers.ModelSerializer):
    repuesto_codigo = serializers.CharField(source='repuesto.codigo', read_only=True)
    repuesto_descripcion = serializers.CharField(source='repuesto.descripcion', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = RepuestoUsadoEnServicio
        fields = [
            'id', 'servicio', 'repuesto', 'repuesto_codigo', 'repuesto_descripcion',
            'cantidad', 'precio_unitario', 'subtotal',
        ]


class ServicioTallerSerializer(serializers.ModelSerializer):
    cliente_nombre = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_display   = serializers.CharField(source='get_tipo_display', read_only=True)
    unidad_display = serializers.SerializerMethodField()
    repuestos_usados = RepuestoUsadoSerializer(many=True, read_only=True)
    subtotal_mano_obra = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal_repuestos = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_factura = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    def get_cliente_nombre(self, obj):
        return str(obj.cliente) if obj.cliente else 'USO INTERNO'

    def get_unidad_display(self, obj):
        if obj.unidad:
            mod = str(obj.unidad.modelo) if obj.unidad.modelo else 'Unidad'
            ref = obj.unidad.matricula or obj.unidad.numero_serie or f'#{obj.unidad.id}'
            return f"{mod} | {ref}"
        return obj.matricula_cliente or '—'

    class Meta:
        model = ServicioTaller
        fields = [
            'id', 'tipo', 'tipo_display',
            'cliente', 'cliente_nombre', 'unidad', 'unidad_display', 'matricula_cliente',
            'fecha_ingreso', 'fecha_entrega_estimada', 'estado', 'estado_display',
            'descripcion_trabajo', 'horas_mano_obra', 'precio_hora',
            'subtotal_mano_obra', 'repuestos_usados', 'subtotal_repuestos',
            'total_factura', 'costo_imputado_a_unidad', 'notas', 'creado_en',
        ]


class ServicioTallerCreateSerializer(serializers.ModelSerializer):
    repuestos = RepuestoUsadoSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = ServicioTaller
        fields = [
            'tipo', 'cliente', 'unidad', 'matricula_cliente',
            'fecha_ingreso', 'fecha_entrega_estimada', 'estado',
            'descripcion_trabajo', 'horas_mano_obra', 'precio_hora',
            'notas', 'repuestos',
        ]

    def validate(self, data):
        """ORI: nunca puede pasar a FACTURADO."""
        if data.get('tipo') == 'ORI' and data.get('estado') == 'FACTURADO':
            raise serializers.ValidationError(
                'Las ORI (Órdenes de Reparación Interna) no pueden facturarse. '
                'Son de uso interno y no generan movimiento de caja.'
            )
        return data

    def create(self, validated_data):
        repuestos_data = validated_data.pop('repuestos', [])
        servicio = ServicioTaller.objects.create(**validated_data)
        for rep_data in repuestos_data:
            RepuestoUsadoEnServicio.objects.create(servicio=servicio, **rep_data)
        return servicio
