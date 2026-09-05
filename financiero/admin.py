from django.contrib import admin
from .models import ProyeccionFinanciera, ObligacionRecurrente

@admin.register(ProyeccionFinanciera)
class ProyeccionFinancieraAdmin(admin.ModelAdmin):
    list_display   = ('fecha_calculo', 'fecha_horizonte', 'total_activos', 'total_pasivos', 'posicion_neta', 'alerta_activa', 'creado_por')
    list_filter    = ('alerta_activa',)
    ordering       = ('-fecha_calculo',)
    date_hierarchy = 'fecha_calculo'
    # Solo lectura — las proyecciones las genera el sistema automáticamente
    def has_add_permission(self, request):           return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(ObligacionRecurrente)
class ObligacionRecurrenteAdmin(admin.ModelAdmin):
    list_display  = ('descripcion', 'tipo', 'monto_mensual', 'dia_vencimiento', 'activo')
    list_filter   = ('tipo', 'activo')
    ordering      = ('tipo', 'dia_vencimiento')
