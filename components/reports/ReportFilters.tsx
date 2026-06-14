'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MONTHS, YEARS } from '@/lib/utils'
import { FileDown, Sheet, CalendarRange, X } from 'lucide-react'
import type { Employee } from '@/types'

interface ReportFiltersProps {
  month: number
  year: number
  branch: string
  employeeId: string
  branches: string[]
  employees: Employee[]
  fromDate: string
  toDate: string
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
  onBranchChange: (b: string) => void
  onEmployeeChange: (id: string) => void
  onFromDateChange: (d: string) => void
  onToDateChange: (d: string) => void
  onClearDateRange: () => void
  onDownloadPDF: () => void
  onDownloadExcel: () => void
}

export function ReportFilters(props: ReportFiltersProps) {
  const {
    month, year, branch, employeeId, branches, employees,
    fromDate, toDate,
    onMonthChange, onYearChange, onBranchChange, onEmployeeChange,
    onFromDateChange, onToDateChange, onClearDateRange,
    onDownloadPDF, onDownloadExcel,
  } = props

  const hasDateRange = fromDate && toDate

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
      {/* Row 1 — Month/Year/Branch/Employee */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Month</Label>
          <Select value={String(month)} onValueChange={v => onMonthChange(Number(v))}>
            <SelectTrigger className={`w-32 h-8 text-sm ${hasDateRange ? 'opacity-40 pointer-events-none' : ''}`}><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Year</Label>
          <Select value={String(year)} onValueChange={v => onYearChange(Number(v))}>
            <SelectTrigger className={`w-24 h-8 text-sm ${hasDateRange ? 'opacity-40 pointer-events-none' : ''}`}><SelectValue /></SelectTrigger>
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

      {/* Row 2 — Date range */}
      <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <CalendarRange className="h-3.5 w-3.5" />
          Date Range
          {hasDateRange && (
            <span className="ml-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 text-[10px] font-semibold">
              active
            </span>
          )}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">From Date</Label>
          <input
            type="date"
            value={fromDate}
            onChange={e => onFromDateChange(e.target.value)}
            className="h-8 w-36 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To Date</Label>
          <input
            type="date"
            value={toDate}
            min={fromDate}
            onChange={e => onToDateChange(e.target.value)}
            className="h-8 w-36 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {hasDateRange && (
          <Button variant="outline" size="sm" onClick={onClearDateRange} className="gap-1.5 h-8 text-xs">
            <X className="h-3 w-3" />Clear Range
          </Button>
        )}
        {hasDateRange && (
          <span className="text-xs text-slate-400 self-end pb-1">
            Filtering by date range — Month/Year selectors are overridden
          </span>
        )}
      </div>
    </div>
  )
}
