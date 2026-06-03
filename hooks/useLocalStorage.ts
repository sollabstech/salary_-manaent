'use client'

import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem('sep_' + key)
      if (item) setStoredValue(JSON.parse(item))
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [key])

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem('sep_' + key, JSON.stringify(valueToStore))
      } catch (e) {
        console.error(e)
      }
    },
    [key, storedValue]
  )

  return [storedValue, setValue, loaded] as const
}
