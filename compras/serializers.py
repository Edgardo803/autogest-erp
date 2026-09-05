"""
AutoGest ERP — Serializers de Compras
"""
from rest_framework import serializers
from .models import Proveedor, CompraUnidad, PagoCompraUnidad, OrdenCompraInsumos, ItemOrdenCompra


class ProveedorSerializer(serializers.ModelSerializer):
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = Proveedor
        fields = [
            'id', 'codigo', 'razon_social', 'nombre_comercial', 'cif_nif',
            'tipo', 'tipo_display', 'telefono', 'email', 'direccion',
            'condiciones_pago', 'limite_credito', 'activo', 'creado_en',
        ]
        read_only_fields = ['codigo']


class PagoCompraUnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PagoCompraUnidad
        fields = [
            'id', 'compra', 'numero_cuota', 'fecha_vencimiento',
            'monto', 'fecha_pago', 'pagado',
        ]


class CompraUnidadSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.razon_social', read_only=True)
    unidad_display = serializers.CharField(source='unidad.__str__', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_compra_display', read_only=True)
    saldo_pendiente = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    pagos = PagoCompraUnidadSerializer(many=True, read_only=True)

    class Meta:
        model = CompraUnidad
        fields = [
            'id', 'proveedor', 'proveedor_nombre', 'unidad', 'unidad_display',
            'tipo_compra', 'tipo_display', 'fecha_compra',
            'precio_compra', 'anticipo_pagado', 'saldo_financiado',
            'saldo_pendiente', 'numero_factura_proveedor',
            'pagos', 'notas', 'creado_en',
        ]


class ItemOrdenCompraSerializer(serializers.ModelSerializer):
    repuesto_codigo = serializers.CharField(source='repuesto.codigo', read_only=True)
    repuesto_descripcion = serializers.CharField(source='repuesto.descripcion', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemOrdenCompra
        fields = [
            'id', 'orden', 'repuesto', 'repuesto_codigo', 'repuesto_descripcion',
            'cantidad_pedida', 'cantidad_recibida', 'precio_unitario', 'subtotal',
        ]


class OrdenCompraInsumosSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.razon_social', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    items = ItemOrdenCompraSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrdenCompraInsumos
        fields = [
            'id', 'numero_orden', 'proveedor', 'proveedor_nombre',
            'fecha_pedido', 'fecha_recepcion', 'estado', 'estado_display',
            'numero_factura', 'condiciones_pago', 'items', 'total', 'creado_en',
        ]
        read_only_fields = ['numero_orden']


class OrdenCompraInsumosCreateSerializer(serializers.ModelSerializer):
    items = ItemOrdenCompraSerializer(many=True, write_only=True)

    class Meta:
        model = OrdenCompraInsumos
        fields = ['proveedor', 'fecha_pedido', 'condiciones_pago', 'notas', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        orden = OrdenCompraInsumos.objects.create(**validated_data)
        for item_data in items_data:
            ItemOrdenCompra.objects.create(orden=orden, **item_data)
        return orden
