'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { MONTHS, YEARS, formatCurrency } from '@/lib/utils'
import { RefreshCw, CalendarDays, Info } from 'lucide-react'

interface SalaryGeneratePanelProps {
  month: number
  year: number
  branch: string
  branches: string[]
  workingDays: number
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
  onBranchChange: (b: string) => void
  onWorkingDaysChange: (d: number) => void
  onGenerate: () => void
  loading?: boolean
  sampleSalary?: number
}

export function SalaryGeneratePanel({
  month, year, branch, branches, workingDays,
  onMonthChange, onYearChange, onBranchChange, onWorkingDaysChange,
  onGenerate, loading, sampleSalary,
}: SalaryGeneratePanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [localDays, setLocalDays] = useState(workingDays)

  const perDay = sampleSalary ? sampleSalary / localDays : 0

  const handleOpenConfirm = () => {
    setLocalDays(workingDays)
    setConfirmOpen(true)
  }

  const handleConfirm = () => {
    onWorkingDaysChange(localDays)
    setConfirmOpen(false)
    onGenerate()
  }

  return (
    <>
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

        {/* Working days badge */}
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 text-sm">
          <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-purple-700 dark:text-purple-300 font-medium">{workingDays} working days</span>
        </div>

        <Button onClick={handleOpenConfirm} disabled={loading} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Generate Salary
        </Button>
      </div>

      {/* Pre-generate confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              Confirm Salary Generation
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Period info */}
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-3">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {MONTHS[month - 1]} {year} — {branch === 'all' ? 'All Branches' : branch}
              </p>
              <p className="text-xs text-purple-500 dark:text-purple-400 mt-0.5">
                Advances assigned to this month will be auto-deducted
              </p>
            </div>

            {/* Working days input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                Working Days in this Period
                <span className="text-xs text-slate-400">(salary basis)</span>
              </Label>
              <div className="flex gap-2">
                {[26, 28, 30, 31].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setLocalDays(d)}
                    className={`flex-1 rounded-lg border py-1.5 text-sm font-medium transition-colors ${
                      localDays === d
                        ? 'border-purple-500 bg-purple-600 text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label className="text-xs text-slate-500 whitespace-nowrap">Custom:</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={localDays}
                  onChange={e => setLocalDays(Math.min(31, Math.max(1, Number(e.target.value))))}
                  className="h-8 w-20 text-sm"
                />
                <span className="text-xs text-slate-500">days</span>
              </div>
            </div>

            {/* Per-day salary preview */}
            {sampleSalary ? (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm">
                <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium">Per Day Salary (sample)</p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs">
                    {formatCurrency(sampleSalary)} ÷ {localDays} days = <strong>{formatCurrency(Math.round(perDay * 100) / 100)}/day</strong>
                  </p>
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                    1 absent day = <strong>{formatCurrency(Math.round(perDay * 100) / 100)}</strong> deducted
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
