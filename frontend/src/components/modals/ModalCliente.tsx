// Modal: Alta / Edición de Cliente
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ventasApi } from '../../api/client'
import { Modal, ModalFooter, Field, Input, Select, FormRow, SectionDivider, Textarea } from '../ui/FormComponents'
import { UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface FormData {
  nombre: string
  apellidos: string
  dni_nie: string
  fecha_nacimiento: string
  telefono: string
  telefono_alternativo: string
  email: string
  direccion: string
  ciudad: string
  codigo_postal: string
  tipo_cliente: string
  observaciones: string
}

const inicial: FormData = {
  nombre: '', apellidos: '', dni_nie: '', fecha_nacimiento: '',
  telefono: '', telefono_alternativo: '', email: '',
  direccion: '', ciudad: '', codigo_postal: '',
  tipo_cliente: 'PARTICULAR', observaciones: '',
}

interface Props {
  open: boolean
  onClose: () => void
  clienteEditar?: any  // Si viene, es edición
}

export function ModalCliente({ open, onClose, clienteEditar }: Props) {
  const [form, setForm] = useState<FormData>(clienteEditar || inicial)
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const esEdicion = !!clienteEditar

  const set = (campo: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [campo]: e.target.value }))
    if (errores[campo]) setErrores(e => ({ ...e, [campo]: '' }))
  }

  const validar = (): boolean => {
    const nuevos: Partial<FormData> = {}
    if (!form.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!form.apellidos.trim()) nuevos.apellidos = 'Los apellidos son obligatorios'
    if (!form.telefono.trim()) nuevos.telefono = 'El teléfono es obligatorio'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) nuevos.email = 'Email inválido'
    if (form.dni_nie && !/^[0-9XYZ]\d{7}[A-Z]$/i.test(form.dni_nie.replace(/[\s-]/g, '')))
      nuevos.dni_nie = 'Formato DNI/NIE inválido'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      esEdicion
        ? ventasApi.updateCliente(clienteEditar.id, data)
        : ventasApi.createCliente(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(esEdicion
        ? `Cliente ${res.data.nombre} actualizado`
        : `Cliente ${res.data.nombre} creado — Código: ${res.data.codigo}`)
      setForm(inicial)
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      const detail = err.response?.data
      if (typeof detail === 'object') {
        // Mapear errores del backend al formulario
        const mapeados: Partial<FormData> = {}
        Object.entries(detail).forEach(([k, v]) => {
          mapeados[k as keyof FormData] = Array.isArray(v) ? (v[0] as string) : String(v)
        })
        setErrores(mapeados)
      }
      toast.error('Revisá los campos marcados en rojo')
    },
  })

  const handleSubmit = () => {
    if (validar()) mutate(form)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? `Editar Cliente — ${clienteEditar?.codigo}` : 'Nuevo Cliente'}
      subtitle={esEdicion ? 'Modificar datos del cliente' : 'Registrar nuevo cliente en el sistema'}
      size="lg"
    >
      <SectionDivider label="Datos personales" />

      <FormRow cols={2}>
        <Field label="Nombre" required error={errores.nombre}>
          <Input placeholder="Ej: Antonio" value={form.nombre} onChange={set('nombre')} error={!!errores.nombre} />
        </Field>
        <Field label="Apellidos" required error={errores.apellidos}>
          <Input placeholder="Ej: García Martínez" value={form.apellidos} onChange={set('apellidos')} error={!!errores.apellidos} />
        </Field>
      </FormRow>

      <FormRow cols={3}>
        <Field label="DNI / NIE" error={errores.dni_nie} hint="Ej: 12345678A">
          <Input placeholder="12345678A" value={form.dni_nie} onChange={set('dni_nie')} error={!!errores.dni_nie} style={{ textTransform: 'uppercase' }} />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
        </Field>
        <Field label="Tipo de cliente">
          <Select
            value={form.tipo_cliente}
            onChange={set('tipo_cliente')}
            options={[
              { value: 'PARTICULAR', label: 'Particular' },
              { value: 'EMPRESA', label: 'Empresa' },
              { value: 'AUTONOMO', label: 'Autónomo' },
            ]}
          />
        </Field>
      </FormRow>

      <SectionDivider label="Contacto" />

      <FormRow cols={2}>
        <Field label="Teléfono principal" required error={errores.telefono}>
          <Input placeholder="612 345 678" value={form.telefono} onChange={set('telefono')} error={!!errores.telefono} />
        </Field>
        <Field label="Teléfono alternativo">
          <Input placeholder="623 456 789" value={form.telefono_alternativo} onChange={set('telefono_alternativo')} />
        </Field>
      </FormRow>

      <Field label="Email" error={errores.email} hint="Se usará para el envío de documentos">
        <Input type="email" placeholder="cliente@email.com" value={form.email} onChange={set('email')} error={!!errores.email} />
      </Field>

      <SectionDivider label="Dirección" />

      <Field label="Dirección (calle y número)">
        <Input placeholder="Calle Mayor 1, 3ºA" value={form.direccion} onChange={set('direccion')} />
      </Field>

      <FormRow cols={2}>
        <Field label="Ciudad / Municipio">
          <Input placeholder="Madrid" value={form.ciudad} onChange={set('ciudad')} />
        </Field>
        <Field label="Código postal">
          <Input placeholder="28001" maxLength={5} value={form.codigo_postal} onChange={set('codigo_postal')} />
        </Field>
      </FormRow>

      <SectionDivider label="Observaciones" />

      <Field label="Notas internas">
        <Textarea
          placeholder="Preferencias, historial relevante, forma de pago habitual..."
          value={form.observaciones}
          onChange={set('observaciones')}
          rows={2}
        />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={handleSubmit}
        loading={isPending}
        submitLabel={esEdicion ? 'Guardar cambios' : 'Registrar cliente'}
        submitIcon={<UserPlus size={15} />}
      />
    </Modal>
  )
}
