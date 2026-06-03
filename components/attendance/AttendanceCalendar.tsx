'use client'

import { useMemo } from 'react'
import type { AttendanceRecord, AttendanceStatus, Employee } from '@/types'
import { getMonthDates } from '@/utils/date-helpers'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500',
  absent: 'bg-red-500',
  halfday: 'bg-amber-400',
  late: 'bg-orange-400',
  overtime: 'bg-blue-500',
  leave: 'bg-slate-400',
}

interface AttendanceCalendarProps {
  employee: Employee
  records: AttendanceRecord[]
  month: number
  year: number
}

export function AttendanceCalendar({ employee, records, month, year }: AttendanceCalendarProps) {
  const dates = getMonthDates(month, year)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const statusMap = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {}
    records.filter(r => r.employeeId === employee.id).forEach(r => { map[r.date] = r.status })
    return map
  }, [records, employee.id])

  const summary = useMemo(() => {
    const vals = Object.values(statusMap)
    return {
      present: vals.filter(s => s === 'present' || s === 'overtime').length,
      absent: vals.filter(s => s === 'absent').length,
      halfday: vals.filter(s => s === 'halfday').length,
      late: vals.filter(s => s === 'late').length,
    }
  }, [statusMap])

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="bg-purple-600 px-4 py-3">
        <h3 className="font-semibold text-white text-sm">{employee.name}</h3>
        <div className="flex gap-3 mt-1 text-xs text-purple-200">
          <span>P: {summary.present}</span>
          <span>A: {summary.absent}</span>
          <span>H: {summary.halfday}</span>
          <span>L: {summary.late}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-500 dark:text-slate-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {dates.map(date => {
            const day = new Date(date).getDate()
            const status = statusMap[date]
            return (
              <div
                key={date}
                title={status ?? 'not marked'}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium mx-auto',
                  status ? STATUS_COLOR[status] + ' text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {Object.entries(STATUS_COLOR).map(([s, color]) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn('h-2.5 w-2.5 rounded-full', color)} />
              <span className="text-[10px] text-slate-500 capitalize">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
