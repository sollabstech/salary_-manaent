'use client'

import { useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { useEmployees } from '@/hooks/useEmployees'
import { useSalary } from '@/hooks/useSalary'
import { useAttendance } from '@/hooks/useAttendance'
import { useAdvances } from '@/hooks/useAdvances'
import { useSettings } from '@/hooks/useSettings'
import { formatCurrency, formatDate } from '@/lib/utils'
import { formatDisplayDate, formatMonthYear, currentMonth, currentYear } from '@/utils/date-helpers'
import { exportToExcel } from '@/utils/export-excel'
import { generatePayrollReportPDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'

export default function ReportsPage() {
  const { employees } = useEmployees()
  const { records: salaryRecords } = useSalary()
  const { records: attendance } = useAttendance()
  const { records: advances } = useAdvances()
  const { settings } = useSettings()

  const [month, setMonth] = useState(currentMonth())
  const [year, setYear] = useState(currentYear())
  const [branch, setBranch] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')

  const branches = useMemo(() => [...new Set(employees.map(e => e.branch))].filter(Boolean), [employees])

  const filteredEmployees = useMemo(() =>
    employees.filter(e => (branch === 'all' || e.branch === branch) && (employeeId === 'all' || e.id === employeeId)),
    [employees, branch, employeeId]
  )

  const filteredSalary = useMemo(() =>
    salaryRecords.filter(r =>
      r.month === month && r.year === year &&
      (branch === 'all' || r.branch === branch) &&
      (employeeId === 'all' || r.employeeId === employeeId)
    ),
    [salaryRecords, month, year, branch, employeeId]
  )

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
      (branch === 'all' || (() => {
        const e = employees.find(emp => emp.id === r.employeeId)
        return e?.branch === branch
      })())
    ),
    [advances, employeeId, branch, employees]
  )

  const handleDownloadExcel = async (type: string) => {
    try {
      switch (type) {
        case 'employees':
          await exportToExcel(filteredEmployees.map(e => ({
            'ID': e.employeeId, 'Name': e.name, 'Mobile': e.mobile,
            'Branch': e.branch, 'Salary': e.salary, 'Status': e.status,
            'Joining Date': e.joiningDate,
          })), 'employee-report', 'Employees')
          break
        case 'salary':
          await exportToExcel(filteredSalary.map(r => ({
            'Employee': r.employeeName, 'Branch': r.branch, 'Month': formatMonthYear(r.month, r.year),
            'Base Salary': r.baseSalary, 'Net Salary': r.finalSalary, 'Status': r.paid ? 'Paid' : 'Pending',
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
            'Date': r.date, 'Reason': r.reason,
            'Adjust Month': r.adjustMonth ? formatMonthYear(r.adjustMonth, r.adjustYear!) : '—',
            'Status': r.status,
          })), 'advance-report', 'Advances')
          break
      }
      toast.success('Excel downloaded!')
    } catch { toast.error('Export failed') }
  }

  const handleDownloadPDF = async () => {
    if (!settings || filteredSalary.length === 0) { toast.error('No salary data for selected filters'); return }
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reports</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Generate and export comprehensive reports</p>
      </div>

      <Tabs defaultValue="salary">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="employees">Employee Report</TabsTrigger>
          <TabsTrigger value="salary">Salary Report</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
          <TabsTrigger value="advances">Advance Report</TabsTrigger>
        </TabsList>

        {/* Employee Report */}
        <TabsContent value="employees" className="space-y-4">
          <FilterBar type="employees" />
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>ID</TableHead><TableHead>Name</TableHead><TableHead>Mobile</TableHead>
                  <TableHead>Branch</TableHead><TableHead>Salary</TableHead>
                  <TableHead>Joining Date</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-slate-500">{e.employeeId}</TableCell>
                    <TableCell className="font-medium text-sm">{e.name}</TableCell>
                    <TableCell className="text-sm">{e.mobile}</TableCell>
                    <TableCell className="text-sm">{e.branch}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(e.salary)}</TableCell>
                    <TableCell className="text-sm">{formatDate(e.joiningDate)}</TableCell>
                    <TableCell><Badge variant={e.status === 'active' ? 'success' : 'secondary'}>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredEmployees.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No employees found</p>}
          </div>
        </TabsContent>

        {/* Salary Report */}
        <TabsContent value="salary" className="space-y-4">
          <FilterBar type="salary" />
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Employee</TableHead><TableHead>Branch</TableHead>
                  <TableHead>Base Salary</TableHead><TableHead>Leave Ded.</TableHead>
                  <TableHead>Advance</TableHead><TableHead>Bonus</TableHead>
                  <TableHead>Net Salary</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSalary.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                    <TableCell className="text-sm">{r.branch}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(r.baseSalary)}</TableCell>
                    <TableCell className="text-sm text-red-500">{formatCurrency(r.leaveDeduction)}</TableCell>
                    <TableCell className="text-sm text-red-500">{formatCurrency(r.advanceDeduction)}</TableCell>
                    <TableCell className="text-sm text-emerald-600">{formatCurrency(r.bonus)}</TableCell>
                    <TableCell className="font-bold text-purple-700 dark:text-purple-300">{formatCurrency(r.finalSalary)}</TableCell>
                    <TableCell><Badge variant={r.paid ? 'success' : 'warning'}>{r.paid ? 'Paid' : 'Pending'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSalary.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No salary records for selected period</p>}
          </div>
          {filteredSalary.length > 0 && (
            <div className="flex justify-between items-center rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3">
              <span className="text-sm font-medium">Total Net Salary ({formatMonthYear(month, year)})</span>
              <span className="font-bold text-purple-700 dark:text-purple-300">{formatCurrency(filteredSalary.reduce((s, r) => s + r.finalSalary, 0))}</span>
            </div>
          )}
        </TabsContent>

        {/* Attendance Report */}
        <TabsContent value="attendance" className="space-y-4">
          <FilterBar type="attendance" />
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                  <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.slice(0, 200).map(r => {
                  const emp = employees.find(e => e.id === r.employeeId)
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-sm">{emp?.name ?? r.employeeId}</TableCell>
                      <TableCell className="text-sm">{formatDisplayDate(r.date)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          r.status === 'present' ? 'success' :
                          r.status === 'absent' ? 'destructive' :
                          r.status === 'halfday' || r.status === 'late' ? 'warning' : 'secondary'
                        }>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {filteredAttendance.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No attendance records for selected period</p>}
          </div>
        </TabsContent>

        {/* Advance Report */}
        <TabsContent value="advances" className="space-y-4">
          <FilterBar type="advances" />
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
                {filteredAdvances.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium text-sm">{r.employeeName}</TableCell>
                    <TableCell className="text-sm font-semibold text-amber-600">{formatCurrency(r.amount)}</TableCell>
                    <TableCell className="text-sm">{formatDisplayDate(r.date)}</TableCell>
                    <TableCell className="text-sm text-slate-500">{r.reason ?? '—'}</TableCell>
                    <TableCell className="text-sm">{r.adjustMonth && r.adjustYear ? formatMonthYear(r.adjustMonth, r.adjustYear) : '—'}</TableCell>
                    <TableCell><Badge variant={r.status === 'adjusted' ? 'success' : r.status === 'partial' ? 'info' : 'warning'}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredAdvances.length === 0 && <p className="text-center text-slate-400 py-8 text-sm">No advance records found</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
