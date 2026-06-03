# SEP Salary Shop — Smart Payroll & Staff Management System

A modern, fully offline payroll and staff management web app built with Next.js 16, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** — Stats, salary charts, attendance summary, quick actions
- **Employee Management** — Add/edit/delete employees, photo upload, Aadhar card, shift type (Day/Night/Morning/Evening)
- **Attendance** — Daily marking (Present/Absent/Half Day/Late/Overtime/Leave), monthly calendar view
- **Salary** — Auto-generate from attendance & advances, editable table, PDF salary slips, mark paid
- **Advances** — Track advances, adjust against salary months
- **Reports** — Employee, salary, attendance, advance reports with PDF & Excel export
- **Settings** — Company info, logo, dark mode, JSON backup/restore

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Framer Motion |
| UI | Radix UI + custom components |
| Charts | Recharts |
| Export | jsPDF + jspdf-autotable + xlsx |
| Storage | Browser LocalStorage (fully offline) |
| Forms | React Hook Form + Zod |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to the dashboard automatically.

## No Backend Required

All data is stored locally in the browser's `localStorage`. No server, no database, no Firebase. Works completely offline.

## Data Backup

Go to **Settings → Data Management → Download Backup** to export all data as a JSON file. Restore it anytime from the same page.
