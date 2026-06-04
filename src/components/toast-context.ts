import { createContext, useContext } from 'react'

export interface ToastAction {
  label: string
  onAction: () => void
}

export interface ShowOptions {
  action?: ToastAction
  durationMs?: number
  tone?: 'default' | 'error'
}

export interface ToastApi {
  show: (message: string, opts?: ShowOptions) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
