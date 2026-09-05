"""
AutoGest ERP — Views de Auditoría General
REPORTA EXCLUSIVAMENTE A GERENCIA GENERAL.
El Auditor tiene acceso de solo lectura a todos los módulos.
Los Informes solo los ve Gerencia.
"""
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import EsGerencia, EsAuditor, EsGerenciaOAuditor
from .models import EventoAuditoria, ProgramaAuditoria, InformeAuditoria
from core.serializers import (
    EventoAuditoriaSerializer,
    ProgramaAuditoriaSerializer,
    InformeAuditoriaSerializer,
)


class EventoAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Registro inmutable de eventos. Solo lectura para Gerencia y Auditoría.
    NUNCA se pueden crear, editar ni eliminar desde la API.
    """
    queryset = EventoAuditoria.objects.all().select_related('usuario')
    serializer_class = EventoAuditoriaSerializer
    permission_classes = [EsGerenciaOAuditor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['modulo', 'accion', 'descripcion', 'usuario__username']
    ordering_fields = ['timestamp', 'nivel', 'modulo']

    @action(detail=False, methods=['get'], url_path='criticos')
    def criticos(self, request):
        """Eventos de nivel CRÍTICO y ALERTA."""
        eventos = self.get_queryset().filter(nivel__in=['CRITICO', 'ALERTA'])
        serializer = EventoAuditoriaSerializer(eventos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-modulo')
    def por_modulo(self, request):
        """Filtra eventos por módulo. Uso: ?modulo=CAJA"""
        modulo = request.query_params.get('modulo', '')
        eventos = self.get_queryset().filter(modulo=modulo.upper())
        serializer = EventoAuditoriaSerializer(eventos, many=True)
        return Response(serializer.data)


class ProgramaAuditoriaViewSet(viewsets.ModelViewSet):
    """
    Cronograma de auditorías — Auditor y Gerencia pueden crear/editar.
    """
    queryset = ProgramaAuditoria.objects.all().select_related('responsable')
    serializer_class = ProgramaAuditoriaSerializer
    permission_classes = [EsGerenciaOAuditor]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['titulo', 'modulo_objetivo']
    ordering_fields = ['fecha_programada', 'estado']

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    @action(detail=False, methods=['get'], url_path='pendientes')
    def pendientes(self, request):
        """Auditorías programadas o en proceso."""
        pendientes = self.get_queryset().filter(
            estado__in=['PROGRAMADA', 'EN_PROCESO']
        ).order_by('fecha_programada')
        serializer = ProgramaAuditoriaSerializer(pendientes, many=True)
        return Response(serializer.data)


class InformeAuditoriaViewSet(viewsets.ModelViewSet):
    """
    Informes de Auditoría — El Auditor redacta, Gerencia General aprueba y es destinataria.
    Ambos roles pueden crear y leer informes.
    """
    queryset = InformeAuditoria.objects.all().select_related('programa')
    serializer_class = InformeAuditoriaSerializer
    permission_classes = [EsGerenciaOAuditor]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
