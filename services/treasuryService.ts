import type { TreasuryData } from '@/types'
import { storageGet, storageSet } from './storage'

const KEY = 'treasury'

const DEFAULT: TreasuryData = {
  bankBalance: 0,
  cashInHand: 0,
  updatedAt: new Date().toISOString(),
}

export function getTreasury(): TreasuryData {
  return storageGet<TreasuryData>(KEY) ?? DEFAULT
}

export function saveTreasury(data: Partial<TreasuryData>): TreasuryData {
  const current = getTreasury()
  const updated: TreasuryData = { ...current, ...data, updatedAt: new Date().toISOString() }
  storageSet(KEY, updated)
  return updated
}
