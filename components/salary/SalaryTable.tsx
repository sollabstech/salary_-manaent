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
  onFieldChange: (id: string, field: keyof SalaryRecord, value: number) => void
  onViewSlip: (record: SalaryRecord) => void
  onMarkPaid: (id: string) => void
  onDownloadSlip: (record: SalaryRecord) => void
}

export function SalaryTable({ records, editValues, onFieldChange, onViewSlip, onMarkPaid, onDownloadSlip }: SalaryTableProps) {
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

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-800/50">
              <TableHead>Employee</TableHead>
              <TableHead>Base Salary</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Leave Ded.</TableHead>
              <TableHead>Advance</TableHead>
              <TableHead>Bonus</TableHead>
              <TableHead>Other Ded.</TableHead>
              <TableHead className="text-purple-600 dark:text-purple-400 font-bold">Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record, i) => {
              const ev = editValues[record.id] ?? {}
              const get = (field: keyof SalaryRecord) => (ev[field] ?? record[field]) as number

              const finalSalary = record.baseSalary
                - get('leaveDeduction')
                - get('advanceDeduction')
                - get('lateDeduction')
                - get('otherDeductions')
                + get('bonus')

              return (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <TableCell>
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{record.employeeName}</p>
                    <p className="text-xs text-slate-500">{record.branch}</p>
                  </TableCell>
                  <TableCell className="text-sm">{formatCurrency(record.baseSalary)}</TableCell>
                  <TableCell className="text-sm text-emerald-600">{record.presentDays}</TableCell>
                  <TableCell className="text-sm text-red-500">{record.absentDays}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-7 w-24 text-xs"
                      value={get('leaveDeduction')}
                      onChange={e => onFieldChange(record.id, 'leaveDeduction', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-7 w-24 text-xs"
                      value={get('advanceDeduction')}
                      onChange={e => onFieldChange(record.id, 'advanceDeduction', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-7 w-24 text-xs"
                      value={get('bonus')}
                      onChange={e => onFieldChange(record.id, 'bonus', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="h-7 w-24 text-xs"
                      value={get('otherDeductions')}
                      onChange={e => onFieldChange(record.id, 'otherDeductions', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="font-bold text-purple-700 dark:text-purple-300 text-sm">
                      {formatCurrency(Math.max(0, finalSalary))}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={record.paid ? 'success' : 'warning'}>
                      {record.paid ? 'Paid' : 'Pending'}
                    </Badge>
                  </TableCell>
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

      <div className="flex justify-between items-center rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Net Salary</span>
        <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
