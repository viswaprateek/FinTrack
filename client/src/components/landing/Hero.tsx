import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { IconArrowRight, IconShield } from '../ui/icons'
import { RotatingHeadline } from './RotatingHeadline'
import { DashboardMockup } from './DashboardMockup'
import { FloatingAvatar } from './FloatingAvatar'
import { TiltCard } from './TiltCard'
import { AvatarStack } from './AvatarStack'
import { HERO_FLOATING_FACES, LANDING_FACES } from '../../lib/landingFaces'

const stats = [
  { label: 'Monthly Income', value: '$4,250', tone: 'text-success' },
  { label: 'Planned Spending', value: '$2,780', tone: 'text-amber-400' },
  { label: 'Available', value: '$1,470', tone: 'text-sky-400' },
]

const accentWords = ['save more', 'plan ahead', 'stay on track', 'month by month']

export function Hero() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const bgX = useTransform(springX, [-1, 1], [-30, 30])
  const bgY = useTransform(springY, [-1, 1], [-20, 20])
  const mockupX = useTransform(springX, [-1, 1], [15, -15])
  const mockupY = useTransform(springY, [-1, 1], [10, -10])

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    mouseX.set((x - 0.5) * 2)
    mouseY.set((y - 0.5) * 2)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Gradient mesh background */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: bgX, y: bgY }}
        aria-hidden
      >
        <div className="absolute -top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] animate-float-slow dark:bg-accent/10" />
        <div className="absolute -right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-sky-500/15 blur-[100px] animate-float-slow-reverse dark:bg-sky-500/8" />
        <div className="absolute bottom-0 left-1/2 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[90px] animate-pulse-glow dark:bg-violet-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(123,137,244,0.12)_0%,_transparent_55%)]" />
      </motion.div>

      {/* Floating portraits — desktop */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        {HERO_FLOATING_FACES.map((face, i) => (
          <FloatingAvatar
            key={face.id}
            src={face.src}
            alt={face.name}
            className={face.className}
            delay={face.delay}
            index={i}
            springX={springX}
            springY={springY}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-solid px-4 py-1.5 text-sm text-subtle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <IconShield className="h-4 w-4 text-success" />
              Personal Finance • Envelope Budgeting
            </motion.span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-heading sm:text-5xl lg:text-6xl">
              Budget smarter,
              <br />
              <RotatingHeadline words={accentWords} />
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-fg lg:mx-0">
              FinTrack helps you plan budgets, track spending, manage recurring bills, and forecast your
              cashflow — all in one clean, modern workspace.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/sign-up">
                <Button size="md" className="px-6">
                  Get started free
                  <IconArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button variant="secondary" size="md" className="px-6">
                  Sign in
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <AvatarStack faces={LANDING_FACES} size="lg" max={6} />
              <p className="max-w-xs text-center text-sm text-subtle sm:text-left">
                Trusted by teachers, freelancers, students, and families who budget month to month.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ x: mockupX, y: mockupY }}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <TiltCard>
              <DashboardMockup />
            </TiltCard>
          </motion.div>
        </div>

        {/* Stat preview cards */}
        <motion.div
          className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
            >
              <Card className="p-6 text-center">
                <p className={`text-3xl font-bold ${s.tone}`}>{s.value}</p>
                <p className="mt-2 text-sm text-muted-fg">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
