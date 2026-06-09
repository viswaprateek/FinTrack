import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils'

interface RotatingHeadlineProps {
  words: string[]
  intervalMs?: number
  className?: string
}

export function RotatingHeadline({ words, intervalMs = 3500, className }: RotatingHeadlineProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [words.length, intervalMs])

  return (
    <span className={cn('relative inline-block text-accent', className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="inline-block"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
