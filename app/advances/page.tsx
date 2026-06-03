'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AdvanceForm } from '@/components/advances/AdvanceForm'
import { AdvanceTable } from '@/components/advances/AdvanceTable'
import { useAdvances } from '@/hooks/useAdvances'
import { useEmployees } from '@/hooks/useEmployees'
import type { AdvanceRecord } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Plus, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

export default function AdvancesPage() {
  const { records, add, remove, markAdjusted } = useAdvances()
  const { employees } = useEmployees()

  const [formOpen, setFormOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [records, search, statusFilter])

  const totalPending = records.filter(r => r.status !== 'adjusted').reduce((s, r) => s + (r.amount - r.adjustedAmount), 0)

  const handleAdd = (data: { employeeId: string; amount: number; date: string; reason?: string; adjustMonth?: number; adjustYear?: number }) => {
    const emp = employees.find(e => e.id === data.employeeId)
    add({
      employeeId: data.employeeId,
      employeeName: emp?.name ?? 'Unknown',
      amount: data.amount,
      date: data.date,
      reason: data.reason,
      adjustMonth: data.adjustMonth,
      adjustYear: data.adjustYear,
      status: 'pending',
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Advance Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and manage employee advances</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />Add Advance
        </Button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
          <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Total Pending Advances</p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by employee name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          containerClassName="w-64"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="adjusted">Adjusted</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AdvanceTable
        records={filtered}
        onMarkAdjusted={id => { markAdjusted(id); toast.success('Marked as adjusted!') }}
        onDelete={id => setDeleteId(id)}
      />

      <AdvanceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employees={employees}
        onSubmit={handleAdd}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={open => { if (!open) setDeleteId(null) }}
        title="Delete Advance"
        description="Are you sure you want to delete this advance record?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) { remove(deleteId); toast.success('Advance deleted') }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
