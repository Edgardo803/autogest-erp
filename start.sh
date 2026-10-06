#!/bin/sh
set -e

echo "==> Aplicando migraciones de base de datos..."
python manage.py migrate --noinput

echo "==> Cargando fixture de datos demo..."
python manage.py loaddata fixtures/demo_data.json --ignorenonexistent 2>/dev/null || true

echo "==> Asegurando usuarios de demostracion..."
python manage.py init_production || true

echo "==> Recolectando archivos estaticos..."
python manage.py collectstatic --noinput

echo "==> Iniciando servidor Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2
