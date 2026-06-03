'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useSettings } from '@/hooks/useSettings'
import { exportAllData, importAllData } from '@/services/storage'
import { fileToBase64 } from '@/lib/utils'
import { Building2, Download, Upload, Trash2, Save, Moon, Sun } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

const schema = z.object({
  name: z.string().min(1, 'Company name required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  lateDeductionAmount: z.number().min(0),
  workingDaysPerMonth: z.number().min(1).max(31),
})

type FormData = z.infer<typeof schema>

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const { theme, setTheme } = useTheme()
  const logoRef = useRef<HTMLInputElement>(null)
  const backupRef = useRef<HTMLInputElement>(null)
  const [logoBase64, setLogoBase64] = useState<string | undefined>(settings?.logoBase64)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: settings ?? {
      name: 'SEP Salary Shop',
      currency: 'INR',
      currencySymbol: '₹',
      lateDeductionAmount: 0,
      workingDaysPerMonth: 30,
    },
  })

  const onSubmit = (data: FormData) => {
    update({ ...data, logoBase64 })
    toast.success('Settings saved!')
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1 * 1024 * 1024) { toast.error('Logo must be under 1MB'); return }
    const base64 = await fileToBase64(file)
    setLogoBase64(base64)
  }

  const handleBackup = () => {
    const data = exportAllData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sep-payroll-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded!')
  }

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importAllData(ev.target?.result as string)
        toast.success('Data restored! Refreshing...')
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        toast.error('Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    if (!confirm('Are you sure? This will delete ALL data permanently!')) return
    Object.keys(localStorage).filter(k => k.startsWith('sep_')).forEach(k => localStorage.removeItem(k))
    toast.success('All data cleared!')
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your company info, preferences, and data</p>
      </div>

      {/* Company Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />Company Information
            </CardTitle>
            <CardDescription>Update your company name, logo, and contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 cursor-pointer rounded-xl" onClick={() => logoRef.current?.click()}>
                  <AvatarImage src={logoBase64} className="object-contain" />
                  <AvatarFallback className="rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <Building2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button type="button" variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                    Upload Logo
                  </Button>
                  {logoBase64 && (
                    <Button type="button" variant="ghost" size="sm" className="ml-2 text-red-500" onClick={() => setLogoBase64(undefined)}>
                      Remove
                    </Button>
                  )}
                  <p className="mt-1 text-xs text-slate-400">PNG, JPG up to 1MB</p>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Company Name *</Label>
                  <Input {...register('name')} placeholder="SEP Salary Shop" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Address</Label>
                  <Input {...register('address')} placeholder="123 Business Street, City" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input {...register('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input {...register('email')} placeholder="contact@company.com" />
                </div>
                <div className="space-y-1">
                  <Label>Currency Symbol</Label>
                  <Input {...register('currencySymbol')} placeholder="₹" className="w-24" />
                </div>
                <div className="space-y-1">
                  <Label>Working Days/Month</Label>
                  <Input {...register('workingDaysPerMonth')} type="number" min={1} max={31} />
                </div>
                <div className="space-y-1">
                  <Label>Late Deduction Amount (₹/instance)</Label>
                  <Input {...register('lateDeductionAmount')} type="number" min={0} placeholder="0" />
                </div>
              </div>

              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the app&apos;s look and feel</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-purple-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              <div>
                <p className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs text-slate-500">Toggle between light and dark theme</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Management */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Backup, restore, or clear all local data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleBackup} className="gap-2">
                <Download className="h-4 w-4" />Download Backup (JSON)
              </Button>
              <Button variant="outline" onClick={() => backupRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" />Restore from Backup
              </Button>
              <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Danger Zone</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">This will permanently delete all employees, salary records, attendance, and advance data.</p>
              <Button variant="destructive" size="sm" onClick={handleClearData} className="gap-2">
                <Trash2 className="h-4 w-4" />Clear All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
