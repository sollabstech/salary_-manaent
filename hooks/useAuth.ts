'use client'

import { useState, useCallback } from 'react'
import type { AuthSession } from '@/types'
import { loginUser, logoutUser, getSession } from '@/services/authService'

export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(() =>
    typeof window !== 'undefined' ? getSession() : null
  )

  const login = useCallback((username: string, password: string): boolean => {
    const s = loginUser(username, password)
    if (s) setSession(s)
    return s !== null
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setSession(null)
  }, [])

  const refresh = useCallback(() => {
    setSession(getSession())
  }, [])

  return { session, login, logout, refresh }
}
