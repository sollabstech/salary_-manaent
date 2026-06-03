import type { SalaryRecord } from '@/types'
import { storageGet, storageSet } from './storage'
import { generateId } from '@/lib/utils'

const KEY = 'salary_records'

export function getSalaryRecords(): SalaryRecord[] {
  return storageGet<SalaryRecord[]>(KEY) ?? []
}

export function saveSalaryRecords(records: SalaryRecord[]): void {
  storageSet(KEY, records)
}

export function getSalaryForMonth(month: number, year: number): SalaryRecord[] {
  return getSalaryRecords().filter(r => r.month === month && r.year === year)
}

export function getSalaryForEmployee(employeeId: string): SalaryRecord[] {
  return getSalaryRecords().filter(r => r.employeeId === employeeId)
}

export function upsertSalaryRecord(
  data: Omit<SalaryRecord, 'id' | 'createdAt' | 'updatedAt'>
): SalaryRecord {
  const records = getSalaryRecords()
  const now = new Date().toISOString()
  const existing = records.findIndex(
    r => r.employeeId === data.employeeId && r.month === data.month && r.year === data.year
  )

  if (existing !== -1) {
    records[existing] = { ...records[existing], ...data, updatedAt: now }
    saveSalaryRecords(records)
    return records[existing]
  }

  const record: SalaryRecord = { ...data, id: generateId(), createdAt: now, updatedAt: now }
  records.push(record)
  saveSalaryRecords(records)
  return record
}

export function markSalaryPaid(id: string): void {
  const records = getSalaryRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx !== -1) {
    records[idx].paid = true
    records[idx].paidDate = new Date().toISOString()
    records[idx].updatedAt = new Date().toISOString()
    saveSalaryRecords(records)
  }
}

export function deleteSalaryRecord(id: string): void {
  saveSalaryRecords(getSalaryRecords().filter(r => r.id !== id))
}

export function getTotalPaidSalary(): number {
  return getSalaryRecords()
    .filter(r => r.paid)
    .reduce((sum, r) => sum + r.finalSalary, 0)
}

export function getMonthlySalaryExpense(month: number, year: number): number {
  return getSalaryForMonth(month, year).reduce((sum, r) => sum + r.finalSalary, 0)
}
