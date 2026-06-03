'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MONTHS, YEARS } from '@/lib/utils'
import { FileDown, Sheet } from 'lucide-react'
import type { Employee } from '@/types'

interface ReportFiltersProps {
  month: number
  year: number
  branch: string
  employeeId: string
  branches: string[]
  employees: Employee[]
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
  onBranchChange: (b: string) => void
  onEmployeeChange: (id: string) => void
  onDownloadPDF: () => void
  onDownloadExcel: () => void
}

export function ReportFilters(props: ReportFiltersProps) {
  const { month, year, branch, employeeId, branches, employees, onMonthChange, onYearChange, onBranchChange, onEmployeeChange, onDownloadPDF, onDownloadExcel } = props

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="space-y-1">
        <Label className="text-xs">Month</Label>
        <Select value={String(month)} onValueChange={v => onMonthChange(Number(v))}>
          <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Year</Label>
        <Select value={String(year)} onValueChange={v => onYearChange(Number(v))}>
          <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Branch</Label>
        <Select value={branch} onValueChange={onBranchChange}>
          <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Employee</Label>
        <Select value={employeeId} onValueChange={onEmployeeChange}>
          <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 ml-auto">
        <Button variant="outline" size="sm" onClick={onDownloadExcel} className="gap-2">
          <Sheet className="h-3.5 w-3.5" />Excel
        </Button>
        <Button size="sm" onClick={onDownloadPDF} className="gap-2">
          <FileDown className="h-3.5 w-3.5" />PDF
        </Button>
      </div>
    </div>
  )
}
