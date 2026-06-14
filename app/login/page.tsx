'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Building2, Eye, EyeOff, ShieldCheck, User, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginUser } from '@/services/authService'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole]         = useState<'admin' | 'user'>('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.')
      return
    }
    setLoading(true)
    setError('')

    const session = loginUser(username.trim(), password)
    setLoading(false)

    if (!session) {
      setError('Invalid username or password.')
      return
    }
    if (session.role !== role) {
      setError(`This account is not a ${role} account.`)
      // Still log them out so session isn't kept
      import('@/services/authService').then(m => m.logoutUser())
      return
    }

    toast.success(`Welcome back, ${session.username}!`)
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-400/30">
                <Building2 className="h-7 w-7 text-purple-300" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SEP Salary Shop</h1>
              <p className="text-sm text-purple-300">Payroll Management System</p>
            </div>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/5 p-1">
            <button
              onClick={() => { setRole('admin'); setError('') }}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                role === 'admin'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </button>
            <button
              onClick={() => { setRole('user'); setError('') }}
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                role === 'user'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-300 hover:text-white'
              }`}
            >
              <User className="h-4 w-4" />
              User
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-purple-300">Username</label>
              <Input
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder={role === 'admin' ? 'admin' : 'Enter username'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-purple-300">Password</label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-purple-400 focus:ring-purple-400/20 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium gap-2"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Logging in…' : 'Login'}
            </Button>
          </div>

        </div>

        <p className="text-center text-[11px] text-purple-600 mt-4">
          Fully Offline & Secure · SEP Salary Shop v1.0
        </p>
      </motion.div>
    </div>
  )
}
