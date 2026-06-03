'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Employee } from '@/types'
import { MONTHS, YEARS } from '@/lib/utils'
import { toast } from 'sonner'
import { todayISO, currentMonth, currentYear } from '@/utils/date-helpers'

const schema = z.object({
  employeeId: z.string().min(1, 'Select employee'),
  amount: z.number().min(1, 'Amount must be positive'),
  date: z.string().min(1, 'Date required'),
  reason: z.string().optional(),
  adjustMonth: z.number().min(1).max(12),
  adjustYear: z.number(),
})

type FormData = z.infer<typeof schema>

interface AdvanceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employees: Employee[]
  onSubmit: (data: FormData) => void
}

export function AdvanceForm({ open, onOpenChange, employees, onSubmit }: AdvanceFormProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayISO(),
      adjustMonth: currentMonth(),
      adjustYear: currentYear(),
    },
  })

  const onFormSubmit = (data: FormData) => {
    onSubmit(data)
    reset()
    onOpenChange(false)
    toast.success('Advance added!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Add Advance</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Employee *</Label>
            <Select onValueChange={v => setValue('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.status === 'active').map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name} ({e.employeeId})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount (₹) *</Label>
              <Input type="number" placeholder="5000" onChange={e => setValue('amount', Number(e.target.value))} />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input {...register('date')} type="date" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Reason</Label>
            <Input {...register('reason')} placeholder="Medical emergency, etc." />
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Adjust in Month</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Month</Label>
                <Select defaultValue={String(currentMonth())} onValueChange={v => setValue('adjustMonth', Number(v))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Year</Label>
                <Select defaultValue={String(currentYear())} onValueChange={v => setValue('adjustYear', Number(v))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Advance</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
