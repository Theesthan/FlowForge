'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type FloatingActionMenuProps = {
  options: {
    label: string
    onClick: () => void
    Icon?: React.ReactNode
  }[]
  className?: string
}

const FloatingActionMenu = ({ options, className }: FloatingActionMenuProps): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('fixed bottom-8 right-8 z-50', className)}>
      <Button
        onClick={() => setIsOpen((o) => !o)}
        className="w-10 h-10 rounded-full bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] p-0"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut', type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Plus className="w-5 h-5" />
        </motion.div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 10, y: 10, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="absolute bottom-12 right-0 mb-2"
          >
            <div className="flex flex-col items-end gap-2">
              {options.map((option, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => { option.onClick(); setIsOpen(false) }}
                    size="sm"
                    className="flex items-center gap-2 bg-[#11111198] hover:bg-[#111111d1] shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none rounded-xl backdrop-blur-sm"
                  >
                    {option.Icon}
                    <span>{option.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FloatingActionMenu
