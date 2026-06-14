'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Plus, Trash2, Edit2, Key, Users,
  Check, X, Eye, EyeOff, Smartphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useAuthUsers } from '@/hooks/useAuthUsers'
import { changeAdminPassword, ADMIN_PHONE, STATIC_OTP, EMPTY_PERMISSIONS } from '@/services/authService'
import type { UserPermissions } from '@/types'
import { toast } from 'sonner'

const PERM_LABELS: { key: keyof UserPermissions; label: string }[] = [
  { key: 'dashboard',  label: 'Dashboard'  },
  { key: 'employees',  label: 'Employees'  },
  { key: 'attendance', label: 'Attendance' },
  { key: 'salary',     label: 'Salary'     },
  { key: 'advances',   label: 'Advances'   },
  { key: 'payments',   label: 'Payments'   },
  { key: 'reports',    label: 'Reports'    },
  { key: 'settings',   label: 'Settings'   },
]

const maskedPhone = ADMIN_PHONE.replace(/(\d{4})(\d{4})(\d{3})/, '$1****$3')

// ── Permissions editor ─────────────────────────────────────────────────────────
function PermEditor({
  perms, onChange,
}: { perms: UserPermissions; onChange: (p: UserPermissions) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PERM_LABELS.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={perms[key]}
            onChange={e => onChange({ ...perms, [key]: e.target.checked })}
            className="h-4 w-4 rounded accent-purple-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
        </label>
      ))}
    </div>
  )
}

// ── Add User Dialog ────────────────────────────────────────────────────────────
function AddUserDialog({
  open, onOpenChange, onAdd,
}: { open: boolean; onOpenChange: (v: boolean) => void; onAdd: (username: string, password: string, perms: UserPermissions) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [perms, setPerms] = useState<UserPermissions>({ ...EMPTY_PERMISSIONS })

  const reset = () => { setUsername(''); setPassword(''); setPerms({ ...EMPTY_PERMISSIONS }) }

  const handleSubmit = () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Username and password are required.'); return
    }
    onAdd(username.trim(), password, perms)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent size="md">
        <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Username</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. john" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Password</label>
            <div className="relative">
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Permissions</label>
            <PermEditor perms={perms} onChange={setPerms} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} className="gap-2"><Plus className="h-4 w-4" />Add User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Permissions Dialog ────────────────────────────────────────────────────
function EditPermsDialog({
  open, onOpenChange, username, initPerms, onSave,
}: { open: boolean; onOpenChange: (v: boolean) => void; username: string; initPerms: UserPermissions; onSave: (p: UserPermissions) => void }) {
  const [perms, setPerms] = useState<UserPermissions>(initPerms)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader><DialogTitle>Edit Permissions — {username}</DialogTitle></DialogHeader>
        <PermEditor perms={perms} onChange={setPerms} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(perms); onOpenChange(false) }} className="gap-2">
            <Check className="h-4 w-4" />Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Change Password Dialog (OTP flow) ─────────────────────────────────────────
function ChangePasswordDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<'send' | 'verify' | 'set'>('send')
  const [otpInput, setOtpInput]   = useState('')
  const [otpError, setOtpError]   = useState('')
  const [newPass, setNewPass]     = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showNew, setShowNew]     = useState(false)
  const [otpSent, setOtpSent]     = useState(false)

  const reset = () => {
    setStep('send'); setOtpInput(''); setOtpError('')
    setNewPass(''); setConfirm(''); setOtpSent(false)
  }

  const handleSendOTP = () => { setOtpSent(true); setStep('verify') }

  const handleVerify = () => {
    if (otpInput.trim() === STATIC_OTP) {
      setOtpError(''); setStep('set')
    } else {
      setOtpError('Incorrect OTP. Please try again.')
    }
  }

  const handleChangePassword = () => {
    if (!newPass.trim()) { toast.error('Password cannot be empty.'); return }
    if (newPass !== confirm) { toast.error('Passwords do not match.'); return }
    if (newPass.length < 6) { toast.error('Password must be at least 6 characters.'); return }
    changeAdminPassword(newPass)
    toast.success('Admin password changed successfully!')
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4 text-purple-600" />
            Change Admin Password
          </DialogTitle>
        </DialogHeader>

        {step === 'send' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
              <Smartphone className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Registered Mobile</p>
                <p className="text-xs text-slate-500">{maskedPhone}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An OTP will be sent to the registered mobile number for verification.
            </p>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            {otpSent && (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-300">
                OTP sent to {maskedPhone}
                <span className="ml-2 font-mono font-bold">(Test OTP: {STATIC_OTP})</span>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Enter OTP</label>
              <Input
                value={otpInput}
                onChange={e => { setOtpInput(e.target.value); setOtpError('') }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="6-digit OTP"
                maxLength={6}
                className="tracking-widest text-center font-mono text-lg"
              />
              {otpError && <p className="text-xs text-red-500">{otpError}</p>}
            </div>
          </div>
        )}

        {step === 'set' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" /> OTP verified successfully
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">New Password</label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Confirm Password</label>
              <Input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
            <X className="h-4 w-4 mr-1" />Cancel
          </Button>
          {step === 'send' && (
            <Button onClick={handleSendOTP} className="gap-2">
              <Smartphone className="h-4 w-4" />Send OTP
            </Button>
          )}
          {step === 'verify' && (
            <Button onClick={handleVerify} className="gap-2">
              <Check className="h-4 w-4" />Verify OTP
            </Button>
          )}
          {step === 'set' && (
            <Button onClick={handleChangePassword} className="gap-2">
              <Key className="h-4 w-4" />Change Password
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { users, add, update, remove } = useAuthUsers()

  const [addOpen,      setAddOpen]      = useState(false)
  const [editUser,     setEditUser]     = useState<string | null>(null)
  const [changePassOpen, setChangePassOpen] = useState(false)
  const [deleteId,     setDeleteId]     = useState<string | null>(null)

  const nonAdminUsers = users.filter(u => u.role !== 'admin')
  const editTarget    = users.find(u => u.id === editUser)

  const handleAdd = (username: string, password: string, perms: UserPermissions) => {
    try {
      add({ username, password, role: 'user', permissions: perms })
      toast.success(`User "${username}" created successfully!`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add user')
    }
  }

  const permSummary = (perms: UserPermissions) => {
    const granted = PERM_LABELS.filter(({ key }) => perms[key]).map(({ label }) => label)
    if (granted.length === PERM_LABELS.length) return 'Full Access'
    if (granted.length === 0) return 'Dashboard only'
    return granted.join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Panel</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage users and system security</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Users</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{users.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Regular Users</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{nonAdminUsers.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Admin Accounts</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">1</p>
        </div>
      </div>

      {/* ── User Management ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">User Accounts</h3>
            <Badge variant="secondary">{nonAdminUsers.length}</Badge>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />Add User
          </Button>
        </div>

        {nonAdminUsers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
            No users yet. Add a user to grant limited access.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Username</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Permissions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {nonAdminUsers.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">User</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell max-w-[220px] truncate">
                      {permSummary(user.permissions)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-blue-600"
                          title="Edit Permissions"
                          onClick={() => setEditUser(user.id)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-red-500"
                          title="Delete User"
                          onClick={() => setDeleteId(user.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Security ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Security</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Change your admin password with OTP verification via the registered mobile number.
        </p>
        <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Registered Mobile</p>
              <p className="text-sm font-mono text-slate-800 dark:text-slate-200">{maskedPhone}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setChangePassOpen(true)} className="gap-2">
            <Key className="h-3.5 w-3.5" />Change Password
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <AddUserDialog open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      {editTarget && (
        <EditPermsDialog
          open={!!editUser}
          onOpenChange={v => { if (!v) setEditUser(null) }}
          username={editTarget.username}
          initPerms={editTarget.permissions}
          onSave={perms => {
            update(editTarget.id, { permissions: perms })
            toast.success('Permissions updated!')
            setEditUser(null)
          }}
        />
      )}

      <ChangePasswordDialog open={changePassOpen} onOpenChange={setChangePassOpen} />

      {/* Delete confirm */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
          <DialogContent size="sm">
            <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this user? This cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => {
                remove(deleteId)
                toast.success('User deleted.')
                setDeleteId(null)
              }}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
