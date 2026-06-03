import type { AttendanceRecord, AttendanceStatus } from '@/types'
import { storageGet, storageSet } from './storage'
import { generateId } from '@/lib/utils'

const KEY = 'attendance'

export function getAttendanceRecords(): AttendanceRecord[] {
  return storageGet<AttendanceRecord[]>(KEY) ?? []
}

export function saveAttendanceRecords(records: AttendanceRecord[]): void {
  storageSet(KEY, records)
}

export function getAttendanceForDate(date: string): AttendanceRecord[] {
  return getAttendanceRecords().filter(r => r.date === date)
}

export function getAttendanceForEmployee(employeeId: string): AttendanceRecord[] {
  return getAttendanceRecords().filter(r => r.employeeId === employeeId)
}

export function getAttendanceForMonth(month: number, year: number): AttendanceRecord[] {
  return getAttendanceRecords().filter(r => {
    const d = new Date(r.date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  })
}

export function markAttendance(
  employeeId: string,
  date: string,
  status: AttendanceStatus,
  note?: string
): AttendanceRecord {
  const records = getAttendanceRecords()
  const existing = records.findIndex(r => r.employeeId === employeeId && r.date === date)
  const now = new Date().toISOString()

  if (existing !== -1) {
    records[existing] = { ...records[existing], status, note, createdAt: now }
    saveAttendanceRecords(records)
    return records[existing]
  }

  const record: AttendanceRecord = {
    id: generateId(),
    employeeId,
    date,
    status,
    note,
    createdAt: now,
  }
  records.push(record)
  saveAttendanceRecords(records)
  return record
}

export function markBulkAttendance(
  entries: { employeeId: string; date: string; status: AttendanceStatus }[]
): void {
  const records = getAttendanceRecords()
  const now = new Date().toISOString()

  entries.forEach(({ employeeId, date, status }) => {
    const idx = records.findIndex(r => r.employeeId === employeeId && r.date === date)
    if (idx !== -1) {
      records[idx] = { ...records[idx], status, createdAt: now }
    } else {
      records.push({ id: generateId(), employeeId, date, status, createdAt: now })
    }
  })

  saveAttendanceRecords(records)
}
