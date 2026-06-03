import type { Employee } from '@/types'
import { storageGet, storageSet } from './storage'
import { generateId } from '@/lib/utils'

const KEY = 'employees'

export function getEmployees(): Employee[] {
  return storageGet<Employee[]>(KEY) ?? []
}

export function saveEmployees(employees: Employee[]): void {
  storageSet(KEY, employees)
}

export function addEmployee(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Employee {
  const employees = getEmployees()
  const now = new Date().toISOString()
  const employee: Employee = { ...data, id: generateId(), createdAt: now, updatedAt: now }
  employees.push(employee)
  saveEmployees(employees)
  return employee
}

export function updateEmployee(id: string, data: Partial<Employee>): Employee | null {
  const employees = getEmployees()
  const idx = employees.findIndex(e => e.id === id)
  if (idx === -1) return null
  employees[idx] = { ...employees[idx], ...data, updatedAt: new Date().toISOString() }
  saveEmployees(employees)
  return employees[idx]
}

export function deleteEmployee(id: string): void {
  const employees = getEmployees().filter(e => e.id !== id)
  saveEmployees(employees)
}

export function getEmployee(id: string): Employee | undefined {
  return getEmployees().find(e => e.id === id)
}
