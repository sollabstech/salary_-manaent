import { storageGet, storageSet } from './storage'
import type { Branch } from '@/types'
import { generateId } from '@/lib/utils'

const KEY = 'branches'

export function getBranches(): Branch[] {
  return storageGet<Branch[]>(KEY) ?? []
}

export function addBranch(data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>): Branch {
  const branches = getBranches()
  if (branches.find(b => b.name.toLowerCase() === data.name.toLowerCase())) {
    throw new Error('Branch with this name already exists')
  }
  const now = new Date().toISOString()
  const branch: Branch = { ...data, id: generateId(), createdAt: now, updatedAt: now }
  storageSet(KEY, [...branches, branch])
  return branch
}

export function updateBranch(id: string, data: Partial<Pick<Branch, 'name' | 'address' | 'phone'>>): void {
  const branches = getBranches()
  const now = new Date().toISOString()
  storageSet(KEY, branches.map(b => b.id === id ? { ...b, ...data, updatedAt: now } : b))
}

export function deleteBranch(id: string): void {
  const branches = getBranches()
  storageSet(KEY, branches.filter(b => b.id !== id))
}
