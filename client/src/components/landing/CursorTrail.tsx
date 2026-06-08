import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, type MotionValue } from 'motion/react'

const TRAIL_COUNT = 14

function TrailDot({
  index,
  mouseX,
  mouseY,
}: {
  index: number
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}) {
  const stiffness = 280 - index * 14
  const x = useSpring(mouseX, { stiffness, damping: 28 })
  const y = useSpring(mouseY, { stiffness, damping: 28 })
  const opacity = 1 - index / TRAIL_COUNT
  const scale = 1 - index * 0.045

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-emerald-400"
      style={{
        x,
        y,
        width: 6,
        height: 6,
        marginLeft: -3,
        marginTop: -3,
        opacity,
        scale,
        boxShadow: index < 3 ? '0 0 12px rgba(52, 211, 153, 0.6)' : undefined,
      }}
    />
  )
}

export function CursorTrail() {
  const [enabled, setEnabled] = useState(false)
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  useEffect(() => {
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse)')
    setEnabled(!touchQuery.matches)

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [mouseX, mouseY])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <TrailDot key={i} index={i} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  )
}
