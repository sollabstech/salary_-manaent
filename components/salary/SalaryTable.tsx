'use client'

import { motion } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { SalaryRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, Eye, FileDown, FileText, Printer, CheckCircle, ChevronDown } from 'lucide-react'

interface SalaryTableProps {
  records: SalaryRecord[]
  editValues: Record<string, Partial<SalaryRecord>>
  workingDays: number
  onFieldChange: (id: string, field: keyof SalaryRecord, value: number, workingDays: number) => void
  onViewSlip: (record: SalaryRecord) => void
  onMarkPaid: (id: string) => void
  onDownloadSlip: (record: SalaryRecord, format: 'pdf' | 'thermal') => void
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

  const totalCash = records.reduce((s, r) => {
    const ev = editValues[r.id] ?? {}
    return s + ((ev.cashPayment ?? r.cashPayment) || 0)
  }, 0)

  const totalBank = records.reduce((s, r) => {
    const ev = editValues[r.id] ?? {}
    return s + ((ev.bankPayment ?? r.bankPayment) || 0)
  }, 0)

  const totalPaid = totalCash + totalBank

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
      {/* Info bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        <span className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          Salary basis: <strong>{workingDays} working days</strong>
        </span>
        <span className="text-blue-400">|</span>
        <span>Edit <strong>Absent / Half Days / Leaves</strong> → Net Salary auto-updates</span>
        <span className="text-blue-400">|</span>
        <span className="text-red-500 dark:text-red-400">
          <strong>Advance</strong> column = auto-filled from Advances module (editable)
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
              <TableHead className="text-teal-600">Leaves</TableHead>
              <TableHead className="text-red-600">Advance (−)</TableHead>
              <TableHead className="text-emerald-600">Bonus ⬆</TableHead>
              <TableHead className="text-slate-500">Other Ded.</TableHead>
              <TableHead className="text-purple-600 font-bold">Net Salary</TableHead>
              <TableHead className="text-emerald-600">Cash</TableHead>
              <TableHead className="text-blue-600">Bank</TableHead>
              <TableHead className="text-slate-600 font-bold">Pay Total</TableHead>
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
              const leaveDays        = get('leaveDays')
              const paidLeaveAllowed = record.paidLeaveAllowed ?? 0
              const extraLeaveDays   = Math.max(0, leaveDays - paidLeaveAllowed)
              const advanceDeduction = get('advanceDeduction')
              const lateDeduction   = get('lateDeduction')
              const bonus           = get('bonus')
              const otherDeductions = get('otherDeductions')
              const finalSalary   = ev.finalSalary ?? record.finalSalary
              const cashPayment   = get('cashPayment')
              const bankPayment   = get('bankPayment')
              const payTotal      = cashPayment + bankPayment

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
                    {advanceDeduction > 0 && (
                      <div className="mt-1.5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-2 py-1 text-[10px] leading-5 space-y-0.5">
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-500 dark:text-slate-400">Total Salary</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{formatCurrency(record.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between gap-3 text-red-600 dark:text-red-400">
                          <span>Advance Taken</span>
                          <span>− {formatCurrency(advanceDeduction)}</span>
                        </div>
                        <div className="flex justify-between gap-3 font-semibold text-purple-700 dark:text-purple-300 border-t border-red-200 dark:border-red-800 pt-0.5">
                          <span>Remaining</span>
                          <span>{formatCurrency(Math.max(0, finalSalary))}</span>
                        </div>
                      </div>
                    )}
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

                  {/* Leave Days — editable, shows paid/extra breakdown */}
                  <TableCell>
                    <div className="space-y-0.5">
                      {numInput(record.id, 'leaveDays', leaveDays, 'text-teal-700 dark:text-teal-300')}
                      <div className="text-[10px] text-center leading-tight">
                        <span className="text-slate-400">{paidLeaveAllowed} paid</span>
                        {extraLeaveDays > 0 && (
                          <span className="ml-1 font-semibold text-red-500">+{extraLeaveDays} extra</span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Advance — auto-filled but fully editable */}
                  <TableCell>
                    <div className="space-y-1">
                      <div className={`flex items-center rounded-lg border px-2 py-1 gap-1 ${
                        advanceDeduction > 0
                          ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={advanceDeduction}
                          onChange={e => onFieldChange(record.id, 'advanceDeduction', Number(e.target.value), workingDays)}
                          className="w-16 bg-transparent text-xs font-semibold text-red-600 dark:text-red-400 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-center text-red-400">
                        {advanceDeduction > 0 ? '− deducted' : 'enter amt'}
                      </p>
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

                  {/* Cash Payment */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 px-2 py-1 gap-1">
                        <span className="text-xs text-emerald-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={cashPayment}
                          onChange={e => onFieldChange(record.id, 'cashPayment', Number(e.target.value), workingDays)}
                          className="w-16 bg-transparent text-xs font-semibold text-emerald-700 dark:text-emerald-300 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-center text-slate-400">cash</p>
                    </div>
                  </TableCell>

                  {/* Bank Payment */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="flex items-center rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 gap-1">
                        <span className="text-xs text-blue-500">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={bankPayment}
                          onChange={e => onFieldChange(record.id, 'bankPayment', Number(e.target.value), workingDays)}
                          className="w-16 bg-transparent text-xs font-semibold text-blue-700 dark:text-blue-300 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-center text-slate-400">bank</p>
                    </div>
                  </TableCell>

                  {/* Pay Total */}
                  <TableCell>
                    <div className="space-y-0.5">
                      <span className={`font-bold text-sm whitespace-nowrap ${
                        payTotal > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                      }`}>
                        {formatCurrency(payTotal)}
                      </span>
                      {payTotal > 0 && payTotal !== finalSalary && (
                        <p className={`text-[10px] ${payTotal > finalSalary ? 'text-red-500' : 'text-amber-500'}`}>
                          {payTotal > finalSalary ? `+${formatCurrency(payTotal - finalSalary)} over` : `${formatCurrency(finalSalary - payTotal)} left`}
                        </p>
                      )}
                      {payTotal > 0 && payTotal === finalSalary && (
                        <p className="text-[10px] text-emerald-500">✓ full</p>
                      )}
                    </div>
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

                      {/* Download dropdown */}
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="z-50 min-w-[170px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1 text-sm"
                            sideOffset={4}
                            align="end"
                          >
                            <DropdownMenu.Item
                              className="flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                              onSelect={() => onDownloadSlip(record, 'pdf')}
                            >
                              <FileText className="h-3.5 w-3.5 text-purple-600" />
                              Standard PDF
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                              className="flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                              onSelect={() => onDownloadSlip(record, 'thermal')}
                            >
                              <Printer className="h-3.5 w-3.5 text-blue-600" />
                              3-inch Thermal
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>

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

      {/* Totals row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-1 flex justify-between items-center rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Net Salary</span>
          <span className="text-base font-bold text-purple-700 dark:text-purple-300">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between items-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Cash</span>
          <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalCash)}</span>
        </div>
        <div className="flex justify-between items-center rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Bank</span>
          <span className="text-base font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalBank)}</span>
        </div>
        <div className="flex justify-between items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-4 py-3">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Pay Total</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200">{formatCurrency(totalPaid)}</span>
        </div>
      </div>
    </div>
  )
}
