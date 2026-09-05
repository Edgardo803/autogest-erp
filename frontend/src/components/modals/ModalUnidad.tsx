// Modal: Alta de Unidad vehicular en inventario
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { inventarioApi } from '../../api/client'
import { Modal, ModalFooter, Field, Input, Select, FormRow, SectionDivider, Textarea } from '../ui/FormComponents'
import { Car } from 'lucide-react'
import toast from 'react-hot-toast'

interface FormData {
  modelo: string
  numero_serie: string
  matricula: string
  color: string
  año_fabricacion: string
  kilometros: string
  estado: string
  precio_costo: string
  precio_venta: string
  proveedor: string
  fecha_ingreso: string
  combustible: string
  transmision: string
  observaciones: string
}

const inicial: FormData = {
  modelo: '', numero_serie: '', matricula: '', color: '',
  año_fabricacion: new Date().getFullYear().toString(),
  kilometros: '0', estado: 'NUEVA',
  precio_costo: '', precio_venta: '',
  proveedor: '', fecha_ingreso: new Date().toISOString().split('T')[0],
  combustible: 'GASOLINA', transmision: 'MANUAL',
  observaciones: '',
}

interface Props { open: boolean; onClose: () => void }

export function ModalUnidad({ open, onClose }: Props) {
  const [form, setForm] = useState<FormData>(inicial)
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos'],
    queryFn: () => inventarioApi.marcas().then(r => r.data),
    enabled: open,
  })

  // Cuando cambia precio de costo, sugerir PVP con margen del 25%
  const handleCostoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const costo = parseFloat(e.target.value) || 0
    setForm(f => ({
      ...f,
      precio_costo: e.target.value,
      precio_venta: costo > 0 ? (costo * 1.25).toFixed(0) : f.precio_venta,
    }))
  }

  const set = (campo: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }))
      if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
    }

  const validar = (): boolean => {
    const e: Partial<FormData> = {}
    if (!form.modelo) e.modelo = 'Seleccioná un modelo'
    if (!form.numero_serie.trim()) e.numero_serie = 'El número de serie es obligatorio'
    if (!form.precio_costo || parseFloat(form.precio_costo) <= 0) e.precio_costo = 'Ingresá el precio de costo'
    if (!form.precio_venta || parseFloat(form.precio_venta) <= 0) e.precio_venta = 'Ingresá el precio de venta'
    if (parseFloat(form.precio_venta) <= parseFloat(form.precio_costo))
      e.precio_venta = 'El PVP debe ser mayor al costo'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => inventarioApi.createUnidad({
      ...data,
      kilometros: parseInt(data.kilometros) || 0,
      precio_costo: parseFloat(data.precio_costo),
      precio_venta: parseFloat(data.precio_venta),
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] })
      queryClient.invalidateQueries({ queryKey: ['inventario'] })
      toast.success(`Unidad ${res.data.modelo_display || ''} registrada — Serie: ${res.data.numero_serie}`)
      setForm(inicial)
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        const mapeados: Partial<FormData> = {}
        Object.entries(detail).forEach(([k, v]) => {
          mapeados[k as keyof FormData] = Array.isArray(v) ? (v[0] as string) : String(v)
        })
        setErrores(mapeados)
      }
      toast.error('Revisá los campos marcados')
    },
  })

  const margen = form.precio_costo && form.precio_venta
    ? (((parseFloat(form.precio_venta) - parseFloat(form.precio_costo)) / parseFloat(form.precio_costo)) * 100).toFixed(1)
    : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva Unidad"
      subtitle="Registrar vehículo en el inventario"
      size="xl"
    >
      <SectionDivider label="Identificación del vehículo" />

      <FormRow cols={2}>
        <Field label="Modelo" required error={errores.modelo}>
          <select
            className="form-input"
            style={errores.modelo ? { borderColor: 'var(--accent-danger)' } : {}}
            value={form.modelo}
            onChange={set('modelo')}
          >
            <option value="">— Seleccioná marca y modelo —</option>
            {modelos.map((marca: any) =>
              <optgroup key={marca.id} label={`🏷 ${marca.nombre}`}>
                {marca.modelos?.map((mod: any) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.nombre} ({mod.año}) — {mod.tipo}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </Field>
        <Field label="Estado" required>
          <Select
            value={form.estado}
            onChange={set('estado')}
            options={[
              { value: 'NUEVA', label: '🟢 Nueva (0 km)' },
              { value: 'USADA', label: '🟡 Usada' },
              { value: 'CONSIGNACION', label: '🔵 Consignación' },
              { value: 'RESERVADA', label: '🟣 Reservada' },
            ]}
          />
        </Field>
      </FormRow>

      <FormRow cols={3}>
        <Field label="Número de serie (VIN/Chasis)" required error={errores.numero_serie}>
          <Input
            placeholder="WBA3A5C50CF256843"
            value={form.numero_serie}
            onChange={set('numero_serie')}
            error={!!errores.numero_serie}
            style={{ textTransform: 'uppercase', fontSize: '0.82rem' }}
          />
        </Field>
        <Field label="Matrícula" hint="Puede quedar vacía si no está matriculado aún">
          <Input
            placeholder="1234 ABC"
            value={form.matricula}
            onChange={set('matricula')}
            style={{ textTransform: 'uppercase' }}
          />
        </Field>
        <Field label="Año de fabricación">
          <Input
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            value={form.año_fabricacion}
            onChange={set('año_fabricacion')}
          />
        </Field>
      </FormRow>

      <FormRow cols={3}>
        <Field label="Color">
          <Input placeholder="Ej: Blanco Perla" value={form.color} onChange={set('color')} />
        </Field>
        <Field label="Combustible">
          <Select
            value={form.combustible}
            onChange={set('combustible')}
            options={[
              { value: 'GASOLINA', label: 'Gasolina' },
              { value: 'DIESEL',   label: 'Diésel' },
              { value: 'HIBRIDO',  label: 'Híbrido' },
              { value: 'ELECTRICO',label: 'Eléctrico' },
              { value: 'GLP',      label: 'GLP / Gas' },
            ]}
          />
        </Field>
        <Field label="Transmisión">
          <Select
            value={form.transmision}
            onChange={set('transmision')}
            options={[
              { value: 'MANUAL',    label: 'Manual' },
              { value: 'AUTOMATICO',label: 'Automático' },
              { value: 'CVT',       label: 'CVT' },
            ]}
          />
        </Field>
      </FormRow>

      <FormRow cols={2}>
        <Field label="Kilómetros">
          <Input
            type="number"
            min="0"
            value={form.kilometros}
            onChange={set('kilometros')}
            placeholder="0"
          />
        </Field>
        <Field label="Fecha de ingreso al stock">
          <Input type="date" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} />
        </Field>
      </FormRow>

      <SectionDivider label="Precio" />

      <FormRow cols={3}>
        <Field label="Precio de costo (€)" required error={errores.precio_costo}>
          <Input
            type="number"
            min="0"
            step="100"
            placeholder="18500"
            value={form.precio_costo}
            onChange={handleCostoChange}
            error={!!errores.precio_costo}
          />
        </Field>
        <Field
          label="Precio de venta / PVP (€)"
          required
          error={errores.precio_venta}
          hint={margen ? `Margen: ${margen}%` : 'Se calcula automáticamente (+25%)'}
        >
          <Input
            type="number"
            min="0"
            step="100"
            placeholder="23100"
            value={form.precio_venta}
            onChange={set('precio_venta')}
            error={!!errores.precio_venta}
            style={margen && parseFloat(margen) > 0 ? { borderColor: 'var(--accent-success)' } : {}}
          />
        </Field>
        <Field label="Proveedor / Origen">
          <Input placeholder="Toyota España S.A." value={form.proveedor} onChange={set('proveedor')} />
        </Field>
      </FormRow>

      {/* Indicador de margen */}
      {margen && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          padding: '0.75rem 1rem', background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
          fontSize: '0.82rem',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Margen bruto:</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: parseFloat(margen) > 15 ? 'var(--accent-success)' : parseFloat(margen) > 0 ? 'var(--accent-warning)' : 'var(--accent-danger)' }}>
            {margen}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>Ganancia bruta:</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-primary)' }}>
            €{(parseFloat(form.precio_venta || '0') - parseFloat(form.precio_costo || '0')).toLocaleString('es-ES')}
          </span>
        </div>
      )}

      <SectionDivider label="Observaciones" />
      <Field label="Notas internas">
        <Textarea
          placeholder="Estado del vehículo, equipamiento especial, historial de servicio..."
          value={form.observaciones}
          onChange={set('observaciones')}
          rows={2}
        />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={() => validar() && mutate(form)}
        loading={isPending}
        submitLabel="Registrar en inventario"
        submitIcon={<Car size={15} />}
      />
    </Modal>
  )
}
