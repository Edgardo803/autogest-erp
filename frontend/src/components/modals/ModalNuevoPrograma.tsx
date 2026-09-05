// Modal: Nuevo Programa de Auditoría
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auditoriaApi } from '../../api/client'
import { Modal, ModalFooter, Field, Input, Select, FormRow, Textarea, SectionDivider } from '../ui/FormComponents'
import toast from 'react-hot-toast'

const MODULOS = [
  { value: 'VENTAS',     label: '🚗 Ventas' },
  { value: 'COMPRAS',    label: '📦 Compras' },
  { value: 'CAJA',       label: '💰 Caja / Tesorería' },
  { value: 'FINANCIERO', label: '📊 Financiero' },
  { value: 'RRHH',       label: '👥 RRHH' },
  { value: 'INVENTARIO', label: '🔧 Inventario' },
  { value: 'ACCOUNTS',   label: '🔐 Usuarios / Accesos' },
  { value: 'SISTEMA',    label: '⚙️ Sistema general' },
]

interface FormData {
  titulo: string
  modulo_objetivo: string
  fecha_programada: string
  objetivos: string
  responsable: string  // ID del auditor
}

const inicial: FormData = {
  titulo: '',
  modulo_objetivo: '',
  fecha_programada: '',
  objetivos: '',
  responsable: '2',   // ID del usuario auditoria por defecto
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ModalNuevoPrograma({ open, onClose }: Props) {
  const [form, setForm] = useState<FormData>(inicial)
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const set = (campo: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }))
      if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
    }

  const validar = () => {
    const e: Partial<FormData> = {}
    if (!form.titulo.trim())          e.titulo          = 'El título es obligatorio'
    if (!form.modulo_objetivo)        e.modulo_objetivo = 'Seleccioná el módulo objetivo'
    if (!form.fecha_programada)       e.fecha_programada = 'La fecha es obligatoria'
    if (!form.objetivos.trim())       e.objetivos       = 'Describí los objetivos de la auditoría'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => auditoriaApi.createPrograma({
      titulo: form.titulo,
      modulo_objetivo: form.modulo_objetivo,
      fecha_programada: form.fecha_programada,
      objetivos: form.objetivos,
      responsable: parseInt(form.responsable),
      estado: 'PROGRAMADA',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programas-auditoria'] })
      toast.success('✅ Programa de auditoría registrado')
      setForm(inicial)
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al crear el programa')
    },
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo Programa de Auditoría"
      subtitle="Planificar una auditoría formal en un módulo del sistema"
      size="md"
    >
      <Field label="Título / Denominación" required error={errores.titulo}>
        <Input
          placeholder="Ej: Auditoría de Caja — Cierre Mensual Agosto"
          value={form.titulo}
          onChange={set('titulo')}
          error={!!errores.titulo}
        />
      </Field>

      <FormRow cols={2}>
        <Field label="Módulo objetivo" required error={errores.modulo_objetivo}>
          <Select
            value={form.modulo_objetivo}
            onChange={set('modulo_objetivo')}
            error={!!errores.modulo_objetivo}
            placeholder="— Seleccioná el módulo —"
            options={MODULOS}
          />
        </Field>
        <Field label="Fecha programada" required error={errores.fecha_programada}>
          <Input
            type="date"
            value={form.fecha_programada}
            onChange={set('fecha_programada')}
            error={!!errores.fecha_programada}
          />
        </Field>
      </FormRow>

      <SectionDivider label="Contenido de la auditoría" />

      <Field
        label="Objetivos"
        required
        error={errores.objetivos}
        hint="¿Qué se busca verificar, controlar o detectar?"
      >
        <Textarea
          placeholder="Ej: Verificar cuadre de caja diario, validar movimientos del período, revisar autorizaciones de egresos superiores a €1.000, controlar documentación respaldatoria..."
          value={form.objetivos}
          onChange={set('objetivos')}
          error={!!errores.objetivos}
          rows={4}
        />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={() => validar() && mutate()}
        loading={isPending}
        submitLabel="Registrar Programa"
      />
    </Modal>
  )
}
