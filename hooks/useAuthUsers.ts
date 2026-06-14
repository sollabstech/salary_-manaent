'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AuthUser, UserPermissions } from '@/types'
import { getAuthUsers, addAuthUser, updateAuthUser, deleteAuthUser } from '@/services/authService'

export function useAuthUsers() {
  const [users, setUsers] = useState<AuthUser[]>([])

  const refresh = useCallback(() => {
    setUsers(getAuthUsers())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback((data: Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'>): AuthUser => {
    const u = addAuthUser(data)
    refresh()
    return u
  }, [refresh])

  const update = useCallback((id: string, data: Partial<Pick<AuthUser, 'password' | 'permissions'>>) => {
    updateAuthUser(id, data)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteAuthUser(id)
    refresh()
  }, [refresh])

  return { users, refresh, add, update, remove }
}
