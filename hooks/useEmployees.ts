'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Employee } from '@/types'
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from '@/services/employeeService'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setEmployees(getEmployees())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback((data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const emp = addEmployee(data)
    refresh()
    return emp
  }, [refresh])

  const update = useCallback((id: string, data: Partial<Employee>) => {
    const emp = updateEmployee(id, data)
    refresh()
    return emp
  }, [refresh])

  const remove = useCallback((id: string) => {
    deleteEmployee(id)
    refresh()
  }, [refresh])

  return { employees, loading, refresh, add, update, remove }
}
