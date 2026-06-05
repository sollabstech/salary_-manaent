'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { useEmployees } from '@/hooks/useEmployees'
import { useSalary } from '@/hooks/useSalary'
import { useAttendance } from '@/hooks/useAttendance'
import { useAdvances } from '@/hooks/useAdvances'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate, MONTHS } from '@/lib/utils'
import { formatDisplayDate, formatMonthYear, currentMonth, currentYear } from '@/utils/date-helpers'
import { exportToExcel } from '@/utils/export-excel'
import { generatePayrollReportPDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'
import {
  Users, DollarSign, TrendingDown, Gift,
  RefreshCw, ArrowRight, CheckCircle, Clock,
  CalendarCheck, CreditCard
} from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const { employees, refresh: refreshEmp } = useEmployees()
  const { records: salaryRecords, refresh: refreshSalary } = useSalary()
  const { records: attendance, refresh: refreshAtt } = useAttendance()
  const { records: advances, refresh: refreshAdv } = useAdvances()
  const { settings } = useSettings()

  const [month, setMonth]           = useState(currentMonth())
  const [year, setYear]             = useState(currentYear())
  const [branch, setBranch]         = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const [activeTab, setActiveTab]   = useState('salary')

  const branches = useMemo(() => [...new Set(employees.map(e => e.branch))].filter(Boolean), [employees])

  // Refresh all data from localStorage on tab focus
  const refreshAll = useCallback(() => {
    refreshEmp(); refreshSalary(); refreshAtt(); refreshAdv()
    toast.success('Reports refreshed!')
  }, [refreshEmp, refreshSalary, refreshAtt, refreshAdv])

  useEffect(() => {
    const onFocus = () => { refreshSalary(); refreshEmp(); refreshAtt(); refreshAdv() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshSalary, refreshEmp, refreshAtt, refreshAdv])

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredEmployees = useMemo(() =>
    employees.filter(e =>
      (branch === 'all' || e.branch === branch) &&
      (employeeId === 'all' || e.id === employeeId)
    ), [employees, branch, employeeId])

  const filteredSalary = useMemo(() =>
    salaryRecords.filter(r =>
      r.month === month && r.year === year &&
      (branch === 'all' || r.branch === branch) &&
      (employeeId === 'all' || r.employeeId === employeeId)
    ), [salaryRecords, month, year, branch, employeeId])

  const filteredAttendance = useMemo(() => {
    const empIds = new Set(filteredEmployees.map(e => e.id))
    return attendance.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() + 1 === month && d.getFullYear() === year && empIds.has(r.employeeId)
    })
  }, [attendance, filteredEmployees, month, year])

  const filteredAdvances = useMemo(() =>
    advances.filter(r =>
      (employeeId === 'all' || r.employeeId === employeeId) &&
      (branch === 'all' || employees.find(e => e.id === r.employeeId)?.branch === branch)
    ), [advances, employeeId, branch, employees])

  // ── Summary stats for Salary Report ─────────────────────────────────────────
  const salaryStats = useMemo(() => ({
    total:      filteredSalary.reduce((s, r) => s + r.finalSalary, 0),
    paid:       filteredSalary.filter(r => r.paid).reduce((s, r) => s + r.finalSalary, 0),
    pending:    filteredSalary.filter(r => !r.paid).reduce((s, r) => s + r.finalSalary, 0),
    paidCount:  filteredSalary.filter(r => r.paid).length,
    totalCount: filteredSalary.length,
    advance:    filteredSalary.reduce((s, r) => s + r.advanceDeduction, 0),
    bonus:      filteredSalary.reduce((s, r) => s + r.bonus, 0),
  }), [filteredSalary])

  // ── Attendance summary ───────────────────────────────────────────────────────
  const attStats = useMemo(() => ({
    present:  filteredAttendance.filter(r => r.status === 'present').length,
    absent:   filteredAttendance.filter(r => r.status === 'absent').length,
    halfday:  filteredAttendance.filter(r => r.status === 'halfday').length,
    late:     filteredAttendance.filter(r => r.status === 'late').length,
    overtime: filteredAttendance.filter(r => r.status === 'overtime').length,
    leave:    filteredAttendance.filter(r => r.status === 'leave').length,
  }), [filteredAttendance])

  // ── Downloads ────────────────────────────────────────────────────────────────
  const handleDownloadExcel = async (type: string) => {
    try {
      switch (type) {
        case 'employees':
          await exportToExcel(filteredEmployees.map(e => ({
            'ID': e.employeeId, 'Name': e.name, 'Mobile': e.mobile,
            'Branch': e.branch, 'Salary': e.salary, 'Shift Type': e.shiftType,
            'Status': e.status, 'Joining Date': e.joiningDate,
          })), 'employee-report', 'Employees')
          break
        case 'salary':
          await exportToExcel(filteredSalary.map(r => ({
            'Employee': r.employeeName, 'Branch': r.branch,
            'Month': formatMonthYear(r.month, r.year),
            'Base Salary': r.baseSalary,
            'Present Days': r.presentDays, 'Absent Days': r.absentDays,
            'Leave Deduction': r.leaveDeduction, 'Advance': r.advanceDeduction,
            'Bonus': r.bonus, 'Other Deductions': r.otherDeductions,
            'Net Salary': r.finalSalary, 'Status': r.paid ? 'Paid' : 'Pending',
          })), `salary-report-${month}-${year}`, 'Salary')
          break
        case 'attendance':
          await exportToExcel(filteredAttendance.map(r => ({
            'Employee': employees.find(e => e.id === r.employeeId)?.name ?? r.employeeId,
            'Date': r.date, 'Status': r.status,
          })), `attendance-report-${month}-${year}`, 'Attendance')
          break
        case 'advances':
          await exportToExcel(filteredAdvances.map(r => ({
            'Employee': r.employeeName, 'Amount': r.amount,
            'Date': r.date, 'Reason': r.reason ?? '',
            'Adjust Month': r.adjustMonth ? formatMonthYear(r.adjustMonth, r.adjustYear!) : '—',
            'Status': r.status,
          })), 'advance-report', 'Advances')
          break
      }
      toast.success('Excel downloaded!')
    } catch { toast.error('Export failed') }
  }

  const handleDownloadPDF = async () => {
    if (!settings || filteredSalary.length === 0) {
      toast.error('No salary data to export. Save salary records first.')
      return
    }
    try {
      await generatePayrollReportPDF(filteredSalary, month, year, settings)
      toast.success('PDF downloaded!')
    } catch { toast.error('PDF failed') }
  }

  const FilterBar = ({ type }: { type: string }) => (
    <ReportFilters
      month={month} year={year} branch={branch} employeeId={employeeId}
      branches={branches} employees={employees}
      onMonthChange={setMonth} onYearChange={setYear}
      onBranchChange={setBranch} onEmployeeChange={setEmployeeId}
      onDownloadPDF={handleDownloadPDF}
      onDownloadExcel={() => handleDownloadExcel(type)}
    />
  )

  // ── Empty state for salary ───────────────────────────────────────────────────
  const SalaryEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-14 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
        <DollarSign className="h-8 w-8 text-purple-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        No salary records for {MONTHS[month - 1]} {year}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        Generate salary on the Salary page and click <strong>Save All</strong> — then come back here to view the report.
      </p>
      <div className="mt-5 flex gap-3">
        <Button size="sm" onClick={() => router.push('/salary')} className="gap-2">
          Go to Salary <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="outline" onClick={refreshAll} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View and export comprehensive reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="salary" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />Salary Report
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />Employee Report
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <CalendarCheck className="h-3.5 w-3.5" />Attendance Report
          </TabsTrigger>
          <TabsTrigger value="advances" className="gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />Advance Report
          </TabsTrigger>
        </TabsList>

        {/* ── SALARY REPORT ─────────────────────────────────────────── */}
        <TabsContent value="salary" className="space-y-4">
          <FilterBar type="salary" />

          {filteredSalary.length > 0 ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Total Net Salary', value: salaryStats.total, icon: DollarSign, color: 'purple' },
                  { label: 'Paid',             value: salaryStats.paid,    icon: CheckCircle, color: 'emerald' },
                  { label: 'Pending',          value: salaryStats.pending, icon: Clock,       color: 'amber' },
                  { label: 'Total Advance',    value: salaryStats.advance, icon: TrendingDown, color: 'red' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border p-3 ${
                      color === 'purple'  ? 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20' :
                      color === 'emerald' ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20' :
                      color === 'amber'   ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' :
                                           'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-3.5 w-3.5 ${
                        color === 'purple' ? 'text-purple-600' : color === 'emerald' ? 'text-emerald-600' :
                        color === 'amber' ? 'text-amber-600' : 'text-red-600'
                      }`} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                    <p className={`text-base font-bold ${
                      color === 'purple' ? 'text-purple-700 dark:text-purple-300' :
                      color === 'emerald' ? 'text-emerald-700 dark:text-emerald-300' :
                      color === 'amber' ? 'text-amber-700 dark:text-amber-300' :
                      'text-red-700 dark:text-red-300'
                    }`}>{formatCurrency(value)}</p>
                  </motion.div>
                ))}
              </div>

              {/* Salary table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead>Employee</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead className="text-red-500">Leave Ded.</TableHead>
                      <TableHead className="text-red-500">Advance</TableHead>
                      <TableHead className="text-emerald-600">Bonus</TableHead>
                      <TableHead className="text-purple-600 font-bold">Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSalary.map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                        <TableCell className="text-sm text-slate-500">{r.branch}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(r.baseSalary)}</TableCell>
                        <TableCell className="text-sm text-emerald-600 font-medium">{r.presentDays}</TableCell>
                        <TableCell className="text-sm text-red-500 font-medium">{r.absentDays}</TableCell>
                        <TableCell className="text-sm text-red-500">{formatCurrency(r.leaveDeduction)}</TableCell>
                        <TableCell className="text-sm text-red-500">{formatCurrency(r.advanceDeduction)}</TableCell>
                        <TableCell className="text-sm text-emerald-600">{formatCurrency(r.bonus)}</TableCell>
                        <TableCell className="font-bold text-purple-700 dark:text-purple-300">{formatCurrency(r.finalSalary)}</TableCell>
                        <TableCell>
                          <Badge variant={r.paid ? 'success' : 'warning'}>
                            {r.paid ? 'Paid' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Total bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-600 px-5 py-3 text-white">
                <div>
                  <p className="text-xs text-purple-200">{formatMonthYear(month, year)} · {salaryStats.paidCount}/{salaryStats.totalCount} paid</p>
                  <p className="text-sm font-semibold">Total Net Salary</p>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(salaryStats.total)}</p>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <SalaryEmptyState />
            </div>
          )}
        </TabsContent>

        {/* ── EMPLOYEE REPORT ───────────────────────────────────────── */}
        <TabsContent value="employees" className="space-y-4">
          <FilterBar type="employees" />

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total',    value: filteredEmployees.length, sub: 'employees' },
              { label: 'Active',   value: filteredEmployees.filter(e => e.status === 'active').length, sub: 'active' },
              { label: 'Inactive', value: filteredEmployees.filter(e => e.status === 'inactive').length, sub: 'inactive' },
              { label: 'Salary Bill', value: formatCurrency(filteredEmployees.reduce((s, e) => s + e.salary, 0)), sub: 'monthly total' },
            ].map(({ label, value, sub }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead>
                  <TableHead>Branch</TableHead><TableHead>Salary</TableHead>
                  <TableHead>Shift</TableHead><TableHead>Joining</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((e, i) => (
                  <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="text-xs text-slate-500">{e.employeeId}</TableCell>
                    <TableCell className="font-medium text-sm">{e.name}</TableCell>
                    <TableCell className="text-sm">{e.mobile}</TableCell>
                    <TableCell className="text-sm">{e.branch}</TableCell>
                    <TableCell className="text-sm font-medium text-purple-700 dark:text-purple-300">{formatCurrency(e.salary)}</TableCell>
                    <TableCell className="text-sm capitalize">{e.shiftType}</TableCell>
                    <TableCell className="text-sm">{formatDate(e.joiningDate)}</TableCell>
                    <TableCell><Badge variant={e.status === 'active' ? 'success' : 'secondary'}>{e.status}</Badge></TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            {filteredEmployees.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No employees found</p>}
          </div>
        </TabsContent>

        {/* ── ATTENDANCE REPORT ─────────────────────────────────────── */}
        <TabsContent value="attendance" className="space-y-4">
          <FilterBar type="attendance" />

          {/* Summary pills */}
          {filteredAttendance.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Present',  count: attStats.present,  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
                { label: 'Absent',   count: attStats.absent,   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                { label: 'Half Day', count: attStats.halfday,  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                { label: 'Late',     count: attStats.late,     color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                { label: 'Overtime', count: attStats.overtime, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                { label: 'Leave',    count: attStats.leave,    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
              ].filter(x => x.count > 0).map(({ label, count, color }) => (
                <span key={label} className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
                  {label}: {count}
                </span>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Employee</TableHead><TableHead>Branch</TableHead>
                  <TableHead>Date</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.slice(0, 300).map((r, i) => {
                  const emp = employees.find(e => e.id === r.employeeId)
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-medium text-sm">{emp?.name ?? r.employeeId}</TableCell>
                      <TableCell className="text-sm text-slate-500">{emp?.branch ?? '—'}</TableCell>
                      <TableCell className="text-sm">{formatDisplayDate(r.date)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          r.status === 'present' || r.status === 'overtime' ? 'success' :
                          r.status === 'absent' ? 'destructive' :
                          r.status === 'halfday' || r.status === 'late' ? 'warning' : 'secondary'
                        } className="capitalize">{r.status}</Badge>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
            {filteredAttendance.length === 0 && (
              <div className="flex flex-col items-center py-10 gap-3">
                <p className="text-sm text-slate-400">No attendance records for {MONTHS[month - 1]} {year}</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/attendance')} className="gap-2">
                  Go to Attendance <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── ADVANCE REPORT ────────────────────────────────────────── */}
        <TabsContent value="advances" className="space-y-4">
          <FilterBar type="advances" />

          {/* Summary */}
          {filteredAdvances.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Advances', value: formatCurrency(filteredAdvances.reduce((s, r) => s + r.amount, 0)), color: 'text-amber-600' },
                { label: 'Pending',        value: formatCurrency(filteredAdvances.filter(r => r.status !== 'adjusted').reduce((s, r) => s + r.amount, 0)), color: 'text-red-600' },
                { label: 'Adjusted',       value: filteredAdvances.filter(r => r.status === 'adjusted').length + ' records', color: 'text-emerald-600' },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Employee</TableHead><TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead><TableHead>Reason</TableHead>
                  <TableHead>Adjust Month</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdvances.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                    <TableCell className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(r.amount)}</TableCell>
                    <TableCell className="text-sm">{formatDisplayDate(r.date)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{r.reason ?? '—'}</TableCell>
                    <TableCell className="text-sm">{r.adjustMonth && r.adjustYear ? formatMonthYear(r.adjustMonth, r.adjustYear) : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'adjusted' ? 'success' : r.status === 'partial' ? 'info' : 'warning'}>
                        {r.status}
                      </Badge>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
            {filteredAdvances.length === 0 && (
              <div className="flex flex-col items-center py-10 gap-3">
                <p className="text-sm text-slate-400">No advance records found</p>
                <Button size="sm" variant="outline" onClick={() => router.push('/advances')} className="gap-2">
                  Go to Advances <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
