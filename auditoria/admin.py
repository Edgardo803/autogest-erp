from django.contrib import admin
from .models import EventoAuditoria, ProgramaAuditoria, InformeAuditoria

@admin.register(EventoAuditoria)
class EventoAuditoriaAdmin(admin.ModelAdmin):
    list_display   = ('timestamp', 'nivel', 'modulo', 'accion', 'usuario')
    list_filter    = ('nivel', 'modulo', 'accion')
    search_fields  = ('descripcion', 'usuario__username', 'modulo')
    ordering       = ('-timestamp',)
    date_hierarchy = 'timestamp'
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False

@admin.register(ProgramaAuditoria)
class ProgramaAuditoriaAdmin(admin.ModelAdmin):
    list_display  = ('titulo', 'modulo_objetivo', 'fecha_programada', 'estado', 'responsable')
    list_filter   = ('estado', 'modulo_objetivo')
    ordering      = ('fecha_programada',)

@admin.register(InformeAuditoria)
class InformeAuditoriaAdmin(admin.ModelAdmin):
    list_display  = ('programa', 'fecha_informe', 'nivel_riesgo', 'creado_por')
    list_filter   = ('nivel_riesgo',)
    ordering      = ('-fecha_informe',)
