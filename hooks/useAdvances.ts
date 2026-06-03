'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AdvanceRecord } from '@/types'
import {
  getAdvanceRecords,
  addAdvance,
  updateAdvance,
  deleteAdvance,
  markAdvanceAdjusted,
} from '@/services/advanceService'

export function useAdvances() {
  const [records, setRecords] = useState<AdvanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setRecords(getAdvanceRecords())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback((data: Omit<AdvanceRecord, 'id' | 'adjustedAmount' | 'createdAt' | 'updatedAt'>) => {
    const record = addAdvance(data)
    refresh()
    return record
  }, [refresh])

  const update = useCallback((id: string, data: Partial<AdvanceRecord>) => {
    const record = updateAdvance(id, data)
    refresh()
    return record
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteAdvance(id)
    refresh()
  }, [refresh])

  const markAdjusted = useCallback((id: string) => {
    markAdvanceAdjusted(id)
    refresh()
  }, [refresh])

  return { records, loading, refresh, add, update, remove, markAdjusted }
}
