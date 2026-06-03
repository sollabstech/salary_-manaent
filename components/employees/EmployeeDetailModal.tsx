'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Employee } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Phone, Calendar, MapPin, Building2, CreditCard, Smartphone, Hash, ShieldCheck } from 'lucide-react'

interface EmployeeDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee | null
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
        <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}

export function EmployeeDetailModal({ open, onOpenChange, employee }: EmployeeDetailModalProps) {
  if (!employee) return null

  const initials = employee.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Employee Profile</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-4">
          <Avatar className="h-16 w-16 ring-2 ring-purple-200 dark:ring-purple-800">
            <AvatarImage src={employee.imageBase64} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{employee.name}</h3>
              <Badge variant={employee.status === 'active' ? 'success' : 'secondary'}>
                {employee.status}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{employee.employeeId} · {employee.branch}</p>
            <p className="mt-1 text-base font-semibold text-purple-600 dark:text-purple-400">
              {formatCurrency(employee.salary)}/month
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow icon={Phone} label="Mobile" value={employee.mobile} />
          <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(employee.dob)} />
          <InfoRow icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
          <InfoRow icon={Building2} label="Branch" value={employee.branch} />
          <InfoRow icon={Hash} label="Shift Type" value={
            employee.shiftType === 'day' ? '🌤️ Day Shift' :
            employee.shiftType === 'night' ? '🌙 Night Shift' :
            employee.shiftType === 'morning' ? '🌅 Morning Shift' :
            '🌆 Evening Shift'
          } />
          <InfoRow icon={Calendar} label="Paid Leave" value={`${employee.paidLeave} days`} />
          <InfoRow icon={Hash} label="ESI Number" value={employee.esiNumber} />
          <InfoRow icon={ShieldCheck} label="Aadhar Card" value={
            employee.aadharCard
              ? employee.aadharCard.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
              : undefined
          } />
          <InfoRow icon={CreditCard} label="Bank Account (Optional)" value={employee.bankAccount} />
          <InfoRow icon={Smartphone} label="UPI ID" value={employee.upiId} />
          <InfoRow icon={MapPin} label="Address" value={employee.address} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
