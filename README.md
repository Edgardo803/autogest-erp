# 🚗 AutoGest ERP

> Sistema de Gestión Empresarial para Concesionaria de Vehículos  
> **TFM — Máster en Desarrollo Full Stack**

[![Django](https://img.shields.io/badge/Django-6.1-092E20?logo=django)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Descripción

AutoGest ERP es una aplicación web completa de gestión empresarial diseñada específicamente para concesionarias de vehículos. Integra todos los procesos operativos en una sola plataforma: ventas, compras, inventario, taller, caja, recursos humanos y proyección financiera.

### Problema que resuelve

Las pequeñas y medianas concesionarias suelen gestionar sus operaciones con hojas de cálculo dispersas, sin trazabilidad, sin control de roles y sin visibilidad financiera en tiempo real. AutoGest ERP centraliza toda la operación en un único sistema seguro, auditable y accesible desde cualquier navegador.

---

## 🏗️ Arquitectura

```
autogest-erp/
├── backend/                   # Django 6.1 + Django REST Framework
│   ├── accounts/              # Usuarios y 8 roles de acceso
│   ├── ventas/                # Ventas de unidades + Taller (OT/ORI)
│   ├── compras/               # Compras a proveedores + cuotas
│   ├── inventario/            # Stock de vehículos y repuestos
│   ├── caja/                  # Movimientos de caja
│   ├── financiero/            # Proyección financiera automatizada
│   ├── rrhh/                  # Nómina y liquidaciones
│   ├── auditoria/             # Trazabilidad de cambios
│   └── informes/              # Generación de reportes PDF
│
└── frontend/                  # React 19 + Vite + TypeScript
    └── src/
        ├── pages/             # 11 módulos completos
        ├── components/        # Modales, formularios, layout
        ├── api/               # Cliente Axios centralizado
        └── context/           # Autenticación JWT global
```

---

## ⚡ Tecnologías utilizadas

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Django | 6.1 | Framework principal |
| Django REST Framework | 3.18 | API REST |
| SimpleJWT | 5.5 | Autenticación JWT |
| django-auditlog | 3.4 | Trazabilidad automática |
| django-cors-headers | 4.9 | CORS para el frontend |
| WhiteNoise | 6.12 | Servir estáticos en producción |
| SQLite | — | Base de datos (dev) |

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 19 | UI framework |
| TypeScript | 5 | Tipado estático |
| Vite | 6 | Build tool |
| TanStack Query | 5 | Server state management |
| Recharts | 2 | Gráficos y visualizaciones |
| jsPDF + autoTable | — | Generación de PDF |
| Axios | — | Cliente HTTP |

---

## 🚀 Instalación local

### Requisitos previos
- Python 3.11+
- Node.js 18+
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/Edgardo803/autogest-erp.git
cd autogest-erp
```

### 2. Configurar el backend

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu SECRET_KEY

# Crear base de datos y aplicar migraciones
python manage.py migrate

# Cargar datos de demostración
python manage.py loaddata fixtures/demo_data.json

# Iniciar el servidor
python manage.py runserver 8000
```

### 3. Configurar el frontend

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

### 4. Acceder al sistema

- **Portal principal:** http://localhost:5173
- **API backend:** http://localhost:8000
- **Panel admin:** http://localhost:8000/admin

---

## 👥 Credenciales de acceso (demo)

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `gerencia` | `AutoGest2026!` | Gerencia General — acceso total |
| `auditoria` | `Audit2026!` | Auditoría interna |
| `ventas01` | `Ventas2026!` | Ejecutivo de ventas |
| `tesoreria` | `Tesor2026!` | Tesorería y caja |

---

## 🎯 Funcionalidades principales

### 📊 Dashboard
- KPIs en tiempo real: ventas del mes, stock disponible, saldo de caja
- Alertas de stock crítico y pagos vencidos
- Acceso rápido a todas las secciones

### 🚗 Ventas
- Registro de ventas con anticipo y financiación
- Gestión de clientes
- Seguimiento del estado de cobro

### 🏭 Compras
- Compras de unidades a proveedores (NUEVA/USADA/CONSIGNACIÓN)
- Control de anticipos y saldo pendiente real
- Plan de cuotas por compra

### 📦 Inventario
- Stock de vehículos con estado (Nueva, Usada, Consignación, Reservada, Vendida)
- Catálogo de repuestos
- Indicadores de valor y margen de stock

### 🔧 Taller
- **OT (Órdenes de Trabajo):** Servicios a clientes con facturación
- **ORI (Órdenes de Reparación Interna):** Preparación de usadas para venta — sin movimiento de caja
- Desglose de mano de obra y repuestos

### 💰 Caja
- Registro de ingresos y egresos
- Saldo actual y saldo inicial configurable
- Historial completo de movimientos

### 📈 Proyección Financiera
- Cálculo automático a 30/60/90 días
- Activos vs. Pasivos proyectados
- Gráfico comparativo por horizonte temporal
- Guardar snapshots para comparación histórica

### 👔 RRHH
- Liquidaciones salariales mensuales
- Control de pagos: bruto, deducciones, neto
- Marcado de nóminas pagadas

### 📄 Informes PDF
- 6 informes generables: Ventas, Caja, Inventario, Nómina, Compras, Taller
- Filtro por rango de fechas configurable
- Cabecera corporativa, tablas formateadas y pie de página

### 🔍 Auditoría
- Registro automático de todos los cambios del sistema
- Quién hizo qué y cuándo
- Filtros por acción (crear/editar/eliminar) y fecha

---

## 🔒 Seguridad

- **Autenticación JWT** con refresh tokens y blacklist al logout
- **8 roles** con permisos granulares por endpoint
- Protección **CSRF** configurada
- **CORS** configurado por origen
- Contraseñas con hash bcrypt
- Variables sensibles en `.env` (nunca en el repositorio)

---

## 📁 Datos de demostración

El archivo `fixtures/demo_data.json` contiene datos realistas precargados:
- 4 usuarios con distintos roles
- 5 marcas y 14 modelos de vehículos
- 10 unidades en stock con distintos estados
- 7 ventas realizadas
- 8 compras a proveedores con cuotas
- 8 proveedores
- 12 órdenes de taller (9 OT + 3 ORI)
- Movimientos de caja del período
- Liquidaciones de nómina

---

## 🌐 Despliegue

El proyecto está configurado para despliegue con WhiteNoise (sirve el frontend React desde Django en un único servidor).

Para producción en Railway/Render:
1. Configurar variables de entorno en el panel del servicio
2. El `Procfile` o `railway.toml` puede añadirse para el proceso de arranque

---

## 📝 Autor

**Edgardo Burgos**  
Máster en Desarrollo Full Stack  
TFM — Proyecto Final de Máster

---

## 📄 Licencia

MIT License — ver [LICENSE](LICENSE) para más detalles.
