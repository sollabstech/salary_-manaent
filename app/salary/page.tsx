'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { SalaryGeneratePanel } from '@/components/salary/SalaryGeneratePanel'
import { SalaryTable } from '@/components/salary/SalaryTable'
import { SalarySlipModal } from '@/components/salary/SalarySlipModal'
import { useEmployees } from '@/hooks/useEmployees'
import { useSalary } from '@/hooks/useSalary'
import { useAdvances } from '@/hooks/useAdvances'
import { useAttendance } from '@/hooks/useAttendance'
import { useSettings } from '@/hooks/useSettings'
import type { SalaryRecord } from '@/types'
import {
  getAttendanceSummary,
  calculateLeaveDeduction,
  calculateFinalSalary,
  getAdvanceForMonth,
} from '@/lib/salary-calculator'
import { generateId } from '@/lib/utils'
import { currentMonth, currentYear } from '@/utils/date-helpers'
import { generateSalarySlipPDF, generatePayrollReportPDF } from '@/lib/pdf-generator'
import { exportToExcel } from '@/utils/export-excel'
import { markAdvanceAdjusted } from '@/services/advanceService'
import { toast } from 'sonner'
import { Save, FileDown, Sheet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function SalaryPage() {
  const { employees, loading: empLoading } = useEmployees()
  const { records: salaryRecords, upsert, markPaid, forMonth } = useSalary()
  const { records: advances, refresh: refreshAdvances } = useAdvances()
  const { records: attendance } = useAttendance()
  const { settings } = useSettings()

  const [month, setMonth]           = useState(currentMonth())
  const [year, setYear]             = useState(currentYear())
  const [branch, setBranch]         = useState('all')
  const [workingDays, setWorkingDays] = useState(settings?.workingDaysPerMonth ?? 30)
  const [generated, setGenerated]   = useState<SalaryRecord[]>([])
  const [editValues, setEditValues] = useState<Record<string, Partial<SalaryRecord>>>({})
  const [slipRecord, setSlipRecord] = useState<SalaryRecord | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const branches = useMemo(
    () => [...new Set(employees.map(e => e.branch))].filter(Boolean),
    [employees]
  )

  // Sample salary for per-day preview in dialog
  const sampleSalary = useMemo(() => {
    const filtered = employees.filter(
      e => e.status === 'active' && (branch === 'all' || e.branch === branch)
    )
    return filtered[0]?.salary
  }, [employees, branch])

  // ─── Generate Salary ────────────────────────────────────────────────────────
  const handleGenerate = () => {
    setIsGenerating(true)

    const filtered = employees.filter(
      e => e.status === 'active' && (branch === 'all' || e.branch === branch)
    )

    const existing = forMonth(month, year)

    const newRecords: SalaryRecord[] = filtered.map(emp => {
      // If already generated/saved for this month, load that record
      const existingRecord = existing.find(r => r.employeeId === emp.id)
      if (existingRecord) return existingRecord

      // Attendance summary from attendance module
      const attSummary = getAttendanceSummary(
        attendance.filter(a => a.employeeId === emp.id),
        month,
        year
      )

      // Advance — ALL advances assigned to this month (auto-deduct)
      const advanceAmt = getAdvanceForMonth(advances, emp.id, month, year)

      // Calculations
      const lateAmt = attSummary.late * (settings?.lateDeductionAmount ?? 0)
      const leaveDeduction = calculateLeaveDeduction(
        emp.salary,
        attSummary.absent,
        attSummary.halfday,
        workingDays
      )
      const finalSalary = calculateFinalSalary({
        baseSalary: emp.salary,
        leaveDeduction,
        advanceDeduction: advanceAmt,
        bonus: 0,
        otherDeductions: 0,
        lateDeduction: lateAmt,
      })

      const now = new Date().toISOString()
      return {
        id: generateId(),
        employeeId: emp.id,
        employeeName: emp.name,
        month,
        year,
        branch: emp.branch,
        baseSalary: emp.salary,
        shiftDays: workingDays,
        presentDays: attSummary.present + attSummary.overtime,
        absentDays: attSummary.absent,
        halfDays: attSummary.halfday,
        leaveDays: attSummary.leave,
        overtimeDays: attSummary.overtime,
        lateDeduction: lateAmt,
        leaveDeduction,
        advanceDeduction: advanceAmt,
        bonus: 0,
        otherDeductions: 0,
        finalSalary,
        paid: false,
        remarks: '',
        createdAt: now,
        updatedAt: now,
      }
    })

    setGenerated(newRecords)
    setEditValues({})
    setIsGenerating(false)
    toast.success(`Generated salary for ${newRecords.length} employee${newRecords.length !== 1 ? 's' : ''}`)
  }

  // ─── Field Change (auto-recalc leave + net) ──────────────────────────────────
  const handleFieldChange = (
    id: string,
    field: keyof SalaryRecord,
    value: number,
    days: number
  ) => {
    setEditValues(prev => {
      const cur = prev[id] ?? {}
      const updated: Partial<SalaryRecord> = { ...cur, [field]: value }
      const record = generated.find(r => r.id === id)!

      const get = (f: keyof SalaryRecord) =>
        (f in updated ? updated[f] : record[f]) as number

      // Auto-recalculate leave deduction when absent/halfDays change
      if (field === 'absentDays' || field === 'halfDays') {
        const perDay = record.baseSalary / days
        updated.leaveDeduction = Math.round(
          perDay * (get('absentDays') + get('halfDays') * 0.5) * 100
        ) / 100
      }

      // Always recalculate final salary
      updated.finalSalary = Math.max(
        0,
        record.baseSalary
          - get('leaveDeduction')
          - get('advanceDeduction')
          - get('lateDeduction')
          - get('otherDeductions')
          + get('bonus')
      )

      return { ...prev, [id]: updated }
    })
  }

  // ─── Save All (+ auto-mark advances as adjusted) ─────────────────────────────
  const handleSaveAll = () => {
    generated.forEach(record => {
      const ev = editValues[record.id] ?? {}
      upsert({ ...record, ...ev })

      // Mark advances for this employee/month as adjusted
      advances
        .filter(
          a =>
            a.employeeId === record.employeeId &&
            a.adjustMonth === month &&
            a.adjustYear === year &&
            a.status !== 'adjusted'
        )
        .forEach(a => markAdvanceAdjusted(a.id))
    })

    refreshAdvances()
    toast.success('All salary records saved! Advances marked as adjusted.')
  }

  // ─── Downloads ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!settings) return
    try {
      const final = generated.map(r => ({ ...r, ...(editValues[r.id] ?? {}) }))
      await generatePayrollReportPDF(final, month, year, settings)
      toast.success('PDF downloaded!')
    } catch { toast.error('PDF generation failed') }
  }

  const handleExcel = async () => {
    const data = generated.map(r => {
      const ev = editValues[r.id] ?? {}
      return {
        'Employee':        r.employeeName,
        'Branch':          r.branch,
        'Base Salary':     r.baseSalary,
        'Working Days':    workingDays,
        'Present Days':    ev.presentDays      ?? r.presentDays,
        'Absent Days':     ev.absentDays       ?? r.absentDays,
        'Half Days':       ev.halfDays         ?? r.halfDays,
        'Leave Deduction': ev.leaveDeduction   ?? r.leaveDeduction,
        'Advance':         ev.advanceDeduction ?? r.advanceDeduction,
        'Bonus':           ev.bonus            ?? r.bonus,
        'Other Deductions':ev.otherDeductions  ?? r.otherDeductions,
        'Net Salary':      ev.finalSalary      ?? r.finalSalary,
        'Status':          r.paid ? 'Paid' : 'Pending',
      }
    })
    await exportToExcel(data, `payroll-${month}-${year}`, 'Payroll')
    toast.success('Excel exported!')
  }

  const slipEmployee = slipRecord
    ? employees.find(e => e.id === slipRecord.employeeId) ?? null
    : null

  if (empLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Salary Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Generate salaries — advances auto-deduct, edit attendance to update deductions
          </p>
        </div>
        {generated.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExcel} className="gap-2">
              <Sheet className="h-3.5 w-3.5" />Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <FileDown className="h-3.5 w-3.5" />PDF Report
            </Button>
            <Button size="sm" onClick={handleSaveAll} className="gap-2">
              <Save className="h-3.5 w-3.5" />Save All
            </Button>
          </div>
        )}
      </div>

      {/* Generate Panel */}
      <SalaryGeneratePanel
        month={month}
        year={year}
        branch={branch}
        branches={branches}
        workingDays={workingDays}
        sampleSalary={sampleSalary}
        onMonthChange={m => { setMonth(m); setGenerated([]) }}
        onYearChange={y => { setYear(y); setGenerated([]) }}
        onBranchChange={b => { setBranch(b); setGenerated([]) }}
        onWorkingDaysChange={setWorkingDays}
        onGenerate={handleGenerate}
        loading={isGenerating}
      />

      {/* Salary Table */}
      <SalaryTable
        records={generated}
        editValues={editValues}
        workingDays={workingDays}
        onFieldChange={handleFieldChange}
        onViewSlip={r => setSlipRecord(r)}
        onMarkPaid={id => {
          markPaid(id)
          setGenerated(g => g.map(r => r.id === id ? { ...r, paid: true } : r))
          toast.success('Marked as paid!')
        }}
        onDownloadSlip={async r => {
          const emp = employees.find(e => e.id === r.employeeId)
          if (emp && settings) {
            const ev = editValues[r.id] ?? {}
            await generateSalarySlipPDF({ ...r, ...ev }, emp, settings)
            toast.success('PDF downloaded!')
          }
        }}
      />

      {/* Salary Slip Modal */}
      <SalarySlipModal
        open={!!slipRecord}
        onOpenChange={open => { if (!open) setSlipRecord(null) }}
        record={slipRecord}
        employee={slipEmployee}
        settings={settings}
      />
    </div>
  )
}
