"""
AutoGest ERP — Serializers de Accounts
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario, Rol


class UsuarioSerializer(serializers.ModelSerializer):
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    nombre_completo = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nombre_completo', 'rol', 'rol_display', 'telefono',
            'activo_sistema', 'ultimo_acceso_ip', 'fecha_creacion',
            'es_gerencia', 'es_auditor', 'puede_ver_financiero', 'puede_ver_todo',
        ]
        read_only_fields = ['id', 'fecha_creacion', 'ultimo_acceso_ip']


class UsuarioCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, label='Confirmar contraseña')

    class Meta:
        model = Usuario
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'rol', 'telefono', 'password', 'password2',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Las contraseñas no coinciden.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UsuarioUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['email', 'first_name', 'last_name', 'telefono', 'activo_sistema']


class AutoGestTokenSerializer(TokenObtainPairSerializer):
    """
    JWT personalizado: incluye datos del usuario en el token
    para que el frontend los use sin hacer requests adicionales.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['nombre_completo'] = user.get_full_name()
        token['rol'] = user.rol
        token['rol_display'] = user.get_rol_display()
        token['es_gerencia'] = user.es_gerencia
        token['es_auditor'] = user.es_auditor
        token['puede_ver_financiero'] = user.puede_ver_financiero
        token['puede_ver_todo'] = user.puede_ver_todo
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Añadir info del usuario en la respuesta de login
        data['usuario'] = {
            'id': self.user.id,
            'username': self.user.username,
            'nombre_completo': self.user.get_full_name(),
            'rol': self.user.rol,
            'rol_display': self.user.get_rol_display(),
            'email': self.user.email,
        }
        return data
