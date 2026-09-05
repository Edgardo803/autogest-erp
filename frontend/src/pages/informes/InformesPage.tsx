// Página de Informes — Generación de PDF con jsPDF + autoTable
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Header } from '../../components/layout/Header'
import {
  ventasApi, cajaApi, inventarioApi, rrhhApi, comprasApi, tallerApi
} from '../../api/client'
import {
  FileText, Download, ShoppingCart, DollarSign,
  Package, Users, Truck, Wrench, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

// ─── Utilidades ───────────────────────────────────────────────
const eur = (n: number | string) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0)

const fecha = (s: string) => s
  ? new Date(s + (s.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('es-ES')
  : '—'

const hoyStr = () => new Date().toLocaleDateString('es-ES')
const empresa = 'AutoGest ERP'

// ─── Cabecera PDF estándar ────────────────────────────────────
function cabeceraDoc(doc: jsPDF, titulo: string, subtitulo?: string) {
  const W = doc.internal.pageSize.getWidth()

  // Franja azul superior
  doc.setFillColor(17, 24, 39)
  doc.rect(0, 0, W, 22, 'F')

  // Título empresa
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa, 14, 9)

  // Título informe
  doc.setFontSize(16)
  doc.text(titulo, 14, 17)

  // Fecha a la derecha
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generado: ${hoyStr()}`, W - 14, 9, { align: 'right' })
  doc.text('Confidencial', W - 14, 17, { align: 'right' })

  // Subtítulo
  doc.setTextColor(30, 30, 30)
  let y = 30
  if (subtitulo) {
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(subtitulo, 14, y)
    y += 7
  }
  return y
}

// ─── Pie de página en todas las páginas ─────────────────────
function piePaginas(doc: jsPDF) {
  const totalPags = (doc.internal as any).getNumberOfPages()
  const W = doc.internal.pageSize.getWidth()
  for (let i = 1; i <= totalPags; i++) {
    doc.setPage(i)
    doc.setDrawColor(220, 220, 220)
    doc.line(14, 285, W - 14, 285)
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`${empresa} — ${hoyStr()}`, 14, 290)
    doc.text(`Página ${i} de ${totalPags}`, W - 14, 290, { align: 'right' })
  }
}

// ─── Generadores de PDF ──────────────────────────────────────

function pdfVentas(ventas: any[]) {
  const doc = new jsPDF()
  let y = cabeceraDoc(doc, 'Informe de Ventas de Unidades', `Total: ${ventas.length} ventas`)

  // Resumen financiero
  const totalVendido  = ventas.reduce((s, v) => s + Number(v.precio_acordado), 0)
  const totalCobrado  = ventas.reduce((s, v) => s + Number(v.anticipo || 0) + Number(v.monto_financiado || 0), 0)
  const pendiente     = ventas.reduce((s, v) => s + Number(v.saldo_pendiente || 0), 0)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Resumen ejecutivo', 14, y)
  y += 2

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Total facturado', eur(totalVendido), 'Cobrado', eur(totalCobrado)],
      ['Saldo pendiente', eur(pendiente < 0 ? 0 : pendiente), 'Unidades vendidas', String(ventas.length)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { fontStyle: 'bold', textColor: [100, 116, 139] },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de ventas', 14, y)
  y += 2

  autoTable(doc, {
    startY: y,
    head: [['#', 'Fecha', 'Cliente', 'Unidad', 'Precio', 'Anticipo', 'Estado pago']],
    body: ventas.map(v => [
      String(v.id),
      fecha(v.fecha_venta),
      v.cliente_nombre || '—',
      v.unidad_display?.split('|')[0]?.trim() || '—',
      eur(v.precio_acordado),
      eur(v.anticipo),
      v.estado_pago || '—',
    ]),
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  })

  piePaginas(doc)
  doc.save(`autogest_ventas_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function pdfCaja(movimientos: any[]) {
  const doc = new jsPDF()
  const ingresos = movimientos.filter(m => m.tipo === 'INGRESO')
  const egresos  = movimientos.filter(m => m.tipo === 'EGRESO')
  const totIngreso = ingresos.reduce((s, m) => s + Number(m.monto), 0)
  const totEgreso  = egresos.reduce((s, m) => s + Number(m.monto), 0)
  const saldo      = totIngreso - totEgreso

  let y = cabeceraDoc(doc, 'Informe de Caja / Movimientos', `${movimientos.length} movimientos registrados`)

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Total Ingresos', eur(totIngreso), 'Total Egresos', eur(totEgreso)],
      ['Saldo neto', eur(saldo), 'Movimientos', String(movimientos.length)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { fontStyle: 'bold', textColor: [100, 116, 139] },
    },
  })

  // Ingresos
  y = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(34, 197, 94)
  doc.text(`Ingresos (${ingresos.length})`, 14, y)
  y += 2

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Concepto', 'Descripción', 'Doc.', 'Monto']],
    body: ingresos.map(m => [
      fecha(m.fecha),
      m.concepto_display || m.concepto,
      (m.descripcion || '').slice(0, 45),
      m.numero_documento || '—',
      eur(m.monto),
    ]),
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
  })

  // Egresos
  y = (doc as any).lastAutoTable.finalY + 8
  doc.setTextColor(239, 68, 68)
  doc.text(`Egresos (${egresos.length})`, 14, y)
  y += 2

  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Concepto', 'Descripción', 'Doc.', 'Monto']],
    body: egresos.map(m => [
      fecha(m.fecha),
      m.concepto_display || m.concepto,
      (m.descripcion || '').slice(0, 45),
      m.numero_documento || '—',
      eur(m.monto),
    ]),
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [254, 242, 242] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
  })

  piePaginas(doc)
  doc.save(`autogest_caja_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function pdfInventario(unidades: any[]) {
  const doc = new jsPDF({ orientation: 'landscape' })
  const disponibles = unidades.filter(u => !['VENDIDA', 'BAJA'].includes(u.estado))
  const vendidas    = unidades.filter(u => u.estado === 'VENDIDA')
  const valorStock  = disponibles.reduce((s, u) => s + Number(u.precio_venta || 0), 0)

  let y = cabeceraDoc(doc, 'Informe de Inventario — Unidades', `${unidades.length} unidades registradas · Valor stock disponible: ${eur(valorStock)}`)

  autoTable(doc, {
    startY: y,
    head: [['#', 'Modelo', 'N° Serie', 'Matrícula', 'Estado', 'Km', 'PVP']],
    body: unidades.map(u => [
      String(u.id),
      u.modelo_display || '—',
      u.numero_serie || '—',
      u.matricula || '—',
      u.estado_display || u.estado,
      u.kilometros ? `${Number(u.kilometros).toLocaleString('es-ES')} km` : '—',
      eur(u.precio_venta),
    ]),
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 12 },
      5: { halign: 'right' },
      6: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      // Colorear fila según estado
      if (data.section === 'body') {
        const est = unidades[data.row.index]?.estado
        if (est === 'VENDIDA')    { data.cell.styles.textColor = [100, 116, 139] }
        if (est === 'RESERVADA')  { data.cell.styles.textColor = [59, 130, 246] }
        if (est === 'NUEVA')      { data.cell.styles.textColor = [22, 163, 74] }
      }
    },
  })

  // Resumen final
  const finalY = (doc as any).lastAutoTable.finalY + 8
  const W = doc.internal.pageSize.getWidth()
  doc.setDrawColor(220, 220, 220)
  doc.line(14, finalY, W - 14, finalY)
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Disponibles: ${disponibles.length}  ·  Vendidas: ${vendidas.length}  ·  Valor PVP stock: ${eur(valorStock)}`, 14, finalY + 6)

  piePaginas(doc)
  doc.save(`autogest_inventario_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function pdfNomina(liquidaciones: any[]) {
  const doc = new jsPDF()
  const totalBruto = liquidaciones.reduce((s, l) => s + Number(l.salario_bruto), 0)
  const totalNeto  = liquidaciones.reduce((s, l) => s + Number(l.neto_a_pagar), 0)
  const totalDed   = liquidaciones.reduce((s, l) => s + Number(l.deducciones), 0)
  const pagadas    = liquidaciones.filter(l => l.pagado).length

  let y = cabeceraDoc(doc, 'Informe de Nómina / RRHH', `${liquidaciones.length} liquidaciones · Masa salarial: ${eur(totalBruto)}`)

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Masa salarial bruta', eur(totalBruto), 'Total neto a pagar', eur(totalNeto)],
      ['Total deducciones', eur(totalDed), 'Liquidaciones pagadas', `${pagadas} / ${liquidaciones.length}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { fontStyle: 'bold', textColor: [100, 116, 139] },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Detalle por empleado', 14, y)
  y += 2

  autoTable(doc, {
    startY: y,
    head: [['Empleado', 'Período', 'Bruto', 'Deducciones', 'Adicionales', 'Neto', 'Fecha pago', 'Estado']],
    body: liquidaciones.map(l => [
      l.empleado_nombre || '—',
      `${l.periodo_mes}/${l.periodo_año}`,
      eur(l.salario_bruto),
      eur(l.deducciones),
      eur(l.adicionales || 0),
      eur(l.neto_a_pagar),
      l.fecha_pago ? fecha(l.fecha_pago) : '—',
      l.pagado ? 'Pagado' : 'Pendiente',
    ]),
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 7) {
        data.cell.styles.textColor = liquidaciones[data.row.index]?.pagado
          ? [22, 163, 74] : [239, 68, 68]
      }
    },
  })

  piePaginas(doc)
  doc.save(`autogest_nomina_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function pdfCompras(compras: any[]) {
  const doc = new jsPDF()
  const totalInvertido = compras.reduce((s, c) => s + Number(c.precio_compra), 0)
  const totalPendiente = compras.reduce((s, c) => s + Number(c.saldo_pendiente), 0)

  let y = cabeceraDoc(doc, 'Informe de Compras de Unidades', `${compras.length} operaciones · Invertido: ${eur(totalInvertido)}`)

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Total invertido', eur(totalInvertido), 'Saldo pendiente proveedores', eur(totalPendiente)],
      ['Compras canceladas', String(compras.filter(c => Number(c.saldo_pendiente) === 0).length), 'Con saldo vivo', String(compras.filter(c => Number(c.saldo_pendiente) > 0).length)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { fontStyle: 'bold', textColor: [100, 116, 139] },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8
  autoTable(doc, {
    startY: y,
    head: [['#', 'Proveedor', 'Unidad', 'Tipo', 'Fecha', 'Precio compra', 'Anticipo', 'Saldo pend.']],
    body: compras.map(c => [
      String(c.id),
      c.proveedor_nombre || '—',
      c.unidad_display?.split('|')[0]?.trim() || '—',
      c.tipo_display || c.tipo_compra,
      fecha(c.fecha_compra),
      eur(c.precio_compra),
      eur(c.anticipo_pagado),
      eur(c.saldo_pendiente),
    ]),
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: {
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 7) {
        const saldo = Number(compras[data.row.index]?.saldo_pendiente)
        data.cell.styles.textColor = saldo > 0 ? [245, 158, 11] : [22, 163, 74]
      }
    },
  })

  piePaginas(doc)
  doc.save(`autogest_compras_${new Date().toISOString().slice(0, 10)}.pdf`)
}

function pdfTaller(servicios: any[]) {
  const doc = new jsPDF({ orientation: 'landscape' })
  const listaOT  = servicios.filter(s => s.tipo === 'OT')
  const listaORI = servicios.filter(s => s.tipo === 'ORI')
  const facturOT = listaOT.filter(s => s.estado === 'FACTURADO').reduce((s, o) => s + Number(o.total_factura), 0)
  const costoORI = listaORI.reduce((s, o) => s + Number(o.total_factura), 0)

  let y = cabeceraDoc(doc, 'Informe de Taller — OT y ORI', `${servicios.length} órdenes · ${listaOT.length} OT · ${listaORI.length} ORI`)

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ['Facturación OT', eur(facturOT), 'Costo ORI interno', eur(costoORI)],
      ['OT en curso', String(listaOT.filter(s=>s.estado==='EN_CURSO').length), 'ORI sin imputar', String(listaORI.filter(s=>s.estado==='TERMINADO'&&!s.costo_imputado_a_unidad).length)],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [100, 116, 139] },
      2: { fontStyle: 'bold', textColor: [100, 116, 139] },
    },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  autoTable(doc, {
    startY: y,
    head: [['Tipo', 'Cliente / Unidad', 'Descripción', 'Estado', 'Ingreso', 'Entrega', 'M.O.', 'Repuestos', 'Total']],
    body: servicios.map(s => [
      s.tipo,
      s.tipo === 'ORI' ? `[INT] ${s.unidad_display}` : s.cliente_nombre,
      (s.descripcion_trabajo || '').slice(0, 50),
      s.estado_display || s.estado,
      fecha(s.fecha_ingreso),
      fecha(s.fecha_entrega_estimada),
      eur(s.subtotal_mano_obra),
      eur(s.subtotal_repuestos),
      eur(s.total_factura),
    ]),
    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: 'bold' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.styles.textColor = servicios[data.row.index]?.tipo === 'ORI'
          ? [245, 158, 11] : [59, 130, 246]
      }
    },
  })

  piePaginas(doc)
  doc.save(`autogest_taller_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ─── Definición de informes disponibles ───────────────────────
interface Informe {
  id: string
  titulo: string
  descripcion: string
  icon: any
  color: string
  queryKey: string
  queryFn: () => Promise<any>
  generar: (datos: any[]) => void
}

// ─── Tarjeta de informe ───────────────────────────────────────
function TarjetaInforme({ inf, onGenerar }: { inf: Informe; onGenerar: (inf: Informe) => void }) {
  const Icon = inf.icon
  return (
    <div className="card" style={{
      borderTop: `3px solid ${inf.color}`,
      display: 'flex', flexDirection: 'column', gap: '0.85rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${inf.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={inf.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{inf.titulo}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{inf.descripcion}</div>
        </div>
      </div>
      <button
        className="btn btn-sm"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          background: `${inf.color}15`, color: inf.color,
          border: `1px solid ${inf.color}35`,
          width: '100%', fontWeight: 600, fontSize: '0.82rem',
        }}
        onClick={() => onGenerar(inf)}
      >
        <Download size={14} /> Generar PDF
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export function InformesPage() {
  const [generando, setGenerando] = useState<string | null>(null)
  const hoyIso = new Date().toISOString().split('T')[0]
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyIso)

  const filtrarPorFecha = (lista: any[], campoFecha: string) => {
    if (!desde && !hasta) return lista
    return lista.filter(item => {
      const f = item[campoFecha]
      if (!f) return true
      const d = f.split('T')[0]
      if (desde && d < desde) return false
      if (hasta && d > hasta) return false
      return true
    })
  }

  const periodoStr = desde || hasta
    ? `${desde ? new Date(desde + 'T12:00:00').toLocaleDateString('es-ES') : 'inicio'} — ${hasta ? new Date(hasta + 'T12:00:00').toLocaleDateString('es-ES') : 'hoy'}`
    : 'Todo el historial'

  // Pre-cargar todos los datos (en background)
  const { data: ventasData }    = useQuery({ queryKey: ['ventas-inf'],    queryFn: () => ventasApi.ventasUnidades().then(r => r.data) })
  const { data: cajaData }      = useQuery({ queryKey: ['caja-inf'],      queryFn: () => cajaApi.movimientos().then(r => r.data) })
  const { data: invData }       = useQuery({ queryKey: ['inv-inf'],       queryFn: () => inventarioApi.unidades().then(r => r.data) })
  const { data: rrhhData }      = useQuery({ queryKey: ['rrhh-inf'],      queryFn: () => rrhhApi.liquidaciones().then(r => r.data) })
  const { data: comprasData }   = useQuery({ queryKey: ['compras-inf'],   queryFn: () => comprasApi.comprasUnidades().then(r => r.data) })
  const { data: tallerData }    = useQuery({ queryKey: ['taller-inf'],    queryFn: () => tallerApi.servicios().then(r => r.data) })

  const informes: Informe[] = [
    {
      id: 'ventas',
      titulo: 'Ventas de Unidades',
      descripcion: 'Ventas con cliente, unidad, precio, anticipo, financiación y estado de cobro.',
      icon: ShoppingCart,
      color: 'var(--accent-success)',
      queryKey: 'ventas-inf',
      queryFn: () => ventasApi.ventasUnidades().then(r => r.data),
      generar: (datos) => pdfVentas(filtrarPorFecha(datos, 'fecha_venta')),
    },
    {
      id: 'caja',
      titulo: 'Movimientos de Caja',
      descripcion: 'Ingresos y egresos con concepto, descripción, documento e importe. Saldo neto.',
      icon: DollarSign,
      color: 'var(--accent-primary)',
      queryKey: 'caja-inf',
      queryFn: () => cajaApi.movimientos().then(r => r.data),
      generar: (datos) => pdfCaja(filtrarPorFecha(datos, 'fecha')),
    },
    {
      id: 'inventario',
      titulo: 'Stock de Inventario',
      descripcion: 'Todas las unidades con estado, serie, matrícula, kilometraje y PVP.',
      icon: Package,
      color: '#a855f7',
      queryKey: 'inv-inf',
      queryFn: () => inventarioApi.unidades().then(r => r.data),
      generar: (datos) => pdfInventario(filtrarPorFecha(datos, 'fecha_ingreso')),
    },
    {
      id: 'nomina',
      titulo: 'Nómina y RRHH',
      descripcion: 'Liquidaciones: bruto, deducciones, neto, fecha de pago y estado.',
      icon: Users,
      color: 'var(--accent-warning)',
      queryKey: 'rrhh-inf',
      queryFn: () => rrhhApi.liquidaciones().then(r => r.data),
      generar: (datos) => pdfNomina(filtrarPorFecha(datos, 'fecha_pago')),
    },
    {
      id: 'compras',
      titulo: 'Compras de Unidades',
      descripcion: 'Compras a proveedores: precio, anticipo real, saldo pendiente y cuotas.',
      icon: Truck,
      color: '#0ea5e9',
      queryKey: 'compras-inf',
      queryFn: () => comprasApi.comprasUnidades().then(r => r.data),
      generar: (datos) => pdfCompras(filtrarPorFecha(datos, 'fecha_compra')),
    },
    {
      id: 'taller',
      titulo: 'Taller — OT y ORI',
      descripcion: 'OT con facturación y ORI con costo interno sin movimiento de caja.',
      icon: Wrench,
      color: '#f97316',
      queryKey: 'taller-inf',
      queryFn: () => tallerApi.servicios().then(r => r.data),
      generar: (datos) => pdfTaller(filtrarPorFecha(datos, 'fecha_ingreso')),
    },
  ]

  const dataMap: Record<string, any[] | undefined> = {
    'ventas':     ventasData?.results  || (Array.isArray(ventasData)  ? ventasData  : undefined),
    'caja':       cajaData?.results    || (Array.isArray(cajaData)    ? cajaData    : undefined),
    'inventario': invData?.results     || (Array.isArray(invData)     ? invData     : undefined),
    'nomina':     rrhhData?.results    || (Array.isArray(rrhhData)    ? rrhhData    : undefined),
    'compras':    comprasData?.results || (Array.isArray(comprasData) ? comprasData : undefined),
    'taller':     tallerData?.results  || (Array.isArray(tallerData)  ? tallerData  : undefined),
  }

  const handleGenerar = async (inf: Informe) => {
    setGenerando(inf.id)
    try {
      let datos = dataMap[inf.id]
      if (!datos) {
        const raw = await inf.queryFn()
        datos = raw?.results || (Array.isArray(raw) ? raw : [])
      }
      if (!datos || datos.length === 0) {
        toast.error('No hay datos disponibles para este informe')
        return
      }
      inf.generar(datos)
      toast.success(`✅ PDF "${inf.titulo}" generado`)
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setGenerando(null)
    }
  }

  const totalDisponibles = Object.values(dataMap).filter(Boolean).length

  return (
    <div className="page-container">
      <Header
        title="Informes"
        subtitle="Generación de reportes PDF por módulo y período"
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={13} color="var(--accent-success)" />
            <span>{totalDisponibles}/{informes.length} fuentes cargadas</span>
          </div>
        }
      />

      {/* ── Filtro de período ── */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Período del informe:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Desde</label>
            <input type="date" className="form-input" style={{ margin: 0, width: 150, fontSize: '0.82rem' }}
              value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Hasta</label>
            <input type="date" className="form-input" style={{ margin: 0, width: 150, fontSize: '0.82rem' }}
              value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm"
            onClick={() => { setDesde(''); setHasta('') }}
            style={{ fontSize: '0.75rem' }}>
            Todo el historial
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
            📅 {periodoStr}
          </span>
        </div>
        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.45rem', marginLeft: '1.8rem' }}>
          El PDF incluirá solo los registros dentro del período. Sin fechas → incluye todo el historial disponible.
        </div>
      </div>

      {/* ── Grid de informes ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {informes.map(inf => (
          <div key={inf.id} style={{ position: 'relative' }}>
            {generando === inf.id && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 10,
                background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem',
              }}>
                <div className="spinner" />
                <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Generando PDF…</span>
              </div>
            )}
            <TarjetaInforme inf={inf} onGenerar={handleGenerar} />
          </div>
        ))}
      </div>
    </div>
  )
}
