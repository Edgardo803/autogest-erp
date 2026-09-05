// Modal: Nueva Venta de Unidad — el flujo central del negocio
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ventasApi, inventarioApi } from '../../api/client'
import { Modal, ModalFooter, Field, Select, FormRow, SectionDivider, Input, Textarea } from '../ui/FormComponents'
import { ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'

const eur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

interface FormData {
  cliente: string
  unidad: string
  fecha_venta: string
  precio_acordado: string
  anticipo: string
  numero_cuotas: string
  tipo_financiacion: string
  observaciones: string
}

const inicial: FormData = {
  cliente: '', unidad: '', fecha_venta: new Date().toISOString().split('T')[0],
  precio_acordado: '', anticipo: '', numero_cuotas: '4',
  tipo_financiacion: 'INTERNO', observaciones: '',
}

interface Props { open: boolean; onClose: () => void }

export function ModalVenta({ open, onClose }: Props) {
  const [form, setForm] = useState<FormData>(inicial)
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes'],
    queryFn: () => ventasApi.clientes().then(r => r.data.results || r.data),
    enabled: open,
  })

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades-disponibles'],
    queryFn: () => inventarioApi.unidadesDisponibles().then(r => r.data),
    enabled: open,
  })

  const set = (campo: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }))
      // Si selecciona unidad, autocompletar precio de venta
      if (campo === 'unidad') {
        const u = unidades.find((u: any) => String(u.id) === e.target.value)
        if (u) setForm(f => ({ ...f, unidad: e.target.value, precio_acordado: String(u.precio_venta) }))
      }
      if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
    }

  const precioAcordado = parseFloat(form.precio_acordado) || 0
  const anticipo = parseFloat(form.anticipo) || 0
  const saldoFinanciado = precioAcordado - anticipo
  const cuotas = parseInt(form.numero_cuotas) || 1
  const montoCuota = saldoFinanciado > 0 && cuotas > 0 ? saldoFinanciado / cuotas : 0
  const esContado = anticipo >= precioAcordado

  const validar = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.cliente) e.cliente = 'Seleccioná un cliente'
    if (!form.unidad) e.unidad = 'Seleccioná una unidad'
    if (!form.precio_acordado || precioAcordado <= 0) e.precio_acordado = 'Ingresá el precio de venta'
    if (anticipo > precioAcordado) e.anticipo = 'El anticipo no puede superar el precio'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => ventasApi.createVenta({
      cliente: parseInt(data.cliente),
      unidad: parseInt(data.unidad),
      fecha_venta: data.fecha_venta,
      precio_acordado: precioAcordado,
      anticipo: anticipo,
      numero_cuotas: esContado ? 0 : cuotas,
      tipo_financiacion: esContado ? 'CONTADO' : data.tipo_financiacion,
      observaciones: data.observaciones,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas-unidades'] })
      queryClient.invalidateQueries({ queryKey: ['unidades-disponibles'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] })
      toast.success(`✅ Venta registrada — ${eur(precioAcordado)}`)
      setForm(inicial)
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al registrar la venta')
    },
  })

  const unidadSeleccionada = unidades.find((u: any) => String(u.id) === form.unidad)
  const clienteSeleccionado = clientes.find((c: any) => String(c.id) === form.cliente)

  return (
    <Modal open={open} onClose={onClose} title="Nueva Venta de Unidad" subtitle="Registrar operación de compraventa" size="lg">

      <SectionDivider label="Partes de la operación" />

      <FormRow cols={2}>
        <Field label="Cliente" required error={errores.cliente}>
          <select
            className="form-input"
            style={errores.cliente ? { borderColor: 'var(--accent-danger)' } : {}}
            value={form.cliente}
            onChange={set('cliente')}
          >
            <option value="">— Seleccioná cliente —</option>
            {clientes.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.apellidos}, {c.nombre} — {c.codigo}
              </option>
            ))}
          </select>
          {clienteSeleccionado && (
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginTop: '0.3rem' }}>
              📞 {clienteSeleccionado.telefono} · {clienteSeleccionado.email}
            </div>
          )}
        </Field>

        <Field label="Unidad a vender" required error={errores.unidad}>
          <select
            className="form-input"
            style={errores.unidad ? { borderColor: 'var(--accent-danger)' } : {}}
            value={form.unidad}
            onChange={set('unidad')}
          >
            <option value="">— Seleccioná unidad disponible —</option>
            {unidades.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.modelo_display} — {u.matricula || 'Sin matrícula'} ({u.estado})
              </option>
            ))}
          </select>
          {unidadSeleccionada && (
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-success)', marginTop: '0.3rem' }}>
              PVP sugerido: {eur(unidadSeleccionada.precio_venta)} · {unidadSeleccionada.kilometros?.toLocaleString()} km
            </div>
          )}
        </Field>
      </FormRow>

      <Field label="Fecha de la venta">
        <Input type="date" value={form.fecha_venta} onChange={set('fecha_venta')} />
      </Field>

      <SectionDivider label="Condiciones económicas" />

      <FormRow cols={2}>
        <Field label="Precio acordado (€)" required error={errores.precio_acordado}>
          <Input
            type="number" min="0" step="100" placeholder="23900"
            value={form.precio_acordado} onChange={set('precio_acordado')}
            error={!!errores.precio_acordado}
          />
        </Field>
        <Field label="Anticipo / Entrega (€)" error={errores.anticipo} hint={esContado ? '✅ Operación al contado' : `Saldo: ${eur(saldoFinanciado)}`}>
          <Input
            type="number" min="0" step="100" placeholder="5000"
            value={form.anticipo} onChange={set('anticipo')}
            error={!!errores.anticipo}
          />
        </Field>
      </FormRow>

      {/* Plan de cuotas — solo si no es contado */}
      {!esContado && saldoFinanciado > 0 && (
        <FormRow cols={2}>
          <Field label="Número de cuotas" hint={`Cuota mensual: ${eur(montoCuota)}`}>
            <Select
              value={form.numero_cuotas}
              onChange={set('numero_cuotas')}
              options={[1,2,3,4,6,8,10,12,18,24,36].map(n => ({ value: n, label: `${n} cuota${n>1?'s':''} de ${eur(saldoFinanciado/n)}` }))}
            />
          </Field>
          <Field label="Tipo de financiación">
            <Select
              value={form.tipo_financiacion}
              onChange={set('tipo_financiacion')}
              options={[
                { value: 'INTERNO', label: 'Financiación interna (plan de pagos)' },
                { value: 'BANCO',   label: 'Financiación bancaria externa' },
                { value: 'PAGARE',  label: 'Pagarés' },
              ]}
            />
          </Field>
        </FormRow>
      )}

      {/* Resumen de la operación */}
      <div style={{
        background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)', padding: '1rem',
        marginBottom: '1rem', fontSize: '0.85rem',
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.6rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Resumen de la operación
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
          {[
            ['Precio acordado', eur(precioAcordado)],
            ['Anticipo / Entrega', eur(anticipo)],
            ['Saldo financiado', eur(saldoFinanciado)],
            ['Modalidad', esContado ? '💵 Contado' : `📆 ${cuotas} cuotas de ${eur(montoCuota)}`],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <Field label="Observaciones / Condiciones especiales">
        <Textarea
          placeholder="Permutas, accesorios incluidos, garantías, condiciones especiales..."
          value={form.observaciones}
          onChange={set('observaciones')}
          rows={2}
        />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={() => validar() && mutate(form)}
        loading={isPending}
        submitLabel="Registrar venta"
        submitIcon={<ShoppingBag size={15} />}
      />
    </Modal>
  )
}
