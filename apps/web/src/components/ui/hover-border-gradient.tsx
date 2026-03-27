'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT'

const movingMap: Record<Direction, string> = {
  TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
  RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
}

const highlight =
  'radial-gradient(75% 181.16% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)'

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Element = 'button',
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<{
  as?: React.ElementType
  containerClassName?: string
  className?: string
  duration?: number
  clockwise?: boolean
} & React.HTMLAttributes<HTMLElement> & React.ButtonHTMLAttributes<HTMLButtonElement>>): JSX.Element {
  const [hovered, setHovered] = useState(false)
  const [direction, setDirection] = useState<Direction>('BOTTOM')

  const rotateDirection = (cur: Direction): Direction => {
    const dirs: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT']
    const idx = dirs.indexOf(cur)
    return clockwise ? dirs[(idx - 1 + 4) % 4]! : dirs[(idx + 1) % 4]!
  }

  useEffect(() => {
    if (hovered) return
    const id = setInterval(() => setDirection((d) => rotateDirection(d)), duration * 1000)
    return () => clearInterval(id)
  }, [hovered, duration, clockwise]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Element
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex h-min w-fit items-center justify-center overflow-visible rounded-full border bg-black/40 p-px backdrop-blur-sm transition duration-500 hover:bg-black/60',
        containerClassName,
      )}
      {...props}
    >
      <div className={cn('z-10 rounded-[inherit] bg-black px-4 py-2 text-white', className)}>
        {children}
      </div>
      <motion.div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{ filter: 'blur(2px)', width: '100%', height: '100%' }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered ? [movingMap[direction], highlight] : movingMap[direction],
        }}
        transition={{ ease: 'linear', duration }}
      />
      <div className="absolute inset-0.5 z-[1] rounded-[100px] bg-black" />
    </Element>
  )
}
