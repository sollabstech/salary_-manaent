'use client'

import { motion } from 'framer-motion'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type { AdvanceRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { formatDisplayDate, formatMonthYear } from '@/utils/date-helpers'
import { CreditCard, CheckCircle, Trash2 } from 'lucide-react'

interface AdvanceTableProps {
  records: AdvanceRecord[]
  onMarkAdjusted: (id: string) => void
  onDelete: (id: string) => void
}

const STATUS_BADGE = {
  pending: 'warning' as const,
  adjusted: 'success' as const,
  partial: 'info' as const,
}

export function AdvanceTable({ records, onMarkAdjusted, onDelete }: AdvanceTableProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No advance records"
        description="Add advance amounts to track them against employee salaries."
      />
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead>Employee</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Adjust Month</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pending</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((rec, i) => (
            <motion.tr
              key={rec.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border-b border-slate-100 dark:border-slate-800"
            >
              <TableCell>
                <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{rec.employeeName}</p>
              </TableCell>
              <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                {formatCurrency(rec.amount)}
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-300">{formatDisplayDate(rec.date)}</TableCell>
              <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                {rec.reason ?? '—'}
              </TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                {rec.adjustMonth && rec.adjustYear ? formatMonthYear(rec.adjustMonth, rec.adjustYear) : '—'}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[rec.status]}>{rec.status}</Badge>
              </TableCell>
              <TableCell className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(rec.amount - rec.adjustedAmount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {rec.status !== 'adjusted' && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => onMarkAdjusted(rec.id)} title="Mark Adjusted">
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => onDelete(rec.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
