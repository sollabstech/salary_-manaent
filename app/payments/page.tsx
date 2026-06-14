'use client'

import { useState, useEffect } from 'react'
import { useTreasury } from '@/hooks/useTreasury'
import { useSettings } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { Landmark, Wallet, TrendingUp, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

export default function PaymentsPage() {
  const { treasury, loading, update } = useTreasury()
  const { settings } = useSettings()
  const sym = settings?.currencySymbol ?? '₹'

  const [bankInput, setBankInput]   = useState('')
  const [cashInput, setCashInput]   = useState('')
  const [dirty, setDirty]           = useState(false)

  // Sync inputs when data loads
  useEffect(() => {
    if (treasury) {
      setBankInput(treasury.bankBalance.toString())
      setCashInput(treasury.cashInHand.toString())
      setDirty(false)
    }
  }, [treasury])

  const bankVal  = parseFloat(bankInput)  || 0
  const cashVal  = parseFloat(cashInput)  || 0
  const netWorth = bankVal + cashVal

  const handleSave = () => {
    update({ bankBalance: bankVal, cashInHand: cashVal })
    setDirty(false)
    toast.success('Balance updated!')
  }

  const handleReset = () => {
    if (treasury) {
      setBankInput(treasury.bankBalance.toString())
      setCashInput(treasury.cashInHand.toString())
      setDirty(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Payments & Cash</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track your bank balance and cash in hand — net worth updates automatically.
        </p>
      </div>

      {/* Input Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bank Balance */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Cash at Bank
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Bank Balance</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                {sym}
              </span>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="pl-7 text-base font-semibold"
                value={bankInput}
                onChange={e => { setBankInput(e.target.value); setDirty(true) }}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-slate-400">Amount currently in your bank account</p>
          </CardContent>
        </Card>

        {/* Cash in Hand */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Cash in Hand
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-xs text-slate-500 dark:text-slate-400">Physical Cash</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                {sym}
              </span>
              <Input
                type="number"
                min={0}
                step={0.01}
                className="pl-7 text-base font-semibold"
                value={cashInput}
                onChange={e => { setCashInput(e.target.value); setDirty(true) }}
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-slate-400">Physical cash available on hand</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-purple-700 dark:text-purple-300">
            <TrendingUp className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-slate-800/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Landmark className="h-4 w-4 text-blue-500" />
                Total Bank Cash
              </div>
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {formatCurrency(bankVal)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white/60 dark:bg-slate-800/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Wallet className="h-4 w-4 text-emerald-500" />
                Total Cash in Hand
              </div>
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(cashVal)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-purple-600 px-4 py-4">
              <span className="font-semibold text-purple-100">Total Net Worth</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(netWorth)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {dirty && (
        <div className="flex gap-3">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      )}

      {!dirty && treasury && (
        <p className="text-xs text-slate-400">
          Last updated: {new Date(treasury.updatedAt).toLocaleString('en-IN')}
        </p>
      )}
    </div>
  )
}
