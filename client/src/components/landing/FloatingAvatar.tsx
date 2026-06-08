import { motion, type MotionValue, useTransform } from 'motion/react'
import { cn } from '../../lib/utils'

interface FloatingAvatarProps {
  src: string
  className: string
  delay: number
  index: number
  springX: MotionValue<number>
  springY: MotionValue<number>
}

export function FloatingAvatar({ src, className, delay, index, springX, springY }: FloatingAvatarProps) {
  const x = useTransform(springX, [-1, 1], [-12 - index * 4, 12 + index * 4])
  const y = useTransform(springY, [-1, 1], [-8 - index * 3, 8 + index * 3])

  return (
    <motion.img
      src={src}
      alt=""
      className={cn(
        'absolute rounded-full border-2 border-slate-700/60 object-cover shadow-lg shadow-black/30 animate-float-slow',
        className,
      )}
      style={{ x, y, animationDelay: `${delay}s` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.85, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
    />
  )
}
