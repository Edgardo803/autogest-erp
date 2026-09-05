// Componentes de UI reutilizables para formularios ABM
import type { ReactNode } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'

// ─── Modal base ───────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  if (!open) return null

  const widths = { sm: '420px', md: '560px', lg: '720px', xl: '900px' }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: widths[size],
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header del modal */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{title}</div>
            {subtitle && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Fila de campos ───────────────────────────────────────────
export function FormRow({ children, cols = 2 }: { children: ReactNode; cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', marginBottom: '1rem' }}>
      {children}
    </div>
  )
}

// ─── Campo de formulario ──────────────────────────────────────
interface FieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
  hint?: string
}

export function Field({ label, required, error, children, hint }: FieldProps) {
  return (
    <div>
      <label className="form-label">
        {label}
        {required && <span style={{ color: 'var(--accent-danger)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {hint && !error && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{hint}</div>}
      {error && (
        <div style={{ fontSize: '0.72rem', color: 'var(--accent-danger)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertTriangle size={11} /> {error}
        </div>
      )}
    </div>
  )
}

// ─── Input estándar ───────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}
export function Input({ error, ...props }: InputProps) {
  return (
    <input
      className="form-input"
      style={error ? { borderColor: 'var(--accent-danger)' } : undefined}
      {...props}
    />
  )
}

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string | number; label: string }[]
  placeholder?: string
}
export function Select({ error, options, placeholder, ...props }: SelectProps) {
  return (
    <select
      className="form-input"
      style={error ? { borderColor: 'var(--accent-danger)' } : undefined}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}
export function Textarea({ error, ...props }: TextareaProps) {
  return (
    <textarea
      className="form-input"
      rows={3}
      style={{ resize: 'vertical', ...(error ? { borderColor: 'var(--accent-danger)' } : {}) }}
      {...props}
    />
  )
}

// ─── Footer de acciones del modal ─────────────────────────────
interface ModalFooterProps {
  onClose: () => void
  onSubmit: () => void
  loading?: boolean
  submitLabel?: string
  submitIcon?: ReactNode
}
export function ModalFooter({ onClose, onSubmit, loading, submitLabel = 'Guardar', submitIcon }: ModalFooterProps) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
      padding: '1rem 1.5rem',
      borderTop: '1px solid var(--border-subtle)',
      flexShrink: 0,
    }}>
      <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
        Cancelar
      </button>
      <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>
        {loading ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : submitIcon}
        {loading ? 'Guardando...' : submitLabel}
      </button>
    </div>
  )
}

// ─── Separador de sección ─────────────────────────────────────
export function SectionDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      margin: '1.25rem 0 1rem',
    }}>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
    </div>
  )
}
