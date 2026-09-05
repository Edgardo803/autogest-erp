from django.contrib import admin
from .models import Marca, Modelo, Unidad, Repuesto, CategoriaRepuesto

@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display  = ('nombre', 'pais_origen')
    search_fields = ('nombre',)
    ordering      = ('nombre',)

@admin.register(Modelo)
class ModeloAdmin(admin.ModelAdmin):
    list_display  = ('marca', 'nombre', 'año', 'tipo')
    list_filter   = ('marca', 'tipo', 'año')
    search_fields = ('nombre', 'marca__nombre')
    ordering      = ('marca', 'nombre')

@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display  = ('numero_serie', 'modelo', 'matricula', 'color', 'kilometros', 'estado', 'precio_costo', 'precio_venta', 'fecha_ingreso')
    list_filter   = ('estado', 'modelo__marca')
    search_fields = ('numero_serie', 'matricula', 'color', 'modelo__nombre', 'modelo__marca__nombre')
    ordering      = ('-fecha_ingreso',)

@admin.register(CategoriaRepuesto)
class CategoriaRepuestoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'codigo')

@admin.register(Repuesto)
class RepuestoAdmin(admin.ModelAdmin):
    list_display  = ('codigo', 'descripcion', 'categoria', 'stock_actual', 'stock_minimo', 'precio_costo', 'precio_venta')
    list_filter   = ('categoria',)
    search_fields = ('codigo', 'descripcion')
    ordering      = ('descripcion',)
