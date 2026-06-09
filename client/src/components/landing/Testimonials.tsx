import { motion } from 'motion/react'
import { Card } from '../ui/Card'
import { LANDING_TESTIMONIALS } from '../../lib/landingFaces'

export function Testimonials() {
  return (
    <section className="border-t border-border bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Real people, real budgets
          </h2>
          <p className="mt-4 text-subtle">
            FinTrack is built for everyday life — not financial theory. Here&apos;s what early users say.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.face.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <Card className="flex h-full flex-col p-6">
                <p className="flex-1 text-sm leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <img
                    src={item.face.src}
                    alt={item.face.name}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-border"
                  />
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-heading">{item.face.name}</p>
                    <p className="truncate text-xs text-muted-fg">{item.face.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
