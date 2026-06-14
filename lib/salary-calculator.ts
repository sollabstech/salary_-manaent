import type { AttendanceRecord, AdvanceRecord } from '@/types'

export function calculatePerDaySalary(monthlySalary: number, workingDays = 30): number {
  return monthlySalary / workingDays
}

export function calculateLeaveDeduction(
  monthlySalary: number,
  absentDays: number,
  halfDays: number,
  workingDays = 30,
  leaveDays = 0,
  paidLeave = 0
): number {
  const perDay = calculatePerDaySalary(monthlySalary, workingDays)
  const extraLeave = Math.max(0, leaveDays - paidLeave)
  return Math.round(perDay * (absentDays + halfDays * 0.5 + extraLeave) * 100) / 100
}

export function calculateFinalSalary(params: {
  baseSalary: number
  leaveDeduction: number
  advanceDeduction: number
  bonus: number
  otherDeductions: number
  lateDeduction: number
}): number {
  const { baseSalary, leaveDeduction, advanceDeduction, bonus, otherDeductions, lateDeduction } = params
  const final = baseSalary - leaveDeduction - advanceDeduction - otherDeductions - lateDeduction + bonus
  return Math.max(0, Math.round(final * 100) / 100)
}

export function getAttendanceSummary(
  records: AttendanceRecord[],
  month: number,
  year: number
): { present: number; absent: number; halfday: number; late: number; overtime: number; leave: number } {
  const filtered = records.filter(r => {
    const d = new Date(r.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })
  return {
    present: filtered.filter(r => r.status === 'present').length,
    absent: filtered.filter(r => r.status === 'absent').length,
    halfday: filtered.filter(r => r.status === 'halfday').length,
    late: filtered.filter(r => r.status === 'late').length,
    overtime: filtered.filter(r => r.status === 'overtime').length,
    leave: filtered.filter(r => r.status === 'leave').length,
  }
}

/**
 * Gets pending/partial advances for salary deduction:
 * - Advances explicitly assigned to this month/year, OR
 * - Advances with no month assigned (pending, auto-deduct to current salary)
 * Already-adjusted advances are excluded to prevent double-deduction.
 */
export function getAdvanceForMonth(
  advances: AdvanceRecord[],
  employeeId: string,
  month: number,
  year: number
): number {
  return advances
    .filter(a =>
      a.employeeId === employeeId &&
      a.status !== 'adjusted' &&
      (
        // Explicitly assigned to this salary month
        (a.adjustMonth === month && a.adjustYear === year) ||
        // Unassigned pending advance — auto-deduct to this month
        (!a.adjustMonth && !a.adjustYear)
      )
    )
    .reduce((sum, a) => sum + a.amount, 0)
}

/** @deprecated Use getAdvanceForMonth for salary generation */
export function getPendingAdvanceForMonth(
  advances: AdvanceRecord[],
  employeeId: string,
  month: number,
  year: number
): number {
  return advances
    .filter(a =>
      a.employeeId === employeeId &&
      a.status !== 'adjusted' &&
      a.adjustMonth === month &&
      a.adjustYear === year
    )
    .reduce((sum, a) => sum + (a.amount - a.adjustedAmount), 0)
}
