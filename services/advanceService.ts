import type { AdvanceRecord } from '@/types'
import { storageGet, storageSet } from './storage'
import { generateId } from '@/lib/utils'

const KEY = 'advance_records'

export function getAdvanceRecords(): AdvanceRecord[] {
  return storageGet<AdvanceRecord[]>(KEY) ?? []
}

export function saveAdvanceRecords(records: AdvanceRecord[]): void {
  storageSet(KEY, records)
}

export function addAdvance(data: Omit<AdvanceRecord, 'id' | 'adjustedAmount' | 'createdAt' | 'updatedAt'>): AdvanceRecord {
  const records = getAdvanceRecords()
  const now = new Date().toISOString()
  const record: AdvanceRecord = { ...data, id: generateId(), adjustedAmount: 0, createdAt: now, updatedAt: now }
  records.push(record)
  saveAdvanceRecords(records)
  return record
}

export function updateAdvance(id: string, data: Partial<AdvanceRecord>): AdvanceRecord | null {
  const records = getAdvanceRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx === -1) return null
  records[idx] = { ...records[idx], ...data, updatedAt: new Date().toISOString() }
  saveAdvanceRecords(records)
  return records[idx]
}

export function deleteAdvance(id: string): void {
  saveAdvanceRecords(getAdvanceRecords().filter(r => r.id !== id))
}

export function getAdvancesForEmployee(employeeId: string): AdvanceRecord[] {
  return getAdvanceRecords().filter(r => r.employeeId === employeeId)
}

export function getPendingAdvancesForEmployee(employeeId: string): AdvanceRecord[] {
  return getAdvanceRecords().filter(r => r.employeeId === employeeId && r.status !== 'adjusted')
}

export function getTotalPendingAdvances(): number {
  return getAdvanceRecords()
    .filter(r => r.status !== 'adjusted')
    .reduce((sum, r) => sum + (r.amount - r.adjustedAmount), 0)
}

export function markAdvanceAdjusted(id: string): void {
  const records = getAdvanceRecords()
  const idx = records.findIndex(r => r.id === id)
  if (idx !== -1) {
    records[idx].status = 'adjusted'
    records[idx].adjustedAmount = records[idx].amount
    records[idx].updatedAt = new Date().toISOString()
    saveAdvanceRecords(records)
  }
}
