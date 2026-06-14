'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { SalaryRecord, Employee, CompanySettings } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { MONTHS } from '@/lib/utils'
import { FileDown, FileText, Printer, ChevronDown } from 'lucide-react'
import { generateSalarySlipPDF, generateThermalSalarySlipPDF } from '@/lib/pdf-generator'
import { toast } from 'sonner'

interface SalarySlipModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: SalaryRecord | null
  employee: Employee | null
  settings: CompanySettings | null
}

export function SalarySlipModal({ open, onOpenChange, record, employee, settings }: SalarySlipModalProps) {
  if (!record || !employee || !settings) return null

  const totalEarnings = record.baseSalary + record.bonus
  const totalDeductions = record.leaveDeduction + record.advanceDeduction + record.lateDeduction + record.otherDeductions
  const sym = settings.currencySymbol ?? '₹'

  const handleDownload = async (format: 'pdf' | 'thermal') => {
    try {
      if (format === 'thermal') {
        await generateThermalSalarySlipPDF(record, employee, settings)
      } else {
        await generateSalarySlipPDF(record, employee, settings)
      }
      toast.success('Downloaded!')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Salary Slip</DialogTitle>
        </DialogHeader>

        <div id="salary-slip-print" className="space-y-4">
          {/* Header */}
          <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
            <div className="flex items-start justify-between">
              <div>
                {settings.logoBase64 && (
                  <img src={settings.logoBase64} alt="logo" className="h-10 w-10 rounded object-contain mb-2 bg-white/20 p-1" />
                )}
                <h2 className="text-lg font-bold">{settings.name}</h2>
                {settings.address && <p className="text-xs text-purple-200">{settings.address}</p>}
                {settings.phone && <p className="text-xs text-purple-200">{settings.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">SALARY SLIP</p>
                <p className="text-sm text-purple-200">{MONTHS[record.month - 1]} {record.year}</p>
                <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${record.paid ? 'bg-emerald-400/30 text-emerald-100' : 'bg-amber-400/30 text-amber-100'}`}>
                  {record.paid ? 'PAID' : 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-sm">
            {[
              ['Employee ID', employee.employeeId],
              ['Employee Name', employee.name],
              ['Branch', record.branch],
              ['Mobile', employee.mobile],
              ['Joining Date', employee.joiningDate],
              ['Bank Account', employee.bankAccount ?? '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-slate-500 dark:text-slate-400 text-xs">{label}</span>
                <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
              </div>
            ))}
          </div>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Earnings</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[
                  ['Basic Salary', record.baseSalary],
                  ['Bonus', record.bonus],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between px-3 py-2">
                    <span className="text-slate-600 dark:text-slate-300">{label}</span>
                    <span className="font-medium">{sym}{(val as number).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Total</span>
                  <span>{sym}{totalEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-red-50 dark:bg-red-900/20 px-3 py-2">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Deductions</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {[
                  ['Leave', record.leaveDeduction],
                  ['Advance', record.advanceDeduction],
                  ['Late', record.lateDeduction],
                  ['Other', record.otherDeductions],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between px-3 py-2">
                    <span className="text-slate-600 dark:text-slate-300">{label}</span>
                    <span className="font-medium">{sym}{(val as number).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-red-50 dark:bg-red-900/20 font-semibold text-red-700 dark:text-red-400">
                  <span>Total</span>
                  <span>{sym}{totalDeductions.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="flex items-center justify-between rounded-xl bg-purple-600 px-5 py-3 text-white">
            <span className="font-semibold">Net Salary</span>
            <span className="text-xl font-bold">{sym}{record.finalSalary.toFixed(2)}</span>
          </div>

          <Separator />

          {/* Signature */}
          <div className="flex justify-between text-xs text-slate-400">
            <div>
              <div className="mt-8 border-t border-slate-300 pt-1 w-32">Employee Signature</div>
            </div>
            <div>
              <div className="mt-8 border-t border-slate-300 pt-1 w-32">Employer Signature</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>

          {/* Download dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button className="gap-2">
                <FileDown className="h-4 w-4" />
                Download
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-[60] min-w-[180px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1 text-sm"
                sideOffset={6}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                  onSelect={() => handleDownload('pdf')}
                >
                  <FileText className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium">Standard PDF</p>
                    <p className="text-xs text-slate-400">A4 size salary slip</p>
                  </div>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none"
                  onSelect={() => handleDownload('thermal')}
                >
                  <Printer className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">3-inch Thermal</p>
                    <p className="text-xs text-slate-400">80mm receipt format</p>
                  </div>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
