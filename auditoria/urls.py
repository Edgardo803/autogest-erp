"""AutoGest ERP — URLs de Auditoría"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventoAuditoriaViewSet, ProgramaAuditoriaViewSet, InformeAuditoriaViewSet

router = DefaultRouter()
router.register(r'eventos', EventoAuditoriaViewSet)
router.register(r'programas', ProgramaAuditoriaViewSet)
router.register(r'informes', InformeAuditoriaViewSet)

urlpatterns = [path('', include(router.urls))]
