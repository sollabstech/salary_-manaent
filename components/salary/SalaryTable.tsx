'use client'

import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { SalaryRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, Eye, FileDown, CheckCircle } from 'lucide-react'

interface SalaryTableProps {
  records: SalaryRecord[]
  editValues: Record<string, Partial<SalaryRecord>>
  workingDays: number
  onFieldChange: (id: string, field: keyof SalaryRecord, value: number, workingDays: number) => void
  onViewSlip: (record: SalaryRecord) => void
  onMarkPaid: (id: string) => void
  onDownloadSlip: (record: SalaryRecord) => void
}

export function SalaryTable({
  records, editValues, workingDays,
  onFieldChange, onViewSlip, onMarkPaid, onDownloadSlip
}: SalaryTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="No salary records"
        description="Select month, year and branch then click Generate Salary."
      />
    )
  }

  const total = records.reduce((s, r) => {
    const ev = editValues[r.id] ?? {}
    return s + (ev.finalSalary ?? r.finalSalary)
  }, 0)

  const numInput = (
    id: string,
    field: keyof SalaryRecord,
    value: number,
    color?: string
  ) => (
    <Input
      type="number"
      min={0}
      className={`h-7 w-20 text-xs text-center ${color ?? ''}`}
      value={value}
      onChange={e => onFieldChange(id, field, Number(e.target.value), workingDays)}
    />
  )

  return (
    <div className="space-y-3">
      {/* Working days info bar */}
      <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        <DollarSign className="h-3.5 w-3.5" />
        <span>
          Salary basis: <strong>{workingDays} working days</strong> —
          editing <strong>Absent</strong> or <strong>Half Days</strong> auto-updates Leave Deduction &amp; Net Salary
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Employee</TableHead>
              <TableHead>Base</TableHead>
              <TableHead className="text-emerald-600">Present</TableHead>
              <TableHead className="text-red-500">Absent</TableHead>
              <TableHead className="text-amber-500">Half Days</TableHead>
              <TableHead className="text-orange-500">Leave Ded.</TableHead>
              <TableHead className="text-red-600">Advance ⬇</TableHead>
              <TableHead className="text-emerald-600">Bonus ⬆</TableHead>
              <TableHead className="text-slate-500">Other Ded.</TableHead>
              <TableHead className="text-purple-600 font-bold">Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, i) => {
              const ev = editValues[record.id] ?? {}
              const get = (field: keyof SalaryRecord) =>
                (field in ev ? ev[field] : record[field]) as number

              const absentDays  = get('absentDays')
              const halfDays    = get('halfDays')
              const presentDays = get('presentDays')
              const leaveDeduction  = get('leaveDeduction')
              const advanceDeduction = get('advanceDeduction')
              const lateDeduction   = get('lateDeduction')
              const bonus           = get('bonus')
              const otherDeductions = get('otherDeductions')
              const finalSalary = ev.finalSalary ?? record.finalSalary

              return (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  {/* Employee */}
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{record.employeeName}</p>
                    <p className="text-xs text-slate-500">{record.branch}</p>
                  </TableCell>

                  {/* Base Salary */}
                  <TableCell className="text-sm font-medium">{formatCurrency(record.baseSalary)}</TableCell>

                  {/* Present Days — editable */}
                  <TableCell>
                    {numInput(record.id, 'presentDays', presentDays)}
                  </TableCell>

                  {/* Absent Days — editable, triggers leave deduction recalc */}
                  <TableCell>
                    {numInput(record.id, 'absentDays', absentDays)}
                  </TableCell>

                  {/* Half Days — editable, triggers leave deduction recalc */}
                  <TableCell>
                    {numInput(record.id, 'halfDays', halfDays)}
                  </TableCell>

                  {/* Leave Deduction — auto-calculated but editable override */}
                  <TableCell>
                    <div className="space-y-0.5">
                      {numInput(record.id, 'leaveDeduction', leaveDeduction)}
                      <p className="text-[10px] text-slate-400 text-center">auto</p>
                    </div>
                  </TableCell>

                  {/* Advance — auto-filled from advance module */}
                  <TableCell>
                    <div className="space-y-0.5">
                      {numInput(record.id, 'advanceDeduction', advanceDeduction)}
                      {advanceDeduction > 0 && (
                        <p className="text-[10px] text-red-400 text-center">advance</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Bonus */}
                  <TableCell>
                    {numInput(record.id, 'bonus', bonus)}
                  </TableCell>

                  {/* Other Deductions */}
                  <TableCell>
                    {numInput(record.id, 'otherDeductions', otherDeductions)}
                  </TableCell>

                  {/* Net Salary */}
                  <TableCell>
                    <span className="font-bold text-purple-700 dark:text-purple-300 text-sm whitespace-nowrap">
                      {formatCurrency(Math.max(0, finalSalary))}
                    </span>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <Badge variant={record.paid ? 'success' : 'warning'}>
                      {record.paid ? 'Paid' : 'Pending'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewSlip(record)} title="View Slip">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDownloadSlip(record)} title="Download PDF">
                        <FileDown className="h-3.5 w-3.5" />
                      </Button>
                      {!record.paid && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => onMarkPaid(record.id)} title="Mark Paid">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Net Salary</span>
        <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
