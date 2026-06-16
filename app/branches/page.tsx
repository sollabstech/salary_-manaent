'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Plus, Edit2, Trash2, Phone, Building2,
  Users, Check, X, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useBranches } from '@/hooks/useBranches'
import { useEmployees } from '@/hooks/useEmployees'
import type { Branch } from '@/types'
import { toast } from 'sonner'

// ── Branch Form Dialog ─────────────────────────────────────────────────────────
function BranchDialog({
  open, onOpenChange, branch, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  branch?: Branch | null
  onSave: (name: string, address: string, phone: string) => void
}) {
  const isEdit = !!branch
  const [name,    setName]    = useState(branch?.name    ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [phone,   setPhone]   = useState(branch?.phone   ?? '')

  // Sync when branch prop changes (edit vs add)
  const reset = () => { setName(branch?.name ?? ''); setAddress(branch?.address ?? ''); setPhone(branch?.phone ?? '') }

  const handleSave = () => {
    if (!name.trim()) { toast.error('Branch name is required'); return }
    onSave(name.trim(), address.trim(), phone.trim())
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            {isEdit ? 'Edit Branch' : 'Add New Branch'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Branch Name *</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. KK Nagar, Cinema Branch"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Address <span className="text-slate-400">(optional)</span></label>
            <Input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 45 Main Street, Chennai"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Phone <span className="text-slate-400">(optional)</span></label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 98765 43210"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-1" />Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Check className="h-4 w-4" />{isEdit ? 'Save Changes' : 'Add Branch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function BranchesPage() {
  const { branches, add, update, remove } = useBranches()
  const { employees } = useEmployees()

  const [search,    setSearch]    = useState('')
  const [addOpen,   setAddOpen]   = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [deleteId,  setDeleteId]  = useState<string | null>(null)

  // Employee counts per branch
  const empCountMap = useMemo(() => {
    const map: Record<string, { total: number; active: number }> = {}
    employees.forEach(e => {
      if (!map[e.branch]) map[e.branch] = { total: 0, active: 0 }
      map[e.branch].total++
      if (e.status === 'active') map[e.branch].active++
    })
    return map
  }, [employees])

  const filtered = useMemo(() =>
    branches.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [branches, search]
  )

  const deleteTarget = branches.find(b => b.id === deleteId)
  const deleteEmpCount = deleteTarget ? (empCountMap[deleteTarget.name]?.total ?? 0) : 0

  const handleAdd = (name: string, address: string, phone: string) => {
    try {
      add({ name, address: address || undefined, phone: phone || undefined })
      toast.success(`Branch "${name}" added!`)
      setAddOpen(false)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add branch')
    }
  }

  const handleEdit = (name: string, address: string, phone: string) => {
    if (!editBranch) return
    update(editBranch.id, { name, address: address || undefined, phone: phone || undefined })
    toast.success('Branch updated!')
    setEditBranch(null)
  }

  const handleDelete = () => {
    if (!deleteId) return
    remove(deleteId)
    toast.success('Branch removed.')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Branch Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage all your shop branches and locations
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />Add Branch
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Branches</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{branches.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {employees.length}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Employees</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {employees.filter(e => e.status === 'active').length}
          </p>
        </div>
      </div>

      {/* Search */}
      {branches.length > 0 && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search branches…"
            className="pl-9"
          />
        </div>
      )}

      {/* Branch Cards */}
      {branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30 mb-3">
            <MapPin className="h-7 w-7 text-purple-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No branches yet</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Add your first branch to get started</p>
          <Button onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add First Branch
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">No branches match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((branch, i) => {
              const counts = empCountMap[branch.name] ?? { total: 0, active: 0 }
              return (
                <motion.div
                  key={branch.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all"
                >
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
                      <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                        {branch.name}
                      </h3>
                      {branch.address && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" />{branch.address}
                        </p>
                      )}
                      {branch.phone && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3 shrink-0" />{branch.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Employee count */}
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {counts.total} Employee{counts.total !== 1 ? 's' : ''}
                    </span>
                    {counts.total > 0 && (
                      <Badge variant={counts.active > 0 ? 'success' : 'secondary'} className="ml-auto text-[10px]">
                        {counts.active} active
                      </Badge>
                    )}
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-blue-500 hover:text-blue-700 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                      onClick={() => setEditBranch(branch)}
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700"
                      onClick={() => setDeleteId(branch.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Dialog */}
      <BranchDialog open={addOpen} onOpenChange={setAddOpen} onSave={handleAdd} />

      {/* Edit Dialog */}
      {editBranch && (
        <BranchDialog
          open={!!editBranch}
          onOpenChange={v => { if (!v) setEditBranch(null) }}
          branch={editBranch}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Remove Branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to remove <strong className="text-slate-900 dark:text-slate-100">{deleteTarget?.name}</strong>?
              </p>
              {deleteEmpCount > 0 && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  ⚠ <strong>{deleteEmpCount} employee{deleteEmpCount !== 1 ? 's' : ''}</strong> are assigned to this branch.
                  They will keep their branch label but it will no longer appear in the branch list.
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
