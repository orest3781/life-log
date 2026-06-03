import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

// Catches render-time errors anywhere below it and shows a calm recovery screen
// instead of a blank page — while reassuring the user their data is safe on the
// device (nothing here touches the database).
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Waystone crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-paper px-8 text-center">
        <div className="font-display text-2xl font-bold text-ink">
          Something went wrong
        </div>
        <p className="max-w-xs text-[15px] leading-relaxed text-muted">
          Your log is safe — it's stored on this device. Reloading usually fixes
          this.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="brut-press rounded-xl border-[2.5px] border-ink bg-accent px-5 py-3 font-semibold text-white shadow-[3px_3px_0_var(--color-ink)]"
        >
          Reload
        </button>
      </div>
    )
  }
}
