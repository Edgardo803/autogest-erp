"""
AutoGest ERP — Comando: cargar_datos_demo
Genera datos realistas de una concesionaria de automóviles para
demostrar el funcionamiento integral del sistema, especialmente
la Proyección Financiera Nativa.

Uso: python manage.py cargar_datos_demo
     python manage.py cargar_datos_demo --limpiar  (borra todo y recarga)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Carga datos de demostración realistas para AutoGest ERP'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpiar',
            action='store_true',
            help='Elimina todos los datos existentes antes de cargar',
        )

    def handle(self, *args, **options):
        if options['limpiar']:
            self._limpiar_datos()

        self.stdout.write(self.style.MIGRATE_HEADING('\n🚗 AutoGest ERP — Cargando datos de demostración...\n'))

        with transaction.atomic():
            self._cargar_marcas_modelos()
            self._cargar_proveedores()
            self._cargar_unidades()
            self._cargar_compras_unidades()
            self._cargar_clientes()
            self._cargar_ventas()
            self._cargar_servicios_taller()
            self._cargar_empleados()
            self._cargar_obligaciones_recurrentes()
            self._cargar_cuentas_bancarias()
            self._cargar_pagares()
            self._cargar_movimientos_caja()

        self.stdout.write(self.style.SUCCESS('\n✅ Datos de demostración cargados correctamente.\n'))
        self.stdout.write('   Abrí http://localhost:5173 y entrá con gerencia / AutoGest2026!\n')

    # ─────────────────────────────────────────────────────────────
    def _limpiar_datos(self):
        from inventario.models import Marca, Modelo, Unidad, Repuesto, CategoriaRepuesto
        from ventas.models import Cliente, VentaUnidad, PagoVenta, ServicioTaller, RepuestoUsadoEnServicio
        from compras.models import Proveedor, CompraUnidad, PagoCompraUnidad, OrdenCompraInsumos
        from caja.models import MovimientoCaja, CuentaBancaria, Pagare, CierreDia
        from rrhh.models import Empleado, LiquidacionSueldo
        from financiero.models import ObligacionRecurrente, ProyeccionFinanciera

        self.stdout.write('  🗑  Limpiando datos anteriores...')
        for model in [LiquidacionSueldo, Empleado, RepuestoUsadoEnServicio, ServicioTaller,
                      PagoVenta, VentaUnidad, Cliente, PagoCompraUnidad, CompraUnidad,
                      MovimientoCaja, Pagare, CierreDia, CuentaBancaria,
                      OrdenCompraInsumos, Repuesto, CategoriaRepuesto,
                      Unidad, Modelo, Marca, Proveedor,
                      ObligacionRecurrente, ProyeccionFinanciera]:
            model.objects.all().delete()

    # ─────────────────────────────────────────────────────────────
    def _cargar_marcas_modelos(self):
        from inventario.models import Marca, Modelo

        self.stdout.write('  🏷  Cargando marcas y modelos...')

        datos = [
            ('Toyota',   'Japón',  [('Corolla', 2022, 'SEDAN'), ('RAV4', 2023, 'SUV'), ('Yaris', 2021, 'HATCHBACK')]),
            ('Volkswagen','Alemania',[('Golf', 2022, 'HATCHBACK'), ('Tiguan', 2023, 'SUV'), ('Passat', 2021, 'SEDAN')]),
            ('Ford',     'EEUU',   [('Focus', 2021, 'HATCHBACK'), ('Kuga', 2022, 'SUV'), ('Puma', 2023, 'CROSSOVER')]),
            ('Seat',     'España', [('León', 2022, 'HATCHBACK'), ('Ateca', 2023, 'SUV'), ('Ibiza', 2021, 'HATCHBACK')]),
            ('BMW',      'Alemania',[('Serie 3', 2023, 'SEDAN'), ('X3', 2022, 'SUV')]),
        ]

        self.marcas = {}
        self.modelos = {}

        for nombre, pais, modelos_lista in datos:
            marca, _ = Marca.objects.get_or_create(nombre=nombre, defaults={'pais_origen': pais})
            self.marcas[nombre] = marca
            for nom_mod, año, tipo in modelos_lista:
                mod, _ = Modelo.objects.get_or_create(
                    marca=marca, nombre=nom_mod,
                    defaults={'año': año, 'tipo': tipo}
                )
                self.modelos[f"{nombre}_{nom_mod}"] = mod

        self.stdout.write(f'     → {Marca.objects.count()} marcas, {Modelo.objects.count()} modelos')

    # ─────────────────────────────────────────────────────────────
    def _cargar_proveedores(self):
        from compras.models import Proveedor
        from accounts.models import Usuario

        self.stdout.write('  🏢 Cargando proveedores...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        proveedores_data = [
            # Grandes proveedores (marcas)
            ('GP001', 'Toyota España S.A.',    'Toyota ES',   'A12345678', 'GRAN',  'Net 60',  500000),
            ('GP002', 'Volkswagen Group España','VW Group',   'B23456789', 'GRAN',  'Net 60',  800000),
            ('GP003', 'Ford Motor Company ES', 'Ford ES',     'C34567890', 'GRAN',  'Net 45',  400000),
            ('GP004', 'Seat S.A.',             'Seat',        'D45678901', 'GRAN',  'Net 60',  600000),
            ('GP005', 'BMW Ibérica S.A.',      'BMW ES',      'E56789012', 'GRAN',  'Net 90',  1000000),
            # Proveedores de repuestos e insumos
            ('PR001', 'AutoPiezas García SL',  'García Piezas','F67890123','PROVEEDOR','Net 30', 50000),
            ('PR002', 'Lubricantes Roca SA',   'Roca Lubri',  'G78901234', 'PROVEEDOR','Contado',20000),
            ('PR003', 'Electrónica Auto SL',   'ElectroAuto', 'H89012345', 'PROVEEDOR','Net 15', 30000),
        ]

        self.proveedores = {}
        for cod, razon, comercial, cif, tipo, condiciones, limite in proveedores_data:
            prov, _ = Proveedor.objects.get_or_create(
                codigo=cod,
                defaults={
                    'razon_social': razon, 'nombre_comercial': comercial,
                    'cif_nif': cif, 'tipo': tipo,
                    'condiciones_pago': condiciones,
                    'limite_credito': Decimal(str(limite)),
                    'creado_por': admin,
                }
            )
            self.proveedores[cod] = prov

        self.stdout.write(f'     → {Proveedor.objects.count()} proveedores')

    # ─────────────────────────────────────────────────────────────
    def _cargar_unidades(self):
        from inventario.models import Unidad
        from accounts.models import Usuario

        self.stdout.write('  🚗 Cargando unidades vehiculares...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        unidades_data = [
            # (modelo_key, serie, matricula, color, km, estado, costo, pvp, proveedor_cod)
            ('Toyota_Corolla',    'TOY-COR-2022-001', '1234-ABC', 'Blanco Perla', 0,     'NUEVA',       18500, 23900, 'GP001'),
            ('Toyota_RAV4',       'TOY-RAV-2023-001', '5678-DEF', 'Gris Plata',  0,     'NUEVA',       28000, 35500, 'GP001'),
            ('Toyota_Yaris',      'TOY-YAR-2021-001', '9012-GHI', 'Rojo Carmín', 15000, 'USADA',       10500, 14900, 'GP001'),
            ('Volkswagen_Golf',   'VW-GOL-2022-001',  '3456-JKL', 'Negro Azabache',0,   'NUEVA',       22000, 28500, 'GP002'),
            ('Volkswagen_Tiguan', 'VW-TIG-2023-001',  '7890-MNO', 'Azul Atlántico',0,  'NUEVA',       32000, 41000, 'GP002'),
            ('Volkswagen_Passat', 'VW-PAS-2021-001',  '2345-PQR', 'Plata Reflex', 28000,'USADA',       15000, 21500, 'GP002'),
            ('Ford_Focus',        'FOR-FOC-2021-001',  '6789-STU', 'Blanco',      22000, 'USADA',       11000, 15900, 'GP003'),
            ('Ford_Kuga',         'FOR-KUG-2022-001',  '0123-VWX', 'Gris Magnetic',0,  'NUEVA',       26500, 33900, 'GP003'),
            ('Seat_León',         'SEA-LEO-2022-001',  '4567-YZA', 'Naranja Desire',0,  'NUEVA',       20000, 26500, 'GP004'),
            ('Seat_Ateca',        'SEA-ATE-2023-001',  '8901-BCD', 'Blanco Nevada',0,   'NUEVA',       25000, 32000, 'GP004'),
            ('Seat_Ibiza',        'SEA-IBI-2021-001',  '2345-EFG', 'Azul Emoción', 18000,'USADA',       9500, 13500, 'GP004'),
            ('BMW_Serie 3',       'BMW-S3-2023-001',   '6789-HIJ', 'Blanco Alpino', 0,  'NUEVA',       42000, 54900, 'GP005'),
            ('BMW_X3',            'BMW-X3-2022-001',   '0123-KLM', 'Negro Zafiro', 8000, 'USADA',      38000, 49500, 'GP005'),
            # Consignación
            ('Toyota_Corolla',    'TOY-COR-2020-CON', '9999-CON', 'Gris',        45000, 'CONSIGNACION',12000, 17500, 'GP001'),
        ]

        self.unidades = {}
        for mod_key, serie, mat, color, km, estado, costo, pvp, prov_cod in unidades_data:
            modelo = self.modelos.get(mod_key)
            if not modelo:
                continue
            unidad, _ = Unidad.objects.get_or_create(
                numero_serie=serie,
                defaults={
                    'modelo': modelo, 'matricula': mat, 'color': color,
                    'kilometros': km, 'estado': estado,
                    'precio_costo': Decimal(str(costo)),
                    'precio_venta': Decimal(str(pvp)),
                    'proveedor': self.proveedores.get(prov_cod),
                    'fecha_ingreso': date.today() - timedelta(days=random.randint(10, 120)),
                    'creado_por': admin,
                }
            )
            self.unidades[serie] = unidad

        self.stdout.write(f'     → {Unidad.objects.count()} unidades en stock')

    # ─────────────────────────────────────────────────────────────
    def _cargar_compras_unidades(self):
        from compras.models import CompraUnidad, PagoCompraUnidad
        from accounts.models import Usuario

        self.stdout.write('  🛒 Cargando compras de unidades (con plan de pagos)...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        compras_data = [
            # (serie_unidad, proveedor_cod, tipo, precio, anticipo, cuotas, dias_primer_venc)
            ('TOY-COR-2022-001', 'GP001', 'CONTADO',   18500, 18500, 0, 0),
            ('TOY-RAV-2023-001', 'GP001', 'FINANCIADO', 28000,  8000, 4, 30),
            ('VW-GOL-2022-001',  'GP002', 'FINANCIADO', 22000,  6000, 4, 30),
            ('VW-TIG-2023-001',  'GP002', 'FINANCIADO', 32000, 10000, 6, 30),
            ('FOR-KUG-2022-001', 'GP003', 'FINANCIADO', 26500,  6500, 4, 30),
            ('SEA-LEO-2022-001', 'GP004', 'CONTADO',    20000, 20000, 0, 0),
            ('SEA-ATE-2023-001', 'GP004', 'FINANCIADO', 25000,  7000, 4, 30),
            ('BMW-S3-2023-001',  'GP005', 'FINANCIADO', 42000, 12000, 6, 30),
        ]

        for serie, prov_cod, tipo, precio, anticipo, n_cuotas, dias_venc in compras_data:
            unidad = self.unidades.get(serie)
            if not unidad:
                continue
            saldo = Decimal(str(precio - anticipo))
            compra, creada = CompraUnidad.objects.get_or_create(
                unidad=unidad,
                defaults={
                    'proveedor': self.proveedores[prov_cod],
                    'tipo_compra': tipo,
                    'fecha_compra': date.today() - timedelta(days=random.randint(15, 90)),
                    'precio_compra': Decimal(str(precio)),
                    'anticipo_pagado': Decimal(str(anticipo)),
                    'saldo_financiado': saldo,
                    'numero_factura_proveedor': f'FAC-{prov_cod}-{random.randint(10000,99999)}',
                    'creado_por': admin,
                }
            )
            # Generar cuotas si es financiado
            if creada and n_cuotas > 0:
                monto_cuota = saldo / n_cuotas
                for i in range(1, n_cuotas + 1):
                    PagoCompraUnidad.objects.create(
                        compra=compra,
                        numero_cuota=i,
                        fecha_vencimiento=date.today() + timedelta(days=dias_venc * i),
                        monto=monto_cuota,
                        pagado=False,
                        creado_por=admin,
                    )

        self.stdout.write(f'     → {CompraUnidad.objects.count()} compras, {PagoCompraUnidad.objects.count()} cuotas a pagar')

    # ─────────────────────────────────────────────────────────────
    def _cargar_clientes(self):
        from ventas.models import Cliente
        from accounts.models import Usuario

        self.stdout.write('  👥 Cargando clientes...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        clientes_data = [
            ('CL001', 'García',    'Antonio',    '12345678A', '612 111 111', 'antonio.garcia@email.com',    'Calle Mayor 1, Madrid'),
            ('CL002', 'Martínez',  'María José', '23456789B', '623 222 222', 'mj.martinez@email.com',       'Avda. Constitución 5, Barcelona'),
            ('CL003', 'López',     'Francisco',  '34567890C', '634 333 333', 'fran.lopez@email.com',        'C/ Sevilla 12, Valencia'),
            ('CL004', 'Sánchez',   'Laura',      '45678901D', '645 444 444', 'laura.sanchez@email.com',     'Plaza España 3, Sevilla'),
            ('CL005', 'Jiménez',   'Carlos',     '56789012E', '656 555 555', 'carlos.jimenez@email.com',    'C/ Granada 8, Málaga'),
            ('CL006', 'Fernández', 'Ana',        '67890123F', '667 666 666', 'ana.fernandez@email.com',     'Paseo Castellana 100, Madrid'),
            ('CL007', 'González',  'Roberto',    '78901234G', '678 777 777', 'roberto.gonzalez@email.com',  'C/ Rambla 22, Barcelona'),
            ('CL008', 'Rodríguez', 'Isabel',     '89012345H', '689 888 888', 'isabel.rodriguez@email.com',  'Avda. Mar 7, Alicante'),
            ('CL009', 'Pérez',     'Miguel',     '90123456I', '690 999 999', 'miguel.perez@email.com',      'C/ Flores 3, Murcia'),
            ('CL010', 'Ruiz',      'Sofía',      '01234567J', '601 000 000', 'sofia.ruiz@email.com',        'C/ Pinos 15, Zaragoza'),
        ]

        self.clientes = {}
        for cod, ap, nom, dni, tel, email, dir in clientes_data:
            cliente, _ = Cliente.objects.get_or_create(
                codigo=cod,
                defaults={
                    'nombre': nom, 'apellidos': ap, 'dni_nie': dni,
                    'telefono': tel, 'email': email, 'direccion': dir,
                    'creado_por': admin,
                }
            )
            self.clientes[cod] = cliente

        self.stdout.write(f'     → {Cliente.objects.count()} clientes')

    # ─────────────────────────────────────────────────────────────
    def _cargar_ventas(self):
        from ventas.models import VentaUnidad, PagoVenta
        from accounts.models import Usuario

        self.stdout.write('  💰 Cargando ventas de unidades (con plan de cobros)...')
        admin = Usuario.objects.filter(is_superuser=True).first()
        vendedor = Usuario.objects.filter(rol='VENTAS').first() or admin

        ventas_data = [
            # (cliente_cod, serie_unidad, precio, anticipo, n_cuotas, estado_pago, dias_desde_hoy)
            ('CL001', 'TOY-YAR-2021-001', 14900, 3000, 3, 'PARCIAL',   -45),  # Venta hace 45 días
            ('CL002', 'VW-PAS-2021-001',  21500, 5000, 4, 'PARCIAL',   -30),
            ('CL003', 'FOR-FOC-2021-001', 15900, 4000, 3, 'PARCIAL',   -20),
            ('CL004', 'SEA-IBI-2021-001', 13500, 2500, 2, 'PARCIAL',   -15),
            ('CL005', 'BMW-X3-2022-001',  49500,15000, 6, 'PARCIAL',   -60),
            # Ventas recientes
            ('CL006', 'TOY-COR-2022-001', 23900, 5000, 4, 'PARCIAL',   -5),
            ('CL007', 'VW-GOL-2022-001',  28500, 8000, 4, 'FINANCIADO', -2),
        ]

        self.ventas = []
        for cli_cod, serie, precio, anticipo, n_cuotas, estado, dias in ventas_data:
            unidad = self.unidades.get(serie)
            cliente = self.clientes.get(cli_cod)
            if not unidad or not cliente:
                continue

            monto_fin = Decimal(str(precio - anticipo))
            fecha_v = date.today() + timedelta(days=dias)

            venta, creada = VentaUnidad.objects.get_or_create(
                unidad=unidad,
                defaults={
                    'cliente': cliente,
                    'vendedor': vendedor,
                    'fecha_venta': fecha_v,
                    'precio_acordado': Decimal(str(precio)),
                    'anticipo': Decimal(str(anticipo)),
                    'monto_financiado': monto_fin,
                    'estado_pago': estado,
                    'creado_por': admin,
                }
            )
            self.ventas.append(venta)

            # Marcar unidad como vendida
            unidad.estado = 'VENDIDA'
            unidad.fecha_venta = fecha_v
            unidad.save()

            if creada and n_cuotas > 0:
                monto_cuota = monto_fin / n_cuotas
                for i in range(1, n_cuotas + 1):
                    # Primera cuota ya vencida (simula mora parcial)
                    venc = fecha_v + timedelta(days=30 * i)
                    pagada = i == 1 and dias < -25  # primera cuota pagada si venta antigua
                    PagoVenta.objects.create(
                        venta=venta,
                        numero_cuota=i,
                        fecha_vencimiento=venc,
                        monto=monto_cuota,
                        pagado=pagada,
                        fecha_pago=fecha_v + timedelta(days=32) if pagada else None,
                        creado_por=admin,
                    )

        self.stdout.write(f'     → {VentaUnidad.objects.count()} ventas, {PagoVenta.objects.count()} cuotas de cobro')

    # ─────────────────────────────────────────────────────────────
    def _cargar_servicios_taller(self):
        from ventas.models import ServicioTaller
        from accounts.models import Usuario

        self.stdout.write('  🔧 Cargando servicios de taller...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        servicios_data = [
            ('CL008', None, '8901-MAN', 'Revisión 20.000 km + cambio aceite y filtros',  2.5, 65, 'TERMINADO'),
            ('CL009', None, '3456-SER', 'Reparación sistema de frenos completo',          4.0, 65, 'TERMINADO'),
            ('CL010', None, '6789-TER', 'Diagnóstico electrónico + actualización software',1.5, 65, 'FACTURADO'),
            ('CL001', None, '1234-ABC', 'Cambio neumáticos y equilibrado de ruedas',      1.0, 65, 'EN_CURSO'),
            ('CL002', None, '5678-DEF', 'Revisión preITV + ajustes varios',               3.0, 65, 'EN_CURSO'),
            ('CL005', None, '0001-BMW', 'Mantenimiento anual + revisión frenos',          3.5, 80, 'PRESUPUESTADO'),
        ]

        for cli_cod, uni, mat, desc, horas, precio_hora, estado in servicios_data:
            cliente = self.clientes.get(cli_cod)
            if not cliente:
                continue
            ServicioTaller.objects.get_or_create(
                matricula_cliente=mat,
                cliente=cliente,
                defaults={
                    'descripcion_trabajo': desc,
                    'fecha_ingreso': date.today() - timedelta(days=random.randint(1, 20)),
                    'fecha_entrega_estimada': date.today() + timedelta(days=random.randint(1, 5)),
                    'horas_mano_obra': Decimal(str(horas)),
                    'precio_hora': Decimal(str(precio_hora)),
                    'estado': estado,
                    'creado_por': admin,
                }
            )

        self.stdout.write(f'     → {ServicioTaller.objects.count()} servicios de taller')

    # ─────────────────────────────────────────────────────────────
    def _cargar_empleados(self):
        from rrhh.models import Empleado, LiquidacionSueldo
        from accounts.models import Usuario

        self.stdout.write('  👔 Cargando empleados y liquidaciones...')
        admin = Usuario.objects.filter(is_superuser=True).first()
        usuarios = {u.rol: u for u in Usuario.objects.all()}

        empleados_data = [
            ('E001', 'Burgos',    'Edgardo',   '11111111A', 'GER', 'Director General',         5500, 'GERENCIA'),
            ('E002', 'García',    'Ana',        '22222222B', 'RRH', 'Auditora General',          3200, 'AUDITORIA'),
            ('E003', 'López',     'Carlos',     '33333333C', 'VEN', 'Vendedor Senior',            2800, 'VENTAS'),
            ('E004', 'Martínez',  'María',      '44444444D', 'CAJ', 'Tesorera',                  2600, 'TESORERIA'),
            ('E005', 'Ruiz',      'José',       '55555555E', 'VEN', 'Vendedor',                   2400, None),
            ('E006', 'Hernández', 'Carmen',     '66666666F', 'TAL', 'Jefe de Taller',             2900, None),
            ('E007', 'Díaz',      'Fernando',   '77777777G', 'TAL', 'Mecánico Especialista',      2200, None),
            ('E008', 'Torres',    'Lucía',      '88888888H', 'ADM', 'Administración',             2100, None),
        ]

        self.empleados = {}
        for legajo, ap, nom, dni, dep, cargo, salario, rol in empleados_data:
            usuario_vinculado = usuarios.get(rol) if rol else None
            emp, _ = Empleado.objects.get_or_create(
                legajo=legajo,
                defaults={
                    'nombre': nom, 'apellidos': ap, 'dni_nie': dni,
                    'departamento': dep, 'cargo': cargo,
                    'salario_bruto': Decimal(str(salario)),
                    'fecha_ingreso': date.today() - timedelta(days=random.randint(180, 1200)),
                    'usuario': usuario_vinculado,
                    'creado_por': admin,
                }
            )
            self.empleados[legajo] = emp

        # Generar liquidaciones del mes actual
        mes = date.today().month
        año = date.today().year
        for emp in self.empleados.values():
            LiquidacionSueldo.objects.get_or_create(
                empleado=emp, periodo_mes=mes, periodo_año=año,
                defaults={
                    'salario_bruto': emp.salario_bruto,
                    'deducciones': emp.salario_bruto * Decimal('0.065'),  # SS aprox
                    'adicionales': Decimal('0'),
                    'neto_a_pagar': emp.salario_bruto * Decimal('0.935'),
                    'pagado': False,
                    'creado_por': admin,
                }
            )

        total_sueldos = sum(e.salario_bruto for e in self.empleados.values())
        self.stdout.write(f'     → {len(self.empleados)} empleados | Nómina mensual: €{total_sueldos:,.0f}')

    # ─────────────────────────────────────────────────────────────
    def _cargar_obligaciones_recurrentes(self):
        from financiero.models import ObligacionRecurrente
        from accounts.models import Usuario

        self.stdout.write('  📋 Cargando obligaciones recurrentes...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        # Sueldos (uno por empleado)
        sueldos_total = sum(e.salario_bruto for e in self.empleados.values())
        ObligacionRecurrente.objects.get_or_create(
            descripcion='Nómina mensual — Total plantilla (8 empleados)',
            defaults={
                'tipo': 'SUELDO',
                'monto_mensual': sueldos_total,
                'dia_vencimiento': 28,
                'creado_por': admin,
            }
        )

        # Gastos fijos
        gastos = [
            ('Alquiler del local — Concesionario',    'ALQUILER', 4500, 1),
            ('Electricidad — Nave y oficinas',         'SUMINIST', 890,  5),
            ('Gas — Calefacción taller',               'SUMINIST', 320,  5),
            ('Agua',                                   'SUMINIST', 180,  5),
            ('Internet y telefonía empresarial',       'SUMINIST', 250,  5),
            ('Seguro de responsabilidad civil',        'SEGUROS',  620, 10),
            ('Seguro del local y vehículos exposición','SEGUROS',  480, 10),
            ('Gestoría y asesoría contable',           'OTROS',    380, 15),
            ('Limpieza y mantenimiento',               'OTROS',    290, 15),
        ]

        for desc, tipo, monto, dia in gastos:
            ObligacionRecurrente.objects.get_or_create(
                descripcion=desc,
                defaults={
                    'tipo': tipo,
                    'monto_mensual': Decimal(str(monto)),
                    'dia_vencimiento': dia,
                    'creado_por': admin,
                }
            )

        total_fijos = sum(g[2] for g in gastos) + float(sueldos_total)
        self.stdout.write(f'     → {ObligacionRecurrente.objects.count()} obligaciones | Total mensual: €{total_fijos:,.0f}')

    # ─────────────────────────────────────────────────────────────
    def _cargar_cuentas_bancarias(self):
        from caja.models import CuentaBancaria
        from accounts.models import Usuario

        self.stdout.write('  🏦 Cargando cuentas bancarias...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        cuentas = [
            ('Banco Santander',   'ES76 0049 0001 5320 1234 5678', '0049-0001-53-2012345678', 85000),
            ('BBVA',              'ES91 0182 0001 1302 0012 3456', '0182-0001-13-0200123456', 42500),
            ('CaixaBank',         'ES58 2100 0418 4502 0005 1332', '2100-0418-45-0200051332', 28000),
        ]

        self.cuentas = []
        for banco, iban, num, saldo in cuentas:
            cuenta, _ = CuentaBancaria.objects.get_or_create(
                iban=iban,
                defaults={
                    'banco': banco, 'numero_cuenta': num,
                    'saldo_actual': Decimal(str(saldo)),
                    'moneda': 'EUR',
                    'creado_por': admin,
                }
            )
            self.cuentas.append(cuenta)

        total_bancos = sum(c[3] for c in cuentas)
        self.stdout.write(f'     → {len(cuentas)} cuentas bancarias | Saldo total: €{total_bancos:,.0f}')

    # ─────────────────────────────────────────────────────────────
    def _cargar_pagares(self):
        from caja.models import Pagare
        from accounts.models import Usuario

        self.stdout.write('  📄 Cargando pagarés en cartera...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        pagares_data = [
            ('PAG-001', 'García Antonio (CL001)',  14200, -45, 45),   # ya vencido
            ('PAG-002', 'Martínez M.J. (CL002)',   21500, -30, 30),
            ('PAG-003', 'López Francisco (CL003)',  11900, -20, 40),
            ('PAG-004', 'Jiménez Carlos (CL005)',   34500, -60, 20),   # próximo a cobrar
            ('PAG-005', 'Fernández Ana (CL006)',    18900, -5,  55),
        ]

        for num, emisor, monto, dias_emision, dias_venc in pagares_data:
            Pagare.objects.get_or_create(
                numero=num,
                defaults={
                    'emisor': emisor,
                    'monto': Decimal(str(monto)),
                    'fecha_emision': date.today() + timedelta(days=dias_emision),
                    'fecha_vencimiento': date.today() + timedelta(days=dias_venc),
                    'estado': 'CARTERA',
                    'creado_por': admin,
                }
            )

        total_pagares = sum(p[2] for p in pagares_data)
        self.stdout.write(f'     → {Pagare.objects.count()} pagarés | Total en cartera: €{total_pagares:,.0f}')

    # ─────────────────────────────────────────────────────────────
    def _cargar_movimientos_caja(self):
        from caja.models import MovimientoCaja
        from accounts.models import Usuario

        self.stdout.write('  💵 Cargando movimientos de caja...')
        admin = Usuario.objects.filter(is_superuser=True).first()

        hoy = date.today()

        movimientos = [
            # INGRESOS históricos (ventas cobradas, anticipos, servicios)
            ('INGRESO', 'COBRO_VENTA',     3000,  hoy - timedelta(days=45), 'Anticipo venta Toyota Yaris — García Antonio',    'REC-001'),
            ('INGRESO', 'COBRO_VENTA',     5000,  hoy - timedelta(days=30), 'Anticipo venta VW Passat — Martínez M.J.',         'REC-002'),
            ('INGRESO', 'COBRO_VENTA',     4000,  hoy - timedelta(days=20), 'Anticipo venta Ford Focus — López Francisco',      'REC-003'),
            ('INGRESO', 'COBRO_VENTA',     2500,  hoy - timedelta(days=15), 'Anticipo venta Seat Ibiza — Sánchez Laura',        'REC-004'),
            ('INGRESO', 'COBRO_VENTA',    15000,  hoy - timedelta(days=60), 'Anticipo venta BMW X3 — Jiménez Carlos',           'REC-005'),
            ('INGRESO', 'COBRO_VENTA',     5000,  hoy - timedelta(days=5),  'Anticipo venta Toyota Corolla — Fernández Ana',    'REC-006'),
            ('INGRESO', 'COBRO_VENTA',     8000,  hoy - timedelta(days=2),  'Anticipo venta VW Golf — González Roberto',        'REC-007'),
            # Cuotas cobradas
            ('INGRESO', 'COBRO_CUOTA',   3966.67, hoy - timedelta(days=15), 'Cuota 1/3 — Yaris — García Antonio',              'REC-008'),
            ('INGRESO', 'COBRO_CUOTA',   4125,    hoy - timedelta(days=10), 'Cuota 1/4 — Passat — Martínez M.J.',              'REC-009'),
            # Servicios de taller cobrados
            ('INGRESO', 'COBRO_SERVICIO', 342.50, hoy - timedelta(days=18), 'Revisión 20.000 km — Rodríguez Isabel',            'REC-010'),
            ('INGRESO', 'COBRO_SERVICIO', 520.00, hoy - timedelta(days=12), 'Frenos completo — Pérez Miguel',                  'REC-011'),
            ('INGRESO', 'COBRO_SERVICIO', 252.50, hoy - timedelta(days=8),  'Diagnóstico electrónico — Ruiz Sofía',             'REC-012'),
            # Ingresos de hoy
            ('INGRESO', 'COBRO_VENTA',    1200,   hoy,                      'Abono parcial cuota — García Antonio',             'REC-013'),
            ('INGRESO', 'COBRO_SERVICIO',  390,   hoy,                      'Servicio neumáticos — García Antonio',             'REC-014'),

            # EGRESOS históricos
            ('EGRESO', 'PAGO_PROVEEDOR', 18500,  hoy - timedelta(days=90), 'Pago Toyota Corolla contado — Toyota España',      'FAC-TOY-001'),
            ('EGRESO', 'PAGO_PROVEEDOR', 8000,   hoy - timedelta(days=85), 'Anticipo Toyota RAV4 — Toyota España',             'FAC-TOY-002'),
            ('EGRESO', 'PAGO_PROVEEDOR', 6000,   hoy - timedelta(days=75), 'Anticipo VW Golf — VW Group España',               'FAC-VW-001'),
            ('EGRESO', 'PAGO_PROVEEDOR', 10000,  hoy - timedelta(days=70), 'Anticipo VW Tiguan — VW Group España',             'FAC-VW-002'),
            ('EGRESO', 'PAGO_PROVEEDOR', 20000,  hoy - timedelta(days=60), 'Pago Seat León contado — Seat S.A.',               'FAC-SEA-001'),
            ('EGRESO', 'PAGO_PROVEEDOR', 12000,  hoy - timedelta(days=45), 'Anticipo BMW Serie 3 — BMW Ibérica',               'FAC-BMW-001'),
            # Sueldos pagados (mes anterior)
            ('EGRESO', 'PAGO_SUELDO',   23390,  hoy - timedelta(days=25), 'Pago nóminas — Agosto 2026 (8 empleados)',         'NOM-AGO-2026'),
            # Gastos fijos mes anterior
            ('EGRESO', 'PAGO_SERVICIO',  4500,  hoy - timedelta(days=30), 'Alquiler local — Agosto 2026',                     'ALQ-AGO-2026'),
            ('EGRESO', 'PAGO_SERVICIO',   890,  hoy - timedelta(days=28), 'Electricidad — Agosto 2026',                       'LUZ-AGO-2026'),
            ('EGRESO', 'PAGO_SERVICIO',   750,  hoy - timedelta(days=28), 'Gas + Agua + Internet — Agosto 2026',              'SUM-AGO-2026'),
            ('EGRESO', 'PAGO_SERVICIO',   620,  hoy - timedelta(days=20), 'Seguro responsabilidad civil — Agosto',            'SEG-AGO-2026'),
            ('EGRESO', 'PAGO_SERVICIO',   380,  hoy - timedelta(days=15), 'Gestoría — Agosto 2026',                           'GES-AGO-2026'),
            # Egresos de hoy
            ('EGRESO', 'PAGO_PROVEEDOR',  420,  hoy,                      'Repuestos AutoPiezas García — OC-001',             'FAC-PR-001'),
            ('EGRESO', 'PAGO_SERVICIO',   290,  hoy,                      'Limpieza y mantenimiento — Septiembre',            'LIM-SEP-2026'),
        ]

        for tipo, concepto, monto, fecha, desc, num_doc in movimientos:
            MovimientoCaja.objects.get_or_create(
                numero_documento=num_doc,
                defaults={
                    'tipo': tipo,
                    'concepto': concepto,
                    'monto': Decimal(str(monto)),
                    'fecha': fecha,
                    'descripcion': desc,
                    'cerrado_en_dia': fecha < hoy,
                    'creado_por': admin,
                }
            )

        total_ing = sum(m[2] for m in movimientos if m[0] == 'INGRESO')
        total_egr = sum(m[2] for m in movimientos if m[0] == 'EGRESO')
        self.stdout.write(f'     → {MovimientoCaja.objects.count()} movimientos')
        self.stdout.write(f'       Ingresos: €{total_ing:,.2f} | Egresos: €{total_egr:,.2f}')
        self.stdout.write(f'       Saldo de Caja: €{total_ing - total_egr:,.2f}')
