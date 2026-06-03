'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Employee } from '@/types'
import { fileToBase64, generateEmployeeId } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  dob: z.string().optional(),
  joiningDate: z.string().min(1, 'Joining date is required'),
  branch: z.string().min(1, 'Branch is required'),
  salary: z.number().min(0, 'Salary must be positive'),
  salaryType: z.enum(['monthly', 'daily', 'hourly']),
  shiftType: z.enum(['day', 'night', 'morning', 'evening']),
  paidLeave: z.number().min(0),
  esiNumber: z.string().optional(),
  aadharCard: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits').optional().or(z.literal('')),
  bankAccount: z.string().optional(),
  upiId: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

type FormData = z.infer<typeof schema>

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  employeeCount: number
  onSubmit: (data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function EmployeeForm({ open, onOpenChange, employee, employeeCount, onSubmit }: EmployeeFormProps) {
  const [imageBase64, setImageBase64] = useState<string | undefined>(employee?.imageBase64)
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!employee

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: employee
      ? {
          employeeId: employee.employeeId,
          name: employee.name,
          mobile: employee.mobile,
          dob: employee.dob,
          joiningDate: employee.joiningDate,
          branch: employee.branch,
          salary: employee.salary,
          salaryType: employee.salaryType,
          shiftType: employee.shiftType ?? 'day',
          paidLeave: employee.paidLeave,
          esiNumber: employee.esiNumber,
          aadharCard: employee.aadharCard,
          bankAccount: employee.bankAccount,
          upiId: employee.upiId,
          address: employee.address,
          status: employee.status,
        }
      : {
          employeeId: generateEmployeeId(employeeCount),
          salaryType: 'monthly',
          shiftType: 'day',
          paidLeave: 0,
          status: 'active',
          joiningDate: new Date().toISOString().split('T')[0],
        },
  })

  useEffect(() => {
    if (open) {
      if (employee) {
        reset({
          employeeId: employee.employeeId,
          name: employee.name,
          mobile: employee.mobile,
          dob: employee.dob,
          joiningDate: employee.joiningDate,
          branch: employee.branch,
          salary: employee.salary,
          salaryType: employee.salaryType,
          shiftType: employee.shiftType ?? 'day',
          paidLeave: employee.paidLeave,
          esiNumber: employee.esiNumber,
          aadharCard: employee.aadharCard,
          bankAccount: employee.bankAccount,
          upiId: employee.upiId,
          address: employee.address,
          status: employee.status,
        })
        setImageBase64(employee.imageBase64)
      } else {
        reset({
          employeeId: generateEmployeeId(employeeCount),
          salaryType: 'monthly',
          shiftType: 'day',
          paidLeave: 0,
          status: 'active',
          joiningDate: new Date().toISOString().split('T')[0],
        })
        setImageBase64(undefined)
      }
    }
  }, [open, employee, employeeCount, reset])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    const base64 = await fileToBase64(file)
    setImageBase64(base64)
  }

  const onFormSubmit = (data: FormData) => {
    onSubmit({ ...data, imageBase64 } as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>)
    onOpenChange(false)
    toast.success(isEdit ? 'Employee updated!' : 'Employee added!')
  }

  const nameInitials = (watch('name') ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          {/* Photo */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileRef.current?.click()}>
                <AvatarImage src={imageBase64} />
                <AvatarFallback className="text-xl">{nameInitials || '?'}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white shadow-md hover:bg-purple-700"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Field label="Employee ID" error={errors.employeeId?.message}>
              <Input {...register('employeeId')} placeholder="EMP0001" />
            </Field>
            <Field label="Full Name *" error={errors.name?.message}>
              <Input {...register('name')} placeholder="John Doe" />
            </Field>
            <Field label="Mobile Number *" error={errors.mobile?.message}>
              <Input {...register('mobile')} placeholder="9876543210" maxLength={10} />
            </Field>
            <Field label="Date of Birth" error={errors.dob?.message}>
              <Input {...register('dob')} type="date" />
            </Field>
            <Field label="Joining Date *" error={errors.joiningDate?.message}>
              <Input {...register('joiningDate')} type="date" />
            </Field>
            <Field label="Branch *" error={errors.branch?.message}>
              <Input {...register('branch')} placeholder="Head Office" />
            </Field>
            <Field label="Monthly Salary (₹) *" error={errors.salary?.message}>
              <Input type="number" placeholder="25000" defaultValue={employee?.salary} onChange={e => setValue('salary', Number(e.target.value))} />
            </Field>
            <Field label="Salary Type" error={errors.salaryType?.message}>
              <Select onValueChange={(v) => setValue('salaryType', v as 'monthly' | 'daily' | 'hourly')} defaultValue={watch('salaryType') ?? 'monthly'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Shift Type" error={errors.shiftType?.message}>
              <Select onValueChange={(v) => setValue('shiftType', v as 'day' | 'night' | 'morning' | 'evening')} defaultValue={employee?.shiftType ?? 'day'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">🌤️ Day</SelectItem>
                  <SelectItem value="night">🌙 Night</SelectItem>
                  <SelectItem value="morning">🌅 Morning</SelectItem>
                  <SelectItem value="evening">🌆 Evening</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Paid Leave Days" error={errors.paidLeave?.message}>
              <Input type="number" placeholder="0" min={0} defaultValue={employee?.paidLeave ?? 0} onChange={e => setValue('paidLeave', Number(e.target.value))} />
            </Field>
            <Field label="ESI Number" error={errors.esiNumber?.message}>
              <Input {...register('esiNumber')} placeholder="Optional" />
            </Field>
            <Field label="Aadhar Card Number" error={errors.aadharCard?.message}>
              <Input {...register('aadharCard')} placeholder="12-digit Aadhar number" maxLength={12} />
            </Field>
            <Field label="Bank Account (Optional)" error={errors.bankAccount?.message}>
              <Input {...register('bankAccount')} placeholder="Account number" />
            </Field>
            <Field label="UPI ID" error={errors.upiId?.message}>
              <Input {...register('upiId')} placeholder="name@upi" />
            </Field>
            <Field label="Status" error={errors.status?.message}>
              <Select onValueChange={(v) => setValue('status', v as 'active' | 'inactive')} defaultValue={watch('status') ?? 'active'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Address" error={errors.address?.message}>
              <Input {...register('address')} placeholder="Full address" className="col-span-2" />
            </Field>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? 'Update Employee' : 'Add Employee'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
