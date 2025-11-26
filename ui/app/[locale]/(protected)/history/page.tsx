'use client'

import { Suspense, Component, ReactNode } from 'react'
import { HistoryClient } from '@/components/history/HistoryClient'
import { useTranslations } from '@/components/translation-provider'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class HistoryErrorBoundary extends Component<
  { children: ReactNode; fallback: (error: Error, reset: () => void) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: (error: Error, reset: () => void) => ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('History page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, () => {
        this.setState({ hasError: false, error: undefined })
        window.location.reload()
      })
    }

    return this.props.children
  }
}

function HistoryErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const t = useTranslations()
  
  return (
    <div className="text-center py-12 px-4">
      <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-4" />
      <h2 className="text-lg font-medium text-gray-900 mb-2">
        {t('history.error.loadFailed')}
      </h2>
      <p className="text-gray-500 mb-6">
        {error.message || t('history.error.serverError')}
      </p>
      <Button onClick={resetErrorBoundary} className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        {t('history.error.tryAgain')}
      </Button>
    </div>
  )
}

function HistoryLoadingFallback() {
  const t = useTranslations()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t('history.title')}</h1>
      </div>
      
      {/* Stats Loading */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Loading */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse p-6 border rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const t = useTranslations()

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('history.title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          {t('history.subtitle')}
        </p>
      </div>

      <HistoryErrorBoundary
        fallback={(error, reset) => <HistoryErrorFallback error={error} resetErrorBoundary={reset} />}
      >
        <Suspense fallback={<HistoryLoadingFallback />}>
          <HistoryClient />
        </Suspense>
      </HistoryErrorBoundary>
    </div>
  )
}