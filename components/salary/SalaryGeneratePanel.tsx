'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { MONTHS, YEARS } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

interface SalaryGeneratePanelProps {
  month: number
  year: number
  branch: string
  branches: string[]
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
  onBranchChange: (b: string) => void
  onGenerate: () => void
  loading?: boolean
}

export function SalaryGeneratePanel({
  month, year, branch, branches, onMonthChange, onYearChange, onBranchChange, onGenerate, loading
}: SalaryGeneratePanelProps) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
      <div className="space-y-1">
        <Label>Month</Label>
        <Select value={String(month)} onValueChange={v => onMonthChange(Number(v))}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => (
              <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Year</Label>
        <Select value={String(year)} onValueChange={v => onYearChange(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Branch</Label>
        <Select value={branch} onValueChange={onBranchChange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onGenerate} disabled={loading} className="flex items-center gap-2">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Generate Salary
      </Button>
    </div>
  )
}
