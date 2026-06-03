'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, CreditCard, TrendingUp, CalendarCheck } from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { SalaryChart } from '@/components/dashboard/SalaryChart'
import { AttendanceChart } from '@/components/dashboard/AttendanceChart'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useEmployees } from '@/hooks/useEmployees'
import { useAttendance } from '@/hooks/useAttendance'
import { useSalary } from '@/hooks/useSalary'
import { useAdvances } from '@/hooks/useAdvances'
import { MONTH_SHORT, YEARS, CURRENT_YEAR } from '@/lib/utils'
import { currentMonth, currentYear } from '@/utils/date-helpers'
import { getTotalPaidSalary, getMonthlySalaryExpense } from '@/services/salaryService'
import { getTotalPendingAdvances } from '@/services/advanceService'

export default function DashboardPage() {
  const { employees } = useEmployees()
  const { records: attendance } = useAttendance()
  const { records: salaryRecords } = useSalary()
  const { records: advances } = useAdvances()

  const month = currentMonth()
  const year = currentYear()

  const activeEmployees = employees.filter(e => e.status === 'active').length
  const monthlyExpense = getMonthlySalaryExpense(month, year)
  const pendingAdvances = getTotalPendingAdvances()
  const totalPaid = getTotalPaidSalary()

  // Attendance summary this month
  const monthAttendance = attendance.filter(r => {
    const d = new Date(r.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })
  const attendancePie = [
    { name: 'Present', value: monthAttendance.filter(r => r.status === 'present').length, color: '#10b981' },
    { name: 'Absent', value: monthAttendance.filter(r => r.status === 'absent').length, color: '#ef4444' },
    { name: 'Half Day', value: monthAttendance.filter(r => r.status === 'halfday').length, color: '#f59e0b' },
    { name: 'Late', value: monthAttendance.filter(r => r.status === 'late').length, color: '#f97316' },
    { name: 'Leave', value: monthAttendance.filter(r => r.status === 'leave').length, color: '#94a3b8' },
    { name: 'Overtime', value: monthAttendance.filter(r => r.status === 'overtime').length, color: '#3b82f6' },
  ].filter(d => d.value > 0)

  // Last 6 months salary chart
  const salaryChartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - (5 - i), 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const monthRecords = salaryRecords.filter(r => r.month === m && r.year === y)
      return {
        month: MONTH_SHORT[m - 1],
        paid: monthRecords.filter(r => r.paid).reduce((s, r) => s + r.finalSalary, 0),
        pending: monthRecords.filter(r => !r.paid).reduce((s, r) => s + r.finalSalary, 0),
      }
    })
  }, [salaryRecords, month, year])

  const stats = [
    { title: 'Total Employees', value: activeEmployees, subtitle: `${employees.filter(e => e.status === 'inactive').length} inactive`, icon: Users, color: 'purple' as const },
    { title: 'Monthly Salary Expense', value: monthlyExpense, subtitle: 'Current month', icon: DollarSign, color: 'blue' as const, isCurrency: true },
    { title: 'Pending Advances', value: pendingAdvances, subtitle: `${advances.filter(a => a.status !== 'adjusted').length} records`, icon: CreditCard, color: 'amber' as const, isCurrency: true },
    { title: 'Total Salary Paid', value: totalPaid, subtitle: 'All time', icon: TrendingUp, color: 'emerald' as const, isCurrency: true },
    { title: 'Attendance Marked', value: monthAttendance.length, subtitle: 'This month', icon: CalendarCheck, color: 'purple' as const },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Here&apos;s what&apos;s happening with your payroll today.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, i) => (
          <StatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h3>
        <QuickActions />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <SalaryChart data={salaryChartData} />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <AttendanceChart data={attendancePie} />
        </motion.div>
      </div>
    </div>
  )
}
