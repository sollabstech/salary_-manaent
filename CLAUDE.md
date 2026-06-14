# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

> ⚠️ This runs **Next.js 16.2.7** with breaking changes vs older versions. Read `node_modules/next/dist/docs/` before writing any Next.js code. Heed deprecation notices.

---

## Commands

```bash
npm run dev      # http://localhost:3000
npm run build    # production build — must pass (zero TS errors) before any commit
npm run lint     # eslint
npm run start    # serve production build
```

No tests are configured. TypeScript strict mode is the primary correctness check — `npm run build` is the gate.

---

## Architecture

**Fully offline, localStorage-only.** No backend, no API routes, no database. All data lives in the browser under `sep_*` keys.

Data flows in one direction:

```
services/ (pure LS CRUD)  →  hooks/ (React state + refresh)  →  app/pages + components
```

- **`services/`** — synchronous CRUD against `localStorage`. No React. Each domain has its own service (`employeeService`, `salaryService`, etc.) built on `storageGet<T>` / `storageSet` from `services/storage.ts`.
- **`hooks/`** — wrap services with `useState` + `useEffect`. Always call `refresh()` after any mutation. All hooks are `'use client'`.
- **`app/` pages** — all `'use client'`. Consume hooks and compose feature components. `app/page.tsx` just redirects to `/dashboard`.
- **`types/index.ts`** — single source of truth for all shared interfaces. Never duplicate type definitions.
- **`lib/salary-calculator.ts`** — pure functions, no React, no storage. All salary math lives here.

---

## Salary Formula

```
perDaySalary   = baseSalary / workingDaysPerMonth   (default 30)
leaveDeduction = perDay × (absentDays + halfDays × 0.5)
finalSalary    = baseSalary − leaveDeduction − advanceDeduction
                           − lateDeduction − otherDeductions + bonus
                 (clamped to ≥ 0)
```

Key functions in `lib/salary-calculator.ts`:
- `calculateLeaveDeduction(salary, absent, halfdays, workingDays)`
- `calculateFinalSalary({ baseSalary, leaveDeduction, advanceDeduction, bonus, otherDeductions, lateDeduction })`
- `getAttendanceSummary(records, month, year)` → `{ present, absent, halfday, late, overtime, leave }`
- `getPendingAdvanceForMonth(advances, employeeId, month, year)` → number

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16.2.7, App Router, React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS **v4** — `@import "tailwindcss"` in globals.css, **no `tailwind.config.ts`** |
| Dark mode | `next-themes` + `@custom-variant dark (&:where(.dark, .dark *))` in globals.css |
| UI primitives | Radix UI |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` |
| PDF | `jspdf` + `jspdf-autotable` |
| Excel | `xlsx` |
| Charts | `recharts` |
| Toasts | `sonner` |
| Animations | `framer-motion` |
| Icons | `lucide-react` |

---

## Critical Patterns

### Adding a new page
1. Create `app/[route]/page.tsx` with `'use client'` at top
2. Add to `navItems` in `components/layout/Sidebar.tsx`
3. Add to `pageTitles` map in `components/layout/Navbar.tsx`

### Adding a new field to Employee
1. Add to `types/index.ts` (optional fields use `?`)
2. Add zod schema line in `EmployeeForm.tsx`
3. Add input in form JSX — update **both** `defaultValues` blocks and **both** `reset()` calls in `useEffect`
4. Show in `EmployeeDetailModal.tsx`
5. Add to Excel export mapping in `app/employees/page.tsx`

### Domain hook usage
```tsx
const { employees, loading, add, update, remove } = useEmployees()
const { records, upsert, markPaid } = useSalary()
const { records: advances, add: addAdvance, markAdjusted } = useAdvances()
const { settings, update: updateSettings } = useSettings()
```

### PDF / Excel — always dynamic import (SSR guard)
```tsx
await generateSalarySlipPDF(record, employee, settings)   // lib/pdf-generator.ts
// internally does: const { jsPDF } = await import('jspdf')
```

### Toast
```tsx
import { toast } from 'sonner'
toast.success('Saved!')
toast.error('Something went wrong')
```

---

## Gotchas

| Situation | Fix |
|---|---|
| `localStorage` on server | All hooks + pages use `'use client'`; services guard with `typeof window === 'undefined'` |
| `jsPDF` / `xlsx` SSR crash | Always `await import('jspdf')` / `await import('xlsx')` inside async functions — never top-level |
| Dark mode flash | Root `<html>` has `suppressHydrationWarning` — required by `next-themes` |
| Zod number fields in strict mode | Use `z.number()` + controlled `onChange={e => setValue('field', Number(e.target.value))}` — **never** `z.coerce.number()`, it breaks resolver types |
| Recharts formatter TS error | Cast inside formatter: `formatter={(value) => [formatCurrency(Number(value)), '']}` — do not type the `value` parameter |
| `@radix-ui/react-badge` | Not installed — use `components/ui/badge.tsx` |
| Tailwind config | Does NOT exist — v4 is configured entirely in `globals.css` via `@theme` and `@custom-variant` |
| Styling utilities | Use `cn()` from `@/lib/utils` for conditional classes; `.glass` utility is defined in globals.css |
| z-index layers | sidebar 30, mobile overlay 40, mobile sidebar 50, modal 50 |

---

## Styling Conventions

- Primary action colour: `purple-600`
- Sidebar: `bg-gradient-to-b from-indigo-950 to-purple-950` with white text
- Dark mode: `dark:` prefix works everywhere via `@custom-variant dark` in globals.css
- `DialogContent` accepts a `size` prop: `sm | md | lg | xl`
- `Button` variants: `default | destructive | outline | secondary | ghost | link | success`
- `Badge` variants: `default | secondary | destructive | outline | success | warning | info`
