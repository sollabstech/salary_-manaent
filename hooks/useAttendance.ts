'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AttendanceRecord, AttendanceStatus } from '@/types'
import {
  getAttendanceRecords,
  getAttendanceForDate,
  getAttendanceForMonth,
  markAttendance,
  markBulkAttendance,
} from '@/services/attendanceService'

export function useAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setRecords(getAttendanceRecords())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const markOne = useCallback((employeeId: string, date: string, status: AttendanceStatus, note?: string) => {
    markAttendance(employeeId, date, status, note)
    refresh()
  }, [refresh])

  const markBulk = useCallback((entries: { employeeId: string; date: string; status: AttendanceStatus }[]) => {
    markBulkAttendance(entries)
    refresh()
  }, [refresh])

  const forDate = useCallback((date: string) => getAttendanceForDate(date), [])
  const forMonth = useCallback((month: number, year: number) => getAttendanceForMonth(month, year), [])

  return { records, loading, refresh, markOne, markBulk, forDate, forMonth }
}
