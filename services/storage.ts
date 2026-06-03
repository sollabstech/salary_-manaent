const PREFIX = 'sep_'

export function storageGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('Storage error:', e)
  }
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PREFIX + key)
}

export function storageKeys(): string[] {
  if (typeof window === 'undefined') return []
  return Object.keys(localStorage).filter(k => k.startsWith(PREFIX))
}

export function exportAllData(): string {
  const data: Record<string, unknown> = {}
  storageKeys().forEach(key => {
    const raw = localStorage.getItem(key)
    if (raw) data[key.replace(PREFIX, '')] = JSON.parse(raw)
  })
  return JSON.stringify(data, null, 2)
}

export function importAllData(jsonStr: string): void {
  const data = JSON.parse(jsonStr) as Record<string, unknown>
  Object.entries(data).forEach(([key, value]) => {
    storageSet(key, value)
  })
}
