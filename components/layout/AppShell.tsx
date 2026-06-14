'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { getSession, logoutUser } from '@/services/authService'
import type { AuthSession, UserPermissions } from '@/types'

const routePermissionMap: Partial<Record<string, keyof UserPermissions>> = {
  '/employees': 'employees',
  '/attendance': 'attendance',
  '/salary':     'salary',
  '/advances':   'advances',
  '/payments':   'payments',
  '/reports':    'reports',
  '/settings':   'settings',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [session,     setSession]     = useState<AuthSession | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const s = getSession()
    setSession(s)
    setAuthChecked(true)

    if (!s) {
      if (pathname !== '/login') router.replace('/login')
      return
    }

    // Already logged in and trying to visit login
    if (pathname === '/login') { router.replace('/dashboard'); return }

    // Admin-only route
    if (pathname === '/admin' && s.role !== 'admin') { router.replace('/dashboard'); return }

    // Permission-gated routes
    const permKey = routePermissionMap[pathname]
    if (permKey && s.role !== 'admin' && !s.permissions[permKey]) {
      router.replace('/dashboard')
    }
  }, [pathname, router])

  const handleLogout = () => {
    logoutUser()
    setSession(null)
    router.replace('/login')
  }

  // Login page — render without any shell chrome
  if (pathname === '/login') {
    return <>{children}</>
  }

  // Not yet checked / no session → show spinner while redirect fires
  if (!authChecked || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        session={session}
      />
      <Navbar
        collapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
        session={session}
        onLogout={handleLogout}
      />
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
