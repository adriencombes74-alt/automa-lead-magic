import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import RevealGroup from '@/components/motion/RevealGroup'
import CountUp from '@/components/motion/CountUp'
import { fadeUp, EASE } from '@/components/motion/motion'

const stats = [
  { value: 3, suffix: ' min', label: 'de la 1ère question au RDV' },
  { value: 0, label: "appel raté (l'IA décroche)" },
  { value: 850, suffix: ' €', label: 'de chiffre récupéré', separator: ' ' },
  { value: '24/7', label: 'toujours disponible', literal: true },
]

type Slot = {
  start: string
  service: string
  client: string
  price: number
  big?: boolean
}

const week: { day: string; date: string; slots: Slot[] }[] = [
  {
    day: 'Lun',
    date: '12',
    slots: [
      { start: '09:00', service: 'Vidange + filtres', client: 'M. Dupont', price: 180 },
      { start: '14:00', service: 'Pneus avant', client: 'Mme Leroy', price: 320 },
    ],
  },
  {
    day: 'Mar',
    date: '13',
    slots: [
      { start: '08:00', service: 'Embrayage', client: 'M. Martin', price: 850, big: true },
      { start: '15:30', service: 'Diagnostic', client: 'Mme Bernard', price: 60 },
    ],
  },
  {
    day: 'Mer',
    date: '14',
    slots: [
      { start: '10:00', service: 'Plaquettes', client: 'M. Petit', price: 220 },
      { start: '15:00', service: 'Révision', client: 'M. Robert', price: 280 },
    ],
  },
  {
    day: 'Jeu',
    date: '15',
    slots: [
      { start: '09:00', service: 'Distribution', client: 'Mme Moreau', price: 720, big: true },
      { start: '14:00', service: 'Pneus × 4', client: 'M. Simon', price: 480 },
    ],
  },
  {
    day: 'Ven',
    date: '16',
    slots: [
      { start: '08:30', service: 'Climatisation', client: 'M. Laurent', price: 180 },
      { start: '11:00', service: 'Échappement', client: 'Mme Michel', price: 340 },
      { start: '16:00', service: 'Vidange', client: 'M. Garcia', price: 280 },
    ],
  },
]

// All slots flattened with a deterministic global index for staggering across columns.
const orderedSlots = week.flatMap((d, dayIndex) =>
  d.slots.map((s, slotIndex) => ({ ...s, dayIndex, slotIndex }))
)

const totalRdv = orderedSlots.length // 12
const totalAmount = orderedSlots.reduce((acc, s) => acc + s.price, 0) // 4 220 €

const Demo = () => (
  <section id="demo" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <Reveal>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Démo conversation
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Du premier message au RDV confirmé.
        </h2>
        <p className="mt-4 text-[16px] text-muted-foreground">
          Une vraie conversation, gérée à 21h45 un dimanche soir. Sans que vous touchiez votre téléphone.
        </p>

        <RevealGroup className="mt-8 grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              whileHover={{ y: -3 }}
              className="rounded-md border border-border bg-background p-4 transition-shadow hover:shadow-card-hover"
            >
              <p className="font-display text-[26px] font-bold tracking-tight text-foreground">
                {s.literal ? (
                  s.value
                ) : (
                  <CountUp
                    to={s.value as number}
                    suffix={s.suffix ?? ''}
                    separator={s.separator ?? ''}
                  />
                )}
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </RevealGroup>
      </Reveal>

      <AgendaPreview />
    </div>
  </section>
)

const AgendaPreview = () => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.6, ease: EASE }}
      className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-card-hover"
    >
      {/* Dashboard chrome */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="AutoLead AI" className="h-6 w-6" />
          <span className="font-display text-[13px] font-semibold tracking-tight">Agenda · Garage Martin</span>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sem. 24</span>
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-dot-ping" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-success">Live</span>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-5 gap-px bg-border">
        {week.map((d, dayIndex) => (
          <div key={d.day} className="flex min-h-[280px] flex-col bg-background">
            <div className="border-b border-border px-2 py-2 text-center sm:px-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {d.day}
              </p>
              <p className="font-display text-[15px] font-semibold leading-tight">{d.date}</p>
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-1.5">
              {d.slots.map((s, slotIndex) => {
                const globalIndex = orderedSlots.findIndex(
                  (o) => o.dayIndex === dayIndex && o.slotIndex === slotIndex
                )
                return (
                  <motion.div
                    key={`${d.day}-${slotIndex}`}
                    initial={{ opacity: 0, scale: 0.85, y: 6 }}
                    animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.35,
                      ease: EASE,
                      delay: 0.5 + globalIndex * 0.13,
                    }}
                    className={[
                      'relative rounded-md border-l-2 px-2 py-1.5 text-left',
                      s.big
                        ? 'border-l-primary bg-primary/8'
                        : 'border-l-muted-foreground/40 bg-muted/40',
                    ].join(' ')}
                    style={s.big ? { backgroundColor: 'hsl(var(--primary) / 0.08)' } : undefined}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {s.start}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight">
                      {s.service}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">{s.client}</p>
                    <p
                      className={[
                        'mt-1 font-mono text-[10px] font-semibold',
                        s.big ? 'text-primary' : 'text-foreground/70',
                      ].join(' ')}
                    >
                      {s.price}€
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: EASE, delay: 0.5 + orderedSlots.length * 0.13 + 0.2 }}
        className="flex items-center justify-between border-t border-border bg-surface px-5 py-4"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-success/15 text-success">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="font-display text-[13px] font-semibold leading-tight">
              <CountUp to={totalRdv} /> RDV cette semaine
            </p>
            <p className="text-[11px] text-muted-foreground">
              tous calés par le bot, sans un appel
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-[20px] font-bold leading-none text-primary">
            +<CountUp to={totalAmount} separator=" " />€
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            CA généré
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Demo
