"""
AutoGest ERP — Vistas de Accounts
"""
from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Usuario
from .serializers import (
    UsuarioSerializer,
    UsuarioCreateSerializer,
    UsuarioUpdateSerializer,
    AutoGestTokenSerializer,
)
from .permissions import EsGerencia


class AutoGestLoginView(TokenObtainPairView):
    """Login personalizado que incluye datos del usuario en la respuesta."""
    serializer_class = AutoGestTokenSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    CRUD de usuarios — Solo Gerencia puede crear/editar/desactivar usuarios.
    """
    queryset = Usuario.objects.filter(activo_sistema=True)
    permission_classes = [IsAuthenticated, EsGerencia]

    def get_serializer_class(self):
        if self.action == 'create':
            return UsuarioCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UsuarioUpdateSerializer
        return UsuarioSerializer

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: desactiva en lugar de borrar."""
        usuario = self.get_object()
        usuario.activo_sistema = False
        usuario.save()
        return Response(
            {'detail': f'Usuario {usuario.username} desactivado correctamente.'},
            status=status.HTTP_200_OK
        )


class PerfilView(generics.RetrieveUpdateAPIView):
    """El usuario puede ver y editar su propio perfil."""
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UsuarioUpdateSerializer
        return UsuarioSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Devuelve los datos del usuario autenticado actual."""
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, EsGerencia])
def listar_usuarios(request):
    """Lista de todos los usuarios — solo Gerencia."""
    usuarios = Usuario.objects.all().order_by('last_name', 'first_name')
    serializer = UsuarioSerializer(usuarios, many=True)
    return Response(serializer.data)
