'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CompanySettings } from '@/types'
import { getSettings, updateSettings } from '@/services/settingsService'

export function useSettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setSettings(getSettings())
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const update = useCallback((data: Partial<CompanySettings>) => {
    const updated = updateSettings(data)
    setSettings(updated)
    return updated
  }, [])

  return { settings, loading, refresh, update }
}
