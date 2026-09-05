// Modal: Nuevo Informe de Auditoría — asociado a un Programa
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { auditoriaApi } from '../../api/client'
import { Modal, ModalFooter, Field, Input, Select, FormRow, Textarea, SectionDivider } from '../ui/FormComponents'
import { FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const NIVELES_RIESGO = [
  { value: 'BAJO',    label: '🟢 Bajo — Sin irregularidades significativas' },
  { value: 'MEDIO',   label: '🟡 Medio — Observaciones menores detectadas' },
  { value: 'ALTO',    label: '🟠 Alto — Irregularidades que requieren acción' },
  { value: 'CRITICO', label: '🔴 Crítico — Situación de riesgo grave para la empresa' },
]

interface FormData {
  programa: string
  fecha_informe: string
  nivel_riesgo: string
  resumen_ejecutivo: string
  observaciones: string
  acciones_requeridas: string
  fecha_seguimiento: string
}

const hoy = new Date().toISOString().split('T')[0]

const inicial: FormData = {
  programa: '',
  fecha_informe: hoy,
  nivel_riesgo: '',
  resumen_ejecutivo: '',
  observaciones: '',
  acciones_requeridas: '',
  fecha_seguimiento: '',
}

interface Props {
  open: boolean
  onClose: () => void
  programas: any[]           // Lista de programas disponibles
  programaPreseleccionado?: number
}

export function ModalNuevoInforme({ open, onClose, programas, programaPreseleccionado }: Props) {
  const [form, setForm] = useState<FormData>({
    ...inicial,
    programa: programaPreseleccionado ? String(programaPreseleccionado) : '',
  })
  const [errores, setErrores] = useState<Partial<FormData>>({})
  const queryClient = useQueryClient()

  const set = (campo: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [campo]: e.target.value }))
      if (errores[campo]) setErrores(er => ({ ...er, [campo]: '' }))
    }

  const validar = () => {
    const e: Partial<FormData> = {}
    if (!form.programa)                    e.programa           = 'Seleccioná el programa al que corresponde'
    if (!form.fecha_informe)               e.fecha_informe      = 'La fecha es obligatoria'
    if (!form.nivel_riesgo)                e.nivel_riesgo       = 'Calificá el nivel de riesgo detectado'
    if (!form.resumen_ejecutivo.trim())    e.resumen_ejecutivo  = 'El resumen ejecutivo es obligatorio'
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () => auditoriaApi.createInforme({
      programa: parseInt(form.programa),
      fecha_informe: form.fecha_informe,
      nivel_riesgo: form.nivel_riesgo,
      resumen_ejecutivo: form.resumen_ejecutivo,
      observaciones: form.observaciones || undefined,
      acciones_requeridas: form.acciones_requeridas || undefined,
      fecha_seguimiento: form.fecha_seguimiento || undefined,
    }),
    onSuccess: async () => {
      // Marcar el programa como completado e informe generado
      if (form.programa) {
        await auditoriaApi.updatePrograma(parseInt(form.programa), {
          estado: 'COMPLETADA',
          informe_generado: true,
          fecha_realizacion: form.fecha_informe,
        }).catch(() => {})
      }
      queryClient.invalidateQueries({ queryKey: ['informes-auditoria'] })
      queryClient.invalidateQueries({ queryKey: ['programas-auditoria'] })
      toast.success('📄 Informe de auditoría emitido para Gerencia General')
      setForm(inicial)
      setErrores({})
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Error al emitir el informe')
    },
  })

  // Opciones de programa: solo los no completados (aún abiertos)
  const programasDisponibles = programas
    .filter(p => p.estado !== 'CANCELADA')
    .map(p => ({
      value: String(p.id),
      label: `${p.titulo} — ${p.estado === 'COMPLETADA' ? '✓' : '⏳'} ${p.modulo_objetivo}`,
    }))

  const progSeleccionado = programas.find(p => String(p.id) === form.programa)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Emitir Informe de Auditoría"
      subtitle="Documento formal para Gerencia General"
      size="lg"
    >
      {/* Info contextual */}
      <div style={{
        display: 'flex', gap: '0.6rem', padding: '0.75rem 0.9rem',
        background: 'rgba(79,142,247,0.07)', borderRadius: 8,
        border: '1px solid rgba(79,142,247,0.2)', marginBottom: '1rem',
        fontSize: '0.8rem', color: 'var(--text-secondary)',
      }}>
        <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>
          Este informe queda registrado formalmente y es visible para <strong>Gerencia General</strong>.
          Al emitirlo, el programa de auditoría asociado se marcará como <strong>Completado</strong>.
        </span>
      </div>

      <FormRow cols={2}>
        <Field label="Programa de auditoría" required error={errores.programa}>
          <Select
            value={form.programa}
            onChange={set('programa')}
            error={!!errores.programa}
            placeholder="— Seleccioná el programa —"
            options={programasDisponibles}
          />
        </Field>
        <Field label="Fecha del informe" required error={errores.fecha_informe}>
          <Input type="date" value={form.fecha_informe} onChange={set('fecha_informe')} error={!!errores.fecha_informe} />
        </Field>
      </FormRow>

      {/* Módulo del programa seleccionado */}
      {progSeleccionado && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', padding: '0.4rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 6 }}>
          📋 Módulo auditado: <strong>{progSeleccionado.modulo_objetivo}</strong> · Objetivos: {progSeleccionado.objetivos}
        </div>
      )}

      <Field label="Nivel de riesgo detectado" required error={errores.nivel_riesgo}
        hint="Calificación global de la situación encontrada">
        <Select
          value={form.nivel_riesgo}
          onChange={set('nivel_riesgo')}
          error={!!errores.nivel_riesgo}
          placeholder="— Seleccioná el nivel —"
          options={NIVELES_RIESGO}
        />
      </Field>

      <SectionDivider label="Contenido del informe" />

      <Field label="Resumen Ejecutivo" required error={errores.resumen_ejecutivo}
        hint="Síntesis clara para Gerencia General — máximo 3 párrafos">
        <Textarea
          placeholder="Descripción objetiva de los hechos observados, su magnitud y contexto. Este es el texto que leerá Gerencia General como primera información..."
          value={form.resumen_ejecutivo}
          onChange={set('resumen_ejecutivo')}
          error={!!errores.resumen_ejecutivo}
          rows={4}
        />
      </Field>

      <Field label="Observaciones detalladas"
        hint="Detalle técnico de hallazgos, evidencias, procedimientos relevados">
        <Textarea
          placeholder="Descripción pormenorizada de cada hallazgo: fechas exactas, operaciones revisadas, documentación analizada, irregularidades detectadas con su respaldo..."
          value={form.observaciones}
          onChange={set('observaciones')}
          rows={3}
        />
      </Field>

      <Field label="Acciones requeridas"
        hint="Medidas correctivas que debe tomar la empresa — se comunican a GG">
        <Textarea
          placeholder="1. Acción concreta que debe tomarse. 2. Responsable propuesto. 3. Plazo sugerido..."
          value={form.acciones_requeridas}
          onChange={set('acciones_requeridas')}
          rows={3}
        />
      </Field>

      <Field label="Fecha de seguimiento sugerida"
        hint="Cuándo verificar que se aplicaron las acciones correctivas">
        <Input type="date" value={form.fecha_seguimiento} onChange={set('fecha_seguimiento')} />
      </Field>

      <ModalFooter
        onClose={onClose}
        onSubmit={() => validar() && mutate()}
        loading={isPending}
        submitLabel="Emitir Informe a Gerencia General"
        submitIcon={<FileText size={14} />}
      />
    </Modal>
  )
}
