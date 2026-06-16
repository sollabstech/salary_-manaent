'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, LogOut, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import type { AuthSession } from '@/types'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employee Management',
  '/branches':  'Branch Management',
  '/attendance': 'Attendance',
  '/salary': 'Salary Management',
  '/advances': 'Advance Management',
  '/payments': 'Payments & Cash',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/admin': 'Admin Panel',
}

interface NavbarProps {
  collapsed: boolean
  onMobileMenuOpen: () => void
  session: AuthSession | null
  onLogout: () => void
}

export function Navbar({ collapsed, onMobileMenuOpen, session, onLogout }: NavbarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { settings } = useSettings()

  const title    = Object.entries(pageTitles).find(([k]) => pathname === k || pathname.startsWith(k + '/'))?.[1] ?? 'Dashboard'
  const initials = session?.username?.slice(0, 2).toUpperCase() ?? 'AD'
  const isAdmin  = session?.role === 'admin'

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

        {/* User badge */}
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
            isAdmin
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
          }`}>
            {isAdmin ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{session?.username ?? 'Admin'}</p>
            <p className="text-[10px] text-slate-400 capitalize leading-tight">{session?.role ?? 'admin'}</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
