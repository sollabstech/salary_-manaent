import { storageGet, storageSet, storageRemove } from './storage'
import type { AuthUser, AuthSession, UserPermissions } from '@/types'
import { generateId } from '@/lib/utils'

export const ADMIN_PHONE = '93841199108'
export const STATIC_OTP = '197979'

const USERS_KEY = 'auth_users'
const SESSION_KEY = 'auth_session'

export const FULL_PERMISSIONS: UserPermissions = {
  dashboard: true, employees: true, attendance: true,
  salary: true, advances: true, payments: true,
  reports: true, settings: true,
}

export const EMPTY_PERMISSIONS: UserPermissions = {
  dashboard: true, employees: false, attendance: false,
  salary: false, advances: false, payments: false,
  reports: false, settings: false,
}

function seedAdmin(): void {
  if (typeof window === 'undefined') return
  const users = storageGet<AuthUser[]>(USERS_KEY) ?? []
  if (users.find(u => u.role === 'admin')) return
  const now = new Date().toISOString()
  storageSet(USERS_KEY, [{
    id: 'admin_default',
    username: 'bala1979',
    password: 'bala@test',
    role: 'admin' as const,
    permissions: FULL_PERMISSIONS,
    createdAt: now,
    updatedAt: now,
  }])
}

export function getAuthUsers(): AuthUser[] {
  seedAdmin()
  return storageGet<AuthUser[]>(USERS_KEY) ?? []
}

export function addAuthUser(data: Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'>): AuthUser {
  const users = getAuthUsers()
  if (users.find(u => u.username === data.username)) {
    throw new Error('Username already exists')
  }
  const now = new Date().toISOString()
  const user: AuthUser = { ...data, id: generateId(), createdAt: now, updatedAt: now }
  storageSet(USERS_KEY, [...users, user])
  return user
}

export function updateAuthUser(id: string, data: Partial<Pick<AuthUser, 'password' | 'permissions'>>): void {
  const users = getAuthUsers()
  const now = new Date().toISOString()
  storageSet(USERS_KEY, users.map(u => u.id === id ? { ...u, ...data, updatedAt: now } : u))
}

export function deleteAuthUser(id: string): void {
  const users = getAuthUsers()
  // Never delete the admin
  storageSet(USERS_KEY, users.filter(u => u.id !== id || u.role === 'admin'))
}

export function loginUser(username: string, password: string): AuthSession | null {
  const users = getAuthUsers()
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) return null
  const session: AuthSession = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.role === 'admin' ? FULL_PERMISSIONS : user.permissions,
    loginAt: new Date().toISOString(),
  }
  storageSet(SESSION_KEY, session)
  return session
}

export function logoutUser(): void {
  storageRemove(SESSION_KEY)
}

export function getSession(): AuthSession | null {
  return storageGet<AuthSession>(SESSION_KEY)
}

export function changeAdminPassword(newPassword: string): void {
  const users = getAuthUsers()
  const now = new Date().toISOString()
  storageSet(USERS_KEY, users.map(u =>
    u.role === 'admin' ? { ...u, password: newPassword, updatedAt: now } : u
  ))
}
