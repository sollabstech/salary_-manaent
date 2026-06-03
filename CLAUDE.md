# SEP Salary Shop — CLAUDE.md

> ⚠️ This runs **Next.js 16.2.7** with breaking changes vs older versions. See `node_modules/next/dist/docs/` if anything behaves unexpectedly.

---

## Quick Reference

```
npm run dev    → http://localhost:3000
npm run build  → production build (must pass before shipping)
```

All pages redirect from `/` → `/dashboard`. No backend, no API, no Firebase.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16.2.7, App Router, React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS **v4** — `@import "tailwindcss"`, NO `tailwind.config.ts` |
| Dark mode | `next-themes` with `attribute="class"` + `@custom-variant dark (&:where(.dark, .dark *))` in globals.css |
| UI primitives | Radix UI (dialog, select, tabs, switch, avatar, separator, etc.) |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` |
| Animations | `framer-motion` |
| Charts | `recharts` |
| Toasts | `sonner` — `import { toast } from 'sonner'`, `<Toaster />` in Providers |
| PDF | `jspdf` + `jspdf-autotable` — always **dynamic import** (`await import('jspdf')`) |
| Excel | `xlsx` — always **dynamic import** (`await import('xlsx')`) |
| Icons | `lucide-react` |
| Storage | Browser `localStorage` only — no IndexedDB |

---

## Project Structure

```
app/                        ← Next.js App Router pages (all "use client")
  layout.tsx                ← Server component: Geist font + <Providers> + <AppShell>
  page.tsx                  ← redirect('/dashboard')
  dashboard/page.tsx
  employees/page.tsx
  attendance/page.tsx
  salary/page.tsx
  advances/page.tsx
  reports/page.tsx
  settings/page.tsx

components/
  providers.tsx             ← ThemeProvider + Toaster (client)
  layout/
    AppShell.tsx            ← collapsed state + wraps Sidebar + Navbar + <main>
    Sidebar.tsx             ← dark indigo gradient, Framer Motion collapse, mobile overlay
    Navbar.tsx              ← sticky, page title, dark mode toggle
  dashboard/
    StatCard.tsx            ← animated metric card (color prop: purple|blue|emerald|amber|red)
    SalaryChart.tsx         ← recharts BarChart (paid vs pending, last 6 months)
    AttendanceChart.tsx     ← recharts PieChart (this month summary)
    QuickActions.tsx        ← 4 colored buttons → navigate to pages
  employees/
    EmployeeForm.tsx        ← add/edit modal, zod validation, photo upload → base64
    EmployeeTable.tsx       ← paginated table with badges and action buttons
    EmployeeDetailModal.tsx ← read-only profile view
  salary/
    SalaryGeneratePanel.tsx ← month/year/branch selectors
    SalaryTable.tsx         ← editable inline fields, real-time net salary
    SalarySlipModal.tsx     ← preview slip + PDF download button
  attendance/
    AttendanceTable.tsx     ← per-employee status select, bulk save
    AttendanceCalendar.tsx  ← colour-coded calendar grid per employee
  advances/
    AdvanceForm.tsx         ← modal form
    AdvanceTable.tsx        ← with mark-adjusted + delete
  reports/
    ReportFilters.tsx       ← month/year/branch/employee selectors + PDF/Excel buttons
  ui/                       ← custom shadcn-style components (see list below)

hooks/                      ← all "use client", wrap services with useState/useEffect
  useEmployees.ts
  useAttendance.ts
  useSalary.ts
  useAdvances.ts
  useSettings.ts
  useLocalStorage.ts        ← generic typed hook (less used; prefer domain hooks)

services/                   ← pure LocalStorage CRUD, no React
  storage.ts                ← storageGet<T>, storageSet, exportAllData, importAllData
  employeeService.ts
  attendanceService.ts
  salaryService.ts
  advanceService.ts
  settingsService.ts

lib/
  utils.ts                  ← cn(), formatCurrency(), generateId(), MONTHS, YEARS, etc.
  salary-calculator.ts      ← pure calc functions (no React, no storage)
  pdf-generator.ts          ← generateSalarySlipPDF(), generatePayrollReportPDF()

utils/
  date-helpers.ts           ← todayISO(), currentMonth(), currentYear(), formatMonthYear()
  export-excel.ts           ← exportToExcel(), exportMultiSheetExcel()

types/
  index.ts                  ← ALL shared interfaces (single source of truth)
```

---

## TypeScript Types (types/index.ts)

```ts
Employee {
  id, employeeId, name, mobile, dob, joiningDate,
  branch, salary: number, salaryType: 'monthly'|'daily'|'hourly',
  shiftType: 'day'|'night'|'morning'|'evening',
  paidLeave: number, esiNumber?, aadharCard?, bankAccount?,
  upiId?, address?, status: 'active'|'inactive',
  imageBase64?, createdAt, updatedAt
}

AttendanceRecord { id, employeeId, date: 'YYYY-MM-DD', status: AttendanceStatus, note?, createdAt }
AttendanceStatus = 'present'|'absent'|'halfday'|'late'|'overtime'|'leave'

SalaryRecord {
  id, employeeId, employeeName, month: 1-12, year, branch,
  baseSalary, shiftDays, presentDays, absentDays, halfDays,
  leaveDays, overtimeDays, lateDeduction, leaveDeduction,
  advanceDeduction, bonus, otherDeductions, finalSalary,
  paid: boolean, paidDate?, remarks?, createdAt, updatedAt
}

AdvanceRecord {
  id, employeeId, employeeName, amount, date,
  reason?, adjustMonth?, adjustYear?,
  status: 'pending'|'adjusted'|'partial', adjustedAmount,
  createdAt, updatedAt
}

CompanySettings {
  name, logoBase64?, address?, phone?, email?, website?,
  currency, currencySymbol, themeMode: 'light'|'dark'|'system',
  lateDeductionAmount, workingDaysPerMonth
}
```

---

## LocalStorage Keys

All prefixed `sep_` by `services/storage.ts`:

| Key | Type | Service |
|---|---|---|
| `sep_employees` | `Employee[]` | employeeService |
| `sep_attendance` | `AttendanceRecord[]` | attendanceService |
| `sep_salary_records` | `SalaryRecord[]` | salaryService |
| `sep_advance_records` | `AdvanceRecord[]` | advanceService |
| `sep_settings` | `CompanySettings` | settingsService |

Backup/restore via `exportAllData()` / `importAllData()` in `services/storage.ts`.

---

## Salary Formula (lib/salary-calculator.ts)

```
perDaySalary   = monthlySalary / workingDaysPerMonth   (default 30)
leaveDeduction = perDay × (absentDays + halfDays × 0.5)
finalSalary    = baseSalary − leaveDeduction − advanceDeduction
                           − lateDeduction − otherDeductions + bonus
                 (clamped to ≥ 0)
```

Key functions:
- `calculateLeaveDeduction(salary, absent, halfdays, workingDays)`
- `calculateFinalSalary({ baseSalary, leaveDeduction, advanceDeduction, bonus, otherDeductions, lateDeduction })`
- `getAttendanceSummary(records, month, year)` → `{ present, absent, halfday, late, overtime, leave }`
- `getPendingAdvanceForMonth(advances, employeeId, month, year)` → number

---

## UI Component Library (components/ui/)

| Component | Key props / notes |
|---|---|
| `Button` | `variant`: default\|destructive\|outline\|secondary\|ghost\|link\|success · `size`: default\|sm\|lg\|icon\|xs |
| `Card` | + `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Dialog` | + `DialogContent` has `size` prop: sm\|md\|lg\|xl |
| `Input` | Standard HTML input, purple focus ring |
| `Select` | Radix-based · `SelectTrigger`, `SelectContent`, `SelectItem` |
| `Badge` | `variant`: default\|secondary\|destructive\|outline\|success\|warning\|info |
| `Table` | + `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| `Tabs` | + `TabsList`, `TabsTrigger`, `TabsContent` |
| `Avatar` | + `AvatarImage`, `AvatarFallback` |
| `Switch` | Radix-based toggle |
| `Separator` | `orientation`: horizontal\|vertical |
| `Skeleton` | Pulse animation placeholder |
| `EmptyState` | `icon`, `title`, `description`, `action` |
| `SearchInput` | `<Input>` with prepended search icon |
| `ConfirmDialog` | `open`, `onConfirm`, `variant`: destructive\|default |
| `Pagination` | `page`, `totalPages`, `onPageChange`, `totalItems`, `pageSize` |

---

## Styling Rules

- **Tailwind v4**: Use `bg-slate-50`, `text-purple-600`, `dark:bg-slate-900` etc. directly — no CSS variable tokens needed in JSX
- **Dark mode**: `dark:` prefix works because `@custom-variant dark` is defined in `globals.css`
- **Glassmorphism**: use utility class `.glass` (defined in globals.css)
- **Sidebar**: `bg-gradient-to-b from-indigo-950 to-purple-950` with white text
- **Primary action colour**: `purple-600` (buttons, active nav, charts, stat card accents)
- **`cn()` helper**: always use for conditional classes — `import { cn } from '@/lib/utils'`
- **z-index layers**: sidebar 30, mobile overlay 40, mobile sidebar 50, modal 50

---

## Patterns to Follow

### Adding a new field to Employee
1. Add to `types/index.ts` (optional fields use `?`)
2. Add zod schema line in `EmployeeForm.tsx` — use `z.string().optional()` not `z.coerce.*` (coerce breaks resolver types with strict mode)
3. Add `register` or controlled input in the form JSX
4. Add to both `defaultValues` blocks AND both `reset()` calls in `useEffect`
5. Show in `EmployeeDetailModal.tsx`
6. Add to Excel export mapping in `app/employees/page.tsx`

### Adding a new page
1. Create `app/[route]/page.tsx` with `'use client'` at top
2. Add to `navItems` array in `components/layout/Sidebar.tsx`
3. Add to `pageTitles` map in `components/layout/Navbar.tsx`

### Using a domain hook
```tsx
const { employees, loading, add, update, remove } = useEmployees()
const { records, upsert, markPaid } = useSalary()
const { records: advances, add: addAdvance, markAdjusted } = useAdvances()
const { settings, update: updateSettings } = useSettings()
```

### Toast notifications
```tsx
import { toast } from 'sonner'
toast.success('Saved!')
toast.error('Something went wrong')
```

### PDF generation (always async, always dynamic import)
```tsx
const handleDownload = async () => {
  try {
    await generateSalarySlipPDF(record, employee, settings)
    toast.success('PDF downloaded!')
  } catch {
    toast.error('PDF generation failed')
  }
}
```

### Form number fields with strict zod
```tsx
// ✅ Correct — use z.number() and controlled onChange
salary: z.number().min(0)
// in JSX:
<Input type="number" onChange={e => setValue('salary', Number(e.target.value))} />

// ❌ Wrong — z.coerce.number() breaks TypeScript resolver types in strict mode
```

### Recharts formatter types
```tsx
// ✅ Correct — cast value, don't type the parameter
formatter={(value) => [formatCurrency(Number(value)), '']}

// ❌ Wrong — TypeScript rejects typed value parameter
formatter={(value: number) => ...}
```

---

## Common Gotchas

| Situation | Fix |
|---|---|
| `localStorage` accessed on server | All hooks + pages use `'use client'`; services check `typeof window === 'undefined'` |
| `jsPDF` / `xlsx` SSR errors | Always use `await import('jspdf')` / `await import('xlsx')` inside async functions |
| Dark mode flash | Root `<html>` has `suppressHydrationWarning` — required for `next-themes` |
| Zod + react-hook-form number fields | Use `z.number()` not `z.coerce.number()` + controlled `onChange` with `setValue` |
| Recharts tooltip formatter types | Cast `value` to `Number(value)` inside formatter, don't annotate parameter type |
| `tailwind.config.ts` | Does NOT exist — Tailwind v4 is configured purely in `globals.css` via `@theme` and `@custom-variant` |
| Adding dark mode styles | Use `dark:` prefix on Tailwind classes — works because of `@custom-variant dark` |
| `@radix-ui/react-badge` | Not installed — use custom `Badge` from `components/ui/badge.tsx` |

---

## Key Constants (lib/utils.ts)

```ts
MONTHS       // ['January', ..., 'December']
MONTH_SHORT  // ['Jan', ..., 'Dec']
YEARS        // 10-year array centred on current year
CURRENT_YEAR // new Date().getFullYear()

generateId()            // timestamp + random string
generateEmployeeId(n)   // 'EMP0001', 'EMP0002', ...
formatCurrency(n)       // '₹25,000.00'
formatDate(isoStr)      // '01 Jan 2026'
fileToBase64(file)      // Promise<string> — for image uploads
```

---

## Build Checklist

Before committing any change:
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] All new Employee fields added to: type, form schema, form JSX (both defaultValues + reset), detail modal, Excel export
- [ ] New services use `storageGet` / `storageSet` with `sep_` prefix
- [ ] New hooks are `'use client'` and call `refresh()` after mutations
- [ ] Browser-only libraries (jsPDF, xlsx) use dynamic imports
- [ ] Recharts formatters don't type their `value` parameter
