'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/attendance': 'Attendance',
  '/salary': 'Salary Management',
  '/advances': 'Advance Management',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

interface NavbarProps {
  collapsed: boolean
  onMobileMenuOpen: () => void
}

export function Navbar({ collapsed, onMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { settings } = useSettings()

  const title = Object.entries(pageTitles).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'Dashboard'

  return (
    <header
      className="fixed top-0 right-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 md:px-6 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/80"
      style={{ left: collapsed ? 64 : 240, transition: 'left 0.3s ease' }}
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuOpen}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            {settings?.name ?? 'SEP Salary Shop'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-semibold">
          AD
        </div>
      </div>
    </header>
  )
}
