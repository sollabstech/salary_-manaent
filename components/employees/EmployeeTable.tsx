'use client'

import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { Employee } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Eye, Pencil, Trash2, Users } from 'lucide-react'

interface EmployeeTableProps {
  employees: Employee[]
  onView: (emp: Employee) => void
  onEdit: (emp: Employee) => void
  onDelete: (emp: Employee) => void
}

export function EmployeeTable({ employees, onView, onEdit, onDelete }: EmployeeTableProps) {
  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No employees found"
        description="Add your first employee to get started with payroll management."
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead>Employee</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead>Shift Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((emp, i) => {
            const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <motion.tr
                key={emp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <TableCell>
                  <button onClick={() => onView(emp)} className="flex items-center gap-3 hover:underline text-left">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={emp.imageBase64} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{emp.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{emp.employeeId}</p>
                    </div>
                  </button>
                </TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">{emp.mobile}</TableCell>
                <TableCell className="text-sm text-slate-600 dark:text-slate-300">{emp.branch}</TableCell>
                <TableCell className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(emp.salary)}
                </TableCell>
                <TableCell>
                  <Badge variant={emp.shiftType === 'night' ? 'info' : emp.shiftType === 'evening' ? 'warning' : 'secondary'}>
                    {emp.shiftType === 'day' ? '🌤️ Day' : emp.shiftType === 'night' ? '🌙 Night' : emp.shiftType === 'morning' ? '🌅 Morning' : '🌆 Evening'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={emp.status === 'active' ? 'success' : 'secondary'}>
                    {emp.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView(emp)} className="h-7 w-7 text-slate-400 hover:text-purple-600">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(emp)} className="h-7 w-7 text-slate-400 hover:text-blue-600">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(emp)} className="h-7 w-7 text-slate-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
