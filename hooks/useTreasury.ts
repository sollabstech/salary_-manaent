'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TreasuryData } from '@/types'
import { getTreasury, saveTreasury } from '@/services/treasuryService'

export function useTreasury() {
  const [treasury, setTreasury] = useState<TreasuryData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setTreasury(getTreasury())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = useCallback((data: Partial<TreasuryData>) => {
    const updated = saveTreasury(data)
    setTreasury(updated)
    return updated
  }, [])

  return { treasury, loading, update }
}
