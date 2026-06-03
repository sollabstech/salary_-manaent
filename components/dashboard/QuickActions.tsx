'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { UserPlus, DollarSign, CreditCard, FileBarChart } from 'lucide-react'

const actions = [
  { label: 'Add Employee', icon: UserPlus, href: '/employees', color: 'bg-purple-600 hover:bg-purple-700' },
  { label: 'Add Salary', icon: DollarSign, href: '/salary', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Add Advance', icon: CreditCard, href: '/advances', color: 'bg-amber-500 hover:bg-amber-600' },
  { label: 'Reports', icon: FileBarChart, href: '/reports', color: 'bg-emerald-600 hover:bg-emerald-700' },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {actions.map((action, i) => {
        const Icon = action.icon
        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(action.href)}
            className={`flex flex-col items-center gap-2.5 rounded-xl p-4 text-white shadow-sm transition-colors ${action.color}`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        )
      })}
    </div>
  )
}
