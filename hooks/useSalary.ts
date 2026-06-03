'use client'

import { useState, useEffect, useCallback } from 'react'
import type { SalaryRecord } from '@/types'
import {
  getSalaryRecords,
  getSalaryForMonth,
  upsertSalaryRecord,
  markSalaryPaid,
  deleteSalaryRecord,
} from '@/services/salaryService'

export function useSalary() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setRecords(getSalaryRecords())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const upsert = useCallback((data: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const record = upsertSalaryRecord(data)
    refresh()
    return record
  }, [refresh])

  const markPaid = useCallback((id: string) => {
    markSalaryPaid(id)
    refresh()
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteSalaryRecord(id)
    refresh()
  }, [refresh])

  const forMonth = useCallback((month: number, year: number) => getSalaryForMonth(month, year), [])

  return { records, loading, refresh, upsert, markPaid, remove, forMonth }
}
