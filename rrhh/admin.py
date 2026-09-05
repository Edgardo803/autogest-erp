from django.contrib import admin
from .models import Empleado, LiquidacionSueldo

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display  = ('legajo', 'apellidos', 'nombre', 'departamento', 'cargo', 'salario_bruto', 'fecha_ingreso', 'activo')
    list_filter   = ('departamento', 'activo')
    search_fields = ('nombre', 'apellidos', 'dni_nie', 'legajo')
    ordering      = ('apellidos', 'nombre')

@admin.register(LiquidacionSueldo)
class LiquidacionSueldoAdmin(admin.ModelAdmin):
    list_display  = ('empleado', 'periodo_mes', 'periodo_año', 'salario_bruto', 'deducciones', 'neto_a_pagar', 'pagado')
    list_filter   = ('pagado', 'periodo_año', 'periodo_mes')
    search_fields = ('empleado__nombre', 'empleado__apellidos')
    ordering      = ('-periodo_año', '-periodo_mes')
