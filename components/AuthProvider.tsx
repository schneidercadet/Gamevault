'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  console.log('AuthProvider state:', {
    user: auth.user,
    loading: auth.loading,
    error: auth.error
  });
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
