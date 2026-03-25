'use client'

import { type FC, type ReactNode, useRef } from 'react'
import { motion, type MotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TextRevealByWordProps {
  text: string
  className?: string
}

const TextRevealByWord: FC<TextRevealByWordProps> = ({ text, className }) => {
  const targetRef = useRef<HTMLDivElement | null>(null)
  // Full element height as scroll range — gives the most room for each word to reveal
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  })

  // Higher stiffness = snappier tracking; low damping = less lag when scrolling fast
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 22,
    restDelta: 0.0005,
  })

  const words = text.split(' ')

  return (
    <div ref={targetRef} className={cn('relative z-0 h-[200vh]', className)}>
      <div className="sticky top-0 mx-auto flex h-screen max-w-4xl items-center bg-transparent px-[1rem]">
        <p className="flex flex-wrap p-5 text-2xl font-bold md:p-8 md:text-3xl lg:p-10 lg:text-4xl xl:text-5xl">
          {words.map((word, i) => {
            // Slightly wider per-word range for a more gradual, overlapping reveal
            const start = Math.max(0, (i - 0.5) / words.length)
            const end = Math.min(1, (i + 1.5) / words.length)
            return (
              <Word key={i} progress={smoothProgress} range={[start, end]}>
                {word}
              </Word>
            )
          })}
        </p>
      </div>
    </div>
  )
}

interface WordProps {
  children: ReactNode
  progress: MotionValue<number>
  range: [number, number]
}

const Word: FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0, 1])
  return (
    <span className="xl:lg-3 relative mx-1 lg:mx-2.5">
      <span className="absolute text-white/20">{children}</span>
      <motion.span style={{ opacity }} className="text-white">
        {children}
      </motion.span>
    </span>
  )
}

export { TextRevealByWord }
