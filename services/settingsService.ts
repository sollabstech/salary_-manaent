import type { CompanySettings } from '@/types'
import { storageGet, storageSet } from './storage'

const KEY = 'settings'

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'SEP Salary Shop',
  currency: 'INR',
  currencySymbol: '₹',
  themeMode: 'system',
  lateDeductionAmount: 0,
  workingDaysPerMonth: 30,
}

export function getSettings(): CompanySettings {
  return storageGet<CompanySettings>(KEY) ?? DEFAULT_SETTINGS
}

export function saveSettings(settings: CompanySettings): void {
  storageSet(KEY, settings)
}

export function updateSettings(data: Partial<CompanySettings>): CompanySettings {
  const current = getSettings()
  const updated = { ...current, ...data }
  saveSettings(updated)
  return updated
}
