import { useRef, useEffect, useState, type ReactNode, type MouseEvent } from 'react'
import { cn } from '../../lib/utils'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
}

export function TiltCard({ children, className, maxTilt = 8 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tiltEnabled, setTiltEnabled] = useState(false)

  useEffect(() => {
    setTiltEnabled(!window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    cardRef.current.style.transform = `perspective(1000px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale3d(1.02, 1.02, 1.02)`
  }

  const handleLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('transition-transform duration-200 ease-out will-change-transform', className)}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  )
}
