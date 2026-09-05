"""
AutoGest ERP — Serializers de Inventario
"""
from rest_framework import serializers
from .models import Marca, Modelo, Unidad, CategoriaRepuesto, Repuesto


class MarcaSerializer(serializers.ModelSerializer):
    modelos = serializers.SerializerMethodField()

    def get_modelos(self, obj):
        return [
            {'id': m.id, 'nombre': m.nombre, 'año': m.año, 'tipo': m.tipo}
            for m in obj.modelos.filter(activo=True).order_by('nombre', '-año')
        ]

    class Meta:
        model = Marca
        fields = ['id', 'nombre', 'pais_origen', 'activo', 'modelos']


class ModeloSerializer(serializers.ModelSerializer):
    marca_nombre = serializers.CharField(source='marca.nombre', read_only=True)

    class Meta:
        model = Modelo
        fields = ['id', 'marca', 'marca_nombre', 'nombre', 'año', 'tipo', 'activo']


class UnidadSerializer(serializers.ModelSerializer):
    modelo_display = serializers.CharField(source='modelo.__str__', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.razon_social', read_only=True)

    class Meta:
        model = Unidad
        fields = [
            'id', 'modelo', 'modelo_display', 'numero_serie', 'matricula',
            'color', 'kilometros', 'estado', 'estado_display',
            'precio_costo', 'precio_venta', 'proveedor', 'proveedor_nombre',
            'fecha_ingreso', 'fecha_venta', 'activo', 'notas', 'creado_en',
        ]


class UnidadListSerializer(serializers.ModelSerializer):
    """Versión resumida para listados."""
    modelo_display = serializers.CharField(source='modelo.__str__', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = Unidad
        fields = [
            'id', 'modelo_display', 'numero_serie', 'matricula',
            'estado', 'estado_display', 'precio_venta', 'kilometros',
        ]


class CategoriaRepuestoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaRepuesto
        fields = ['id', 'codigo', 'nombre', 'activo']


class RepuestoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    stock_bajo = serializers.BooleanField(read_only=True)

    class Meta:
        model = Repuesto
        fields = [
            'id', 'codigo', 'descripcion', 'categoria', 'categoria_nombre',
            'stock_actual', 'stock_minimo', 'stock_bajo',
            'precio_costo', 'precio_venta', 'unidad_medida', 'activo',
        ]
