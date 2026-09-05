from django.contrib import admin
from .models import Cliente, VentaUnidad, PagoVenta, ServicioTaller

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display  = ('codigo', 'apellidos', 'nombre', 'telefono', 'email', 'activo')
    list_filter   = ('activo',)
    search_fields = ('nombre', 'apellidos', 'dni_nie', 'telefono', 'email', 'codigo')
    ordering      = ('apellidos', 'nombre')

@admin.register(VentaUnidad)
class VentaUnidadAdmin(admin.ModelAdmin):
    list_display  = ('id', 'cliente', 'unidad', 'fecha_venta', 'precio_acordado', 'anticipo', 'estado_pago')
    list_filter   = ('estado_pago', 'fecha_venta')
    search_fields = ('cliente__nombre', 'cliente__apellidos', 'unidad__numero_serie', 'unidad__matricula')
    ordering      = ('-fecha_venta',)

@admin.register(PagoVenta)
class PagoVentaAdmin(admin.ModelAdmin):
    list_display  = ('venta', 'numero_cuota', 'fecha_vencimiento', 'monto', 'pagado', 'fecha_pago')
    list_filter   = ('pagado',)
    ordering      = ('fecha_vencimiento',)

@admin.register(ServicioTaller)
class ServicioTallerAdmin(admin.ModelAdmin):
    list_display  = ('id', 'cliente', 'matricula_cliente', 'descripcion_trabajo', 'estado', 'fecha_ingreso')
    list_filter   = ('estado',)
    search_fields = ('cliente__nombre', 'matricula_cliente', 'descripcion_trabajo')
    ordering      = ('-fecha_ingreso',)
