'use client'

import { createContext, useContext, ReactNode } from 'react'

interface DashboardContextType {
  refreshInterventions: () => void
  refreshCheckins: () => void
  refreshAnalytics: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

interface DashboardProviderProps {
  children: ReactNode
  refreshInterventions: () => void
  refreshCheckins: () => void
  refreshAnalytics: () => void
}

export function DashboardProvider({ 
  children, 
  refreshInterventions, 
  refreshCheckins, 
  refreshAnalytics 
}: DashboardProviderProps) {
  return (
    <DashboardContext.Provider value={{ 
      refreshInterventions, 
      refreshCheckins, 
      refreshAnalytics 
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}