'use client'

import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AttendanceTable } from '@/components/attendance/AttendanceTable'
import { AttendanceCalendar } from '@/components/attendance/AttendanceCalendar'
import { useEmployees } from '@/hooks/useEmployees'
import { useAttendance } from '@/hooks/useAttendance'
import type { AttendanceStatus } from '@/types'
import { MONTHS, YEARS } from '@/lib/utils'
import { todayISO, currentMonth, currentYear } from '@/utils/date-helpers'
import { SearchInput } from '@/components/ui/search-input'
import { Skeleton } from '@/components/ui/skeleton'

export default function AttendancePage() {
  const { employees, loading: empLoading } = useEmployees()
  const { records, markBulk } = useAttendance()

  const [date, setDate] = useState(todayISO())
  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(currentYear())
  const [search, setSearch] = useState('')
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({})

  const activeEmployees = employees.filter(e => e.status === 'active')

  // Load existing attendance for selected date
  useEffect(() => {
    const existing: Record<string, AttendanceStatus> = {}
    records.filter(r => r.date === date).forEach(r => { existing[r.employeeId] = r.status })
    // Default all active employees to 'present' if not marked
    activeEmployees.forEach(e => {
      if (!existing[e.id]) existing[e.id] = 'present'
    })
    setLocalAttendance(existing)
  }, [date, records.length])

  const handleStatusChange = (empId: string, status: AttendanceStatus) => {
    setLocalAttendance(prev => ({ ...prev, [empId]: status }))
  }

  const handleSaveAll = () => {
    const entries = Object.entries(localAttendance).map(([empId, status]) => ({
      employeeId: empId,
      date,
      status,
    }))
    markBulk(entries)
  }

  const filteredEmployees = useMemo(() =>
    activeEmployees.filter(e =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase())
    ),
    [activeEmployees, search]
  )

  if (empLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Attendance</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Mark daily attendance and view monthly summaries</p>
      </div>

      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Attendance</TabsTrigger>
          <TabsTrigger value="calendar">Monthly Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <SearchInput
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              containerClassName="w-56"
            />
          </div>
          <AttendanceTable
            employees={filteredEmployees}
            attendance={localAttendance}
            onStatusChange={handleStatusChange}
            onSaveAll={handleSaveAll}
            date={date}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Month</Label>
              <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Year</Label>
              <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeEmployees.map(emp => (
              <AttendanceCalendar
                key={emp.id}
                employee={emp}
                records={records}
                month={month}
                year={year}
              />
            ))}
          </div>
          {activeEmployees.length === 0 && (
            <p className="text-center text-slate-400 py-8">No active employees found.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
