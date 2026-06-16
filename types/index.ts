export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  mobile: string;
  dob: string;
  joiningDate: string;
  branch: string;
  salary: number;
  salaryType: 'monthly' | 'daily' | 'hourly';
  shiftType: 'day' | 'night' | 'morning' | 'evening';
  paidLeave: number;
  esiNumber?: string;
  aadharCard?: string;
  bankAccount?: string;
  upiId?: string;
  address?: string;
  status: 'active' | 'inactive';
  imageBase64?: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'halfday' | 'late' | 'overtime' | 'leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  branch: string;
  baseSalary: number;
  shiftDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  paidLeaveAllowed: number;
  extraLeaveDays: number;
  overtimeDays: number;
  lateDeduction: number;
  leaveDeduction: number;
  advanceDeduction: number;
  bonus: number;
  otherDeductions: number;
  finalSalary: number;
  cashPayment: number;
  bankPayment: number;
  paid: boolean;
  paidDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdvanceStatus = 'pending' | 'adjusted' | 'partial';

export interface AdvanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  reason?: string;
  adjustMonth?: number;
  adjustYear?: number;
  status: AdvanceStatus;
  adjustedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string
  name: string
  address?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface TreasuryData {
  bankBalance: number
  cashInHand: number
  updatedAt: string
}

export interface UserPermissions {
  dashboard: boolean
  employees: boolean
  attendance: boolean
  salary: boolean
  advances: boolean
  payments: boolean
  reports: boolean
  settings: boolean
}

export interface AuthUser {
  id: string
  username: string
  password: string
  role: 'admin' | 'user'
  permissions: UserPermissions
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  userId: string
  username: string
  role: 'admin' | 'user'
  permissions: UserPermissions
  loginAt: string
}

export interface CompanySettings {
  name: string;
  logoBase64?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  currencySymbol: string;
  themeMode: 'light' | 'dark' | 'system';
  lateDeductionAmount: number;
  workingDaysPerMonth: number;
}
