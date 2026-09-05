"""AutoGest ERP — URLs de Accounts"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, PerfilView, me, listar_usuarios, AutoGestLoginView

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('', include(router.urls)),
    path('perfil/', PerfilView.as_view(), name='perfil'),
    path('me/', me, name='me'),
    path('listar/', listar_usuarios, name='listar-usuarios'),
    path('login/', AutoGestLoginView.as_view(), name='login'),
]
