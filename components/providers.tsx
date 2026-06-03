'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg text-slate-900 dark:text-slate-100',
            success: 'border-emerald-200 dark:border-emerald-800',
            error: 'border-red-200 dark:border-red-800',
          },
        }}
      />
    </ThemeProvider>
  )
}
