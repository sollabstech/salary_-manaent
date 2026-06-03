'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Pagination } from '@/components/ui/pagination'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import { EmployeeDetailModal } from '@/components/employees/EmployeeDetailModal'
import { useEmployees } from '@/hooks/useEmployees'
import type { Employee } from '@/types'
import { UserPlus, Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportToExcel } from '@/utils/export-excel'

const PAGE_SIZE = 10

export default function EmployeesPage() {
  const { employees, loading, add, update, remove } = useEmployees()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)

  const branches = useMemo(() => [...new Set(employees.map(e => e.branch))].filter(Boolean), [employees])

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        e.mobile.includes(search)
      const matchBranch = branchFilter === 'all' || e.branch === branchFilter
      const matchStatus = statusFilter === 'all' || e.status === statusFilter
      return matchSearch && matchBranch && matchStatus
    })
  }, [employees, search, branchFilter, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleAdd = (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editEmployee) {
      update(editEmployee.id, data)
    } else {
      add(data)
    }
    setEditEmployee(null)
  }

  const handleExcel = async () => {
    const data = filtered.map(e => ({
      'Employee ID': e.employeeId,
      'Name': e.name,
      'Mobile': e.mobile,
      'Branch': e.branch,
      'Salary': e.salary,
      'Salary Type': e.salaryType,
      'Shift Type': e.shiftType,
      'Aadhar Card': e.aadharCard ?? '',
      'Paid Leave': e.paidLeave,
      'Status': e.status,
      'Joining Date': e.joiningDate,
    }))
    await exportToExcel(data, 'employee-report', 'Employees')
    toast.success('Excel exported!')
  }

  if (loading) {
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Employees</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{employees.length} total · {employees.filter(e => e.status === 'active').length} active</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExcel} className="gap-2">
            <Download className="h-3.5 w-3.5" />Export
          </Button>
          <Button onClick={() => { setEditEmployee(null); setFormOpen(true) }} className="gap-2">
            <UserPlus className="h-4 w-4" />Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <SearchInput
          placeholder="Search by name, ID, mobile..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          containerClassName="w-64"
        />
        <Select value={branchFilter} onValueChange={v => { setBranchFilter(v); setPage(1) }}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All Branches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <EmployeeTable
        employees={paginated}
        onView={e => setViewEmployee(e)}
        onEdit={e => { setEditEmployee(e); setFormOpen(true) }}
        onDelete={e => setDeleteTarget(e)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />

      <EmployeeForm
        open={formOpen}
        onOpenChange={open => { setFormOpen(open); if (!open) setEditEmployee(null) }}
        employee={editEmployee}
        employeeCount={employees.length}
        onSubmit={handleAdd}
      />

      <EmployeeDetailModal
        open={!!viewEmployee}
        onOpenChange={open => { if (!open) setViewEmployee(null) }}
        employee={viewEmployee}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        title="Delete Employee"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) { remove(deleteTarget.id); toast.success('Employee deleted') }
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
