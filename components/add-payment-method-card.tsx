"use client"

import { motion } from "framer-motion"
import { Plus } from "lucide-react"

type AddPaymentMethodCardProps = {
  onClick: () => void
  index?: number
}

export function AddPaymentMethodCard({ onClick, index = 0 }: AddPaymentMethodCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className="h-[140px] rounded-xl border-2 border-dashed border-gray-300 bg-white/50 hover:border-[#DAA520] hover:bg-[#FFFBEB]/50 flex flex-col items-center justify-center gap-2 transition-colors duration-200 group"
    >
      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#DAA520]/20 flex items-center justify-center transition-colors">
        <Plus className="w-6 h-6 text-gray-500 group-hover:text-[#DAA520] transition-colors" />
      </div>
      <span className="text-sm font-medium text-gray-500 group-hover:text-[#654321] transition-colors">
        Add New Method
      </span>
    </motion.button>
  )
}
