'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import type { Employee, AttendanceStatus } from '@/types'
import { CalendarCheck } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'halfday', label: 'Half Day' },
  { value: 'late', label: 'Late' },
  { value: 'overtime', label: 'Overtime' },
  { value: 'leave', label: 'Leave' },
]

const STATUS_BADGE: Record<AttendanceStatus, 'success' | 'destructive' | 'warning' | 'info' | 'secondary' | 'default'> = {
  present: 'success',
  absent: 'destructive',
  halfday: 'warning',
  late: 'warning',
  overtime: 'info',
  leave: 'secondary',
}

interface AttendanceTableProps {
  employees: Employee[]
  attendance: Record<string, AttendanceStatus>
  onStatusChange: (empId: string, status: AttendanceStatus) => void
  onSaveAll: () => void
  date: string
}

export function AttendanceTable({ employees, attendance, onStatusChange, onSaveAll, date }: AttendanceTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No employees to mark attendance"
        description="Add employees first to mark attendance."
      />
    )
  }

  const summary = Object.values(attendance)
  const present = summary.filter(s => s === 'present' || s === 'overtime').length
  const absent = summary.filter(s => s === 'absent').length

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Date: {date}</span>
        <span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1">Present: {present}</span>
        <span className="text-xs rounded-full bg-red-100 text-red-700 px-2.5 py-1">Absent: {absent}</span>
        <span className="text-xs rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2.5 py-1">Total: {employees.length}</span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Employee</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Attendance Status</TableHead>
              <TableHead>Current</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp, i) => {
              const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              const status = attendance[emp.id]
              return (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={emp.imageBase64} />
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.employeeId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">{emp.branch}</TableCell>
                  <TableCell>
                    <Select value={status ?? 'present'} onValueChange={(v) => onStatusChange(emp.id, v as AttendanceStatus)}>
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {status && (
                      <Badge variant={STATUS_BADGE[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                    )}
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { onSaveAll(); toast.success('Attendance saved!') }}>
          Save Attendance
        </Button>
      </div>
    </div>
  )
}
