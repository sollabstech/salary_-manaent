'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Branch } from '@/types'
import { getBranches, addBranch, updateBranch, deleteBranch } from '@/services/branchService'

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setBranches(getBranches())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback((data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Branch => {
    const b = addBranch(data)
    refresh()
    return b
  }, [refresh])

  const update = useCallback((id: string, data: Partial<Pick<Branch, 'name' | 'address' | 'phone'>>) => {
    updateBranch(id, data)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteBranch(id)
    refresh()
  }, [refresh])

  return { branches, loading, refresh, add, update, remove }
}
