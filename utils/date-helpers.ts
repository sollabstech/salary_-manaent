import { MONTHS } from '@/lib/utils'

export function formatMonthYear(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`
}

export function getMonthDates(month: number, year: number): string[] {
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, i) => {
    const d = i + 1
    return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  })
}

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay()
  return day === 0 || day === 6
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function currentMonth(): number {
  return new Date().getMonth() + 1
}

export function currentYear(): number {
  return new Date().getFullYear()
}
