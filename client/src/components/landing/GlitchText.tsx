import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*'

function scrambleText(target: string, progress: number): string {
  return target
    .split('')
    .map((char, i) => {
      if (char === ' ') return ' '
      const threshold = i / target.length
      if (progress >= threshold + 0.15) return char
      return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
    })
    .join('')
}

interface GlitchTextProps {
  words: string[]
  intervalMs?: number
  className?: string
}

export function GlitchText({ words, intervalMs = 3200, className }: GlitchTextProps) {
  const [wordIndex, setWordIndex] = useState(0)
  const [display, setDisplay] = useState(words[0])
  const scrambleRef = useRef<number>(0)

  useEffect(() => {
    const cycleTimer = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length)
    }, intervalMs)
    return () => clearInterval(cycleTimer)
  }, [words.length, intervalMs])

  useEffect(() => {
    const target = words[wordIndex]
    let frame = 0
    const totalFrames = 18

    const tick = () => {
      frame++
      const progress = frame / totalFrames
      setDisplay(scrambleText(target, progress))

      if (frame < totalFrames) {
        scrambleRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }

    scrambleRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(scrambleRef.current)
  }, [wordIndex, words])

  return (
    <motion.span
      key={wordIndex}
      className={cn('glitch-text inline-block text-emerald-400', className)}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {display}
    </motion.span>
  )
}
