"""AutoGest ERP — URLs de Core"""
from django.urls import path
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import EsGerencia
from .models import Empresa
from rest_framework import serializers

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'

class EmpresaView(generics.RetrieveUpdateAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [EsGerencia]
    def get_object(self):
        return Empresa.objects.first()

urlpatterns = [
    path('empresa/', EmpresaView.as_view(), name='empresa'),
]
