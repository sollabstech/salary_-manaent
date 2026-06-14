'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, CalendarCheck, DollarSign,
  CreditCard, FileBarChart, Settings, ChevronLeft,
  ChevronRight, Building2, X, Wallet, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import type { AuthSession, UserPermissions } from '@/types'

type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  permKey?: keyof UserPermissions
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/employees', label: 'Employees',   icon: Users,         permKey: 'employees'  },
  { href: '/attendance',label: 'Attendance',  icon: CalendarCheck, permKey: 'attendance' },
  { href: '/salary',    label: 'Salary',      icon: DollarSign,    permKey: 'salary'     },
  { href: '/advances',  label: 'Advances',    icon: CreditCard,    permKey: 'advances'   },
  { href: '/payments',  label: 'Payments',    icon: Wallet,        permKey: 'payments'   },
  { href: '/reports',   label: 'Reports',     icon: FileBarChart,  permKey: 'reports'    },
  { href: '/settings',  label: 'Settings',    icon: Settings,      permKey: 'settings'   },
  { href: '/admin',     label: 'Admin Panel', icon: ShieldCheck,   adminOnly: true       },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  session: AuthSession | null
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, session }: SidebarProps) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly) return session?.role === 'admin'
    if (!item.permKey)  return true                                     // dashboard — always shown
    if (session?.role === 'admin') return true                          // admin sees all
    return session?.permissions[item.permKey] ?? false
  })

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              key="full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/30">
                <Building2 className="h-4 w-4 text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">SEP Salary</p>
                <p className="text-[10px] text-purple-300 leading-tight">Shop</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="icon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 border border-purple-400/30 mx-auto"
            >
              <Building2 className="h-4 w-4 text-purple-300" />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onToggle}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-purple-300 hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          const isAdmin = item.adminOnly
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                active
                  ? isAdmin
                    ? 'bg-amber-500/20 text-amber-200 shadow-sm'
                    : 'bg-purple-600 text-white shadow-sm shadow-purple-900/30'
                  : 'text-purple-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 shrink-0',
                active
                  ? isAdmin ? 'text-amber-300' : 'text-white'
                  : 'text-purple-300 group-hover:text-white'
              )} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Footer — show logged in user */}
      {!collapsed && session && (
        <div className="p-4 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
              session.role === 'admin'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-purple-500/20 text-purple-300'
            )}>
              {session.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{session.username}</p>
              <p className="text-[10px] text-purple-400 capitalize">{session.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col fixed left-0 top-0 h-full z-30 bg-gradient-to-b from-indigo-950 to-purple-950 border-r border-white/10 shadow-xl"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 z-50 bg-gradient-to-b from-indigo-950 to-purple-950 border-r border-white/10 shadow-2xl md:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={onMobileClose} className="text-purple-300 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
