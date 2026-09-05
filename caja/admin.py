from django.contrib import admin
from .models import MovimientoCaja, CuentaBancaria, Pagare, CierreDia

@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    list_display   = ('fecha', 'tipo', 'concepto', 'monto', 'numero_documento', 'cerrado_en_dia')
    list_filter    = ('tipo', 'concepto', 'cerrado_en_dia')
    search_fields  = ('descripcion', 'numero_documento')
    ordering       = ('-fecha', '-id')
    date_hierarchy = 'fecha'

@admin.register(CuentaBancaria)
class CuentaBancariaAdmin(admin.ModelAdmin):
    list_display  = ('banco', 'numero_cuenta', 'iban', 'saldo_actual', 'moneda')
    search_fields = ('banco', 'iban', 'numero_cuenta')
    ordering      = ('banco',)

@admin.register(Pagare)
class PagareAdmin(admin.ModelAdmin):
    list_display  = ('numero', 'emisor', 'monto', 'fecha_emision', 'fecha_vencimiento', 'estado')
    list_filter   = ('estado',)
    search_fields = ('numero', 'emisor')
    ordering      = ('fecha_vencimiento',)

@admin.register(CierreDia)
class CierreDiaAdmin(admin.ModelAdmin):
    list_display   = ('fecha', 'saldo_caja_apertura', 'total_ingresos', 'total_egresos', 'saldo_caja_cierre', 'autorizado_por')
    ordering       = ('-fecha',)
    date_hierarchy = 'fecha'
