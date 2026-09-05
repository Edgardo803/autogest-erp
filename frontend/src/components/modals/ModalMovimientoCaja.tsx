// Modal: Nuevo Movimiento de Caja — INGRESO o EGRESO
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cajaApi } from '../../api/client'
import { Modal, ModalFooter, Field, Input, Select, FormRow, SectionDivider, Textarea } from '../ui/FormComponents'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CONCEPTOS_INGRESO = [
  { value: 'CVU',  label: '🚗 Cobro de venta / anticipo de unidad' },
  { value: 'CCC',  label: '📆 Cobro de cuota a cliente' },
  { value: 'CST',  label: '🔧 Cobro de servicio de taller' },
  { value: 'EBA',  label: '🏦 Extracción / transferencia recibida del banco' },
  { value: 'OTR',  label: '💵 Otro ingreso' },
]

const CONCEPTOS_EGRESO = [
  { value: 'PPU',  label: '🚗 Pago a proveedor — Unidad' },
  { value: 'PPI',  label: '📦 Pago a proveedor — Insumos / Repuestos' },
  { value: 'PSU',  label: '👔 Pago de nómina / sueldo' },
  { value: 'PSR',  label: '⚡ Pago de servicio (luz, agua, alquiler, etc.)' },
  { value: 'DBA',  label: '🏦 Depósito / transferencia al banco' },
  { value: 'OTR',  label: '💸 Otro egreso' },
]

interface FormData {
  tipo: 'INGRESO' | 'EGRESO'
  concepto: string
  monto: string
  fecha: string
  numero_documento: string
  descripcion: string
}

const hoy = new Date().toISOString().split('T')[0]

const inicial: FormData = {
  tipo: 'INGRESO',
  concepto: '',
  monto: '',
  fecha: hoy,
  numero_documento: '',
  descripcion: '',
}

interface Props {
  open: boolean
  onClose: () => void
  tipoInicial?: 'INGRESO' | 'EGRESO'
}

export function ModalMovimientoCaja({ open, onClose, tipoInicial = 'INGRESO' }: Props) {
  const [form, setForm] = useState<FormData>({ ...inicial, tipo: tipoInicial })
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const set = (campo: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }))
      if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
    }

  const handleTipo = (tipo: 'INGRESO' | 'EGRESO') => {
    setForm(f => ({ ...f, tipo, concepto: '' }))
  }

  const validar = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.concepto) e.concepto = 'Seleccioná el concepto'
    if (!form.monto || parseFloat(form.monto) <= 0) e.monto = 'Ingresá un monto válido'
    if (!form.fecha) e.fecha = 'La fecha es obligatoria'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => cajaApi.createMovimiento({
      tipo: form.tipo,
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      fecha: form.fecha,
      numero_documento: form.numero_documento || undefined,
      descripcion: form.descripcion || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos-caja'] })
      queryClient.invalidateQueries({ queryKey: ['resumen-caja'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] })
      const signo = form.tipo === 'INGRESO' ? '+' : '-'
      const monto = parseFloat(form.monto).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
      toast.success(`${form.tipo === 'INGRESO' ? '✅ Ingreso' : '⬆️ Egreso'} registrado: ${signo}${monto}`)
      setForm({ ...inicial, tipo: tipoInicial })
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al registrar el movimiento')
    },
  })

  const esIngreso = form.tipo === 'INGRESO'
  const conceptos = esIngreso ? CONCEPTOS_INGRESO : CONCEPTOS_EGRESO

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Movimiento de Caja"
      subtitle="Registrar ingreso o egreso de efectivo"
      size="md"
    >
      {/* Selector de tipo — botones grandes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => handleTipo('INGRESO')}
          style={{
            padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '2px solid',
            borderColor: esIngreso ? 'var(--accent-success)' : 'var(--border-subtle)',
            background: esIngreso ? 'rgba(34,201,120,0.1)' : 'var(--bg-surface)',
            color: esIngreso ? 'var(--accent-success)' : 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.15s',
          }}
        >
          <ArrowUpCircle size={20} /> INGRESO
        </button>
        <button
          onClick={() => handleTipo('EGRESO')}
          style={{
            padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '2px solid',
            borderColor: !esIngreso ? 'var(--accent-danger)' : 'var(--border-subtle)',
            background: !esIngreso ? 'rgba(239,68,68,0.1)' : 'var(--bg-surface)',
            color: !esIngreso ? 'var(--accent-danger)' : 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.15s',
          }}
        >
          <ArrowDownCircle size={20} /> EGRESO
        </button>
      </div>

      <SectionDivider label="Detalle del movimiento" />

      <Field label="Concepto" required error={errores.concepto}>
        <Select
          value={form.concepto}
          onChange={set('concepto')}
          error={!!errores.concepto}
          placeholder="— Seleccioná el concepto —"
          options={conceptos}
        />
      </Field>

      <FormRow cols={2}>
        <Field label="Monto (€)" required error={errores.monto}>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.monto}
            onChange={set('monto')}
            error={!!errores.monto}
            style={{
              fontSize: '1.1rem', fontFamily: 'Space Grotesk', fontWeight: 700,
              color: esIngreso ? 'var(--accent-success)' : 'var(--accent-danger)',
            }}
          />
        </Field>
        <Field label="Fecha" required error={errores.fecha}>
          <Input type="date" value={form.fecha} onChange={set('fecha')} error={!!errores.fecha} />
        </Field>
      </FormRow>

      <Field label="Número de documento / comprobante" hint="Nro. de factura, recibo, orden, etc. (opcional)">
        <Input
          placeholder="FAC-001, REC-2026-08-27, etc."
          value={form.numero_documento}
          onChange={set('numero_documento')}
          style={{ textTransform: 'uppercase' }}
        />
      </Field>

      <Field label="Descripción / Detalle adicional">
        <Textarea
          placeholder="Detalles adicionales del movimiento, nombre del cliente/proveedor, etc."
          value={form.descripcion}
          onChange={set('descripcion')}
          rows={2}
        />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={() => validar() && mutate()}
        loading={isPending}
        submitLabel={`Registrar ${form.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso'}`}
        submitIcon={esIngreso ? <ArrowUpCircle size={15} /> : <ArrowDownCircle size={15} />}
      />
    </Modal>
  )
}
