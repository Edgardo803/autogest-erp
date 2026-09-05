from django.contrib import admin
from .models import Proveedor, CompraUnidad, PagoCompraUnidad, OrdenCompraInsumos

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display  = ('codigo', 'razon_social', 'nombre_comercial', 'cif_nif', 'tipo', 'condiciones_pago', 'limite_credito')
    list_filter   = ('tipo',)
    search_fields = ('razon_social', 'nombre_comercial', 'cif_nif', 'codigo')
    ordering      = ('razon_social',)

@admin.register(CompraUnidad)
class CompraUnidadAdmin(admin.ModelAdmin):
    list_display  = ('id', 'unidad', 'proveedor', 'tipo_compra', 'fecha_compra', 'precio_compra', 'anticipo_pagado', 'saldo_financiado')
    list_filter   = ('tipo_compra', 'proveedor')
    search_fields = ('unidad__numero_serie', 'proveedor__razon_social', 'numero_factura_proveedor')
    ordering      = ('-fecha_compra',)

@admin.register(PagoCompraUnidad)
class PagoCompraUnidadAdmin(admin.ModelAdmin):
    list_display  = ('compra', 'numero_cuota', 'fecha_vencimiento', 'monto', 'pagado', 'fecha_pago')
    list_filter   = ('pagado',)
    ordering      = ('fecha_vencimiento',)

@admin.register(OrdenCompraInsumos)
class OrdenCompraInsumosAdmin(admin.ModelAdmin):
    list_display  = ('numero_orden', 'proveedor', 'fecha_pedido', 'estado')
    list_filter   = ('estado', 'proveedor')
    ordering      = ('-fecha_pedido',)
