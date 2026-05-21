import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Check, ChevronLeft, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, type OpeningHours, type Service } from '@/lib/supabase'
import { SERVICE_CATALOG, DEFAULT_OPENING_HOURS } from '@/lib/serviceCatalog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AddressAutocomplete, type AddressValue } from '@/components/signup/AddressAutocomplete'
import { CalendlyEmbed } from '@/components/signup/CalendlyEmbed'
import { fadeUp, EASE } from '@/components/motion/motion'

const FRENCH_PHONE_REGEX = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/
const DRAFT_KEY = 'autolead-signup-draft'
const STEP_LABELS = ['Compte', 'Garage', 'Services', 'Horaires', 'Démarrage'] as const

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('33')) return '+' + digits
  if (digits.length === 10 && digits.startsWith('0')) return '+33' + digits.slice(1)
  return input.trim()
}

type FormState = {
  email: string
  password: string
  confirmPassword: string
  garageName: string
  phone: string
  address: string
  city: string
  postalCode: string
  website: string
  selectedServiceIds: string[]
  servicesSkipped: boolean
  openingHours: OpeningHours
  hoursSkipped: boolean
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  garageName: '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  website: '',
  selectedServiceIds: SERVICE_CATALOG.filter(s => s.default).map(s => s.id),
  servicesSkipped: false,
  openingHours: DEFAULT_OPENING_HOURS,
  hoursSkipped: false,
}

function saveDraft(state: FormState) {
  try {
    const { password: _p, confirmPassword: _c, ...safe } = state
    void _p; void _c
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe))
  } catch { /* ignore quota errors */ }
}

function loadDraft(): Partial<FormState> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Partial<FormState>) : null
  } catch {
    return null
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<FormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) setState(s => ({ ...s, ...draft }))
  }, [])

  useEffect(() => {
    if (step < 5) saveDraft(state)
  }, [state, step])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState(s => ({ ...s, [key]: value }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validateStep1(): boolean {
    const next: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) next.email = 'Email invalide'
    if (state.password.length < 6) next.password = 'Mot de passe trop court (6 caractères min)'
    if (state.password !== state.confirmPassword) next.confirmPassword = 'Les mots de passe ne correspondent pas'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function validateStep2(): boolean {
    const next: Record<string, string> = {}
    if (state.garageName.trim().length < 2) next.garageName = 'Nom du garage requis'
    if (!FRENCH_PHONE_REGEX.test(state.phone)) next.phone = 'Numéro de téléphone français invalide (ex: 06 12 34 56 78)'
    if (state.address.trim().length < 3) next.address = 'Adresse requise'
    if (state.city.trim().length < 2) next.city = 'Ville requise'
    if (!/^\d{5}$/.test(state.postalCode.trim())) next.postalCode = 'Code postal invalide (5 chiffres)'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submitSignup(servicesSkipped: boolean, hoursSkipped: boolean) {
    setIsSubmitting(true)
    const selectedServices: Service[] = SERVICE_CATALOG
      .filter(s => state.selectedServiceIds.includes(s.id))
      .map(({ default: _d, ...service }) => { void _d; return service })

    const { error } = await signUp(
      state.email,
      state.password,
      {
        garageName: state.garageName.trim(),
        phone: normalizePhone(state.phone),
        address: state.address.trim(),
        city: state.city.trim(),
        postalCode: state.postalCode.trim(),
        website: state.website.trim() || undefined,
      },
      {
        services: selectedServices,
        openingHours: state.openingHours,
      },
    )
    setIsSubmitting(false)

    if (error) {
      toast.error('Inscription échouée', { description: error })
      return
    }

    supabase.functions
      .invoke('send-welcome-email', {
        body: { help_requested: { services: servicesSkipped, hours: hoursSkipped } },
      })
      .catch(err => console.error('send-welcome-email failed', err))

    setState(s => ({ ...s, servicesSkipped, hoursSkipped }))
    clearDraft()
    setStep(5)
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  function handleSkipServices() {
    setState(s => ({ ...s, servicesSkipped: true }))
    setStep(4)
  }

  function handleSkipHours() {
    setState(s => ({ ...s, hoursSkipped: true }))
    submitSignup(state.servicesSkipped, true)
  }

  function handleContinueFromStep3() {
    if (state.selectedServiceIds.length === 0) {
      toast.error('Sélectionnez au moins un service ou cliquez sur "On le fait pour vous"')
      return
    }
    setState(s => ({ ...s, servicesSkipped: false }))
    setStep(4)
  }

  function handleSubmitStep4() {
    submitSignup(state.servicesSkipped, false)
  }

  const canGoBack = step > 1 && step < 5

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <SignupSidebar step={step} />

        <main className="flex flex-1 items-start justify-center px-4 py-8 sm:py-12 lg:px-12">
          <div className="w-full max-w-xl">
            {step < 5 && (
              <>
                <Link to="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">A</div>
                  <span className="font-display text-[18px] font-semibold tracking-tight">AutoLead AI</span>
                </Link>

                <ProgressIndicator step={step} />

                <Card className="overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } }}
                      >
                        {step === 1 && (
                          <StepAccount
                            state={state}
                            errors={errors}
                            update={update}
                            onNext={handleNext}
                          />
                        )}
                        {step === 2 && (
                          <StepGarage
                            state={state}
                            errors={errors}
                            update={update}
                            onNext={handleNext}
                          />
                        )}
                        {step === 3 && (
                          <StepServices
                            state={state}
                            update={update}
                            onContinue={handleContinueFromStep3}
                            onSkip={handleSkipServices}
                          />
                        )}
                        {step === 4 && (
                          <StepHours
                            state={state}
                            update={update}
                            onContinue={handleSubmitStep4}
                            onSkip={handleSkipHours}
                            isSubmitting={isSubmitting}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6 flex items-center justify-between">
                      {canGoBack ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
                          <ChevronLeft className="mr-1 h-4 w-4" /> Retour
                        </Button>
                      ) : <div />}
                      <p className="text-[12px] text-muted-foreground">
                        Étape {step} sur 4
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <p className="mt-6 text-center text-[13px] text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
                </p>
              </>
            )}

            {step === 5 && (
              <StepSuccess
                garageName={state.garageName}
                email={state.email}
                onGoToDashboard={() => navigate('/dashboard')}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function SignupSidebar({ step }: { step: number }) {
  const valueProps = useMemo(() => [
    { title: '14 jours gratuits', body: "Essayez sans engagement, sans carte bancaire." },
    { title: 'Capture vos leads 24/7', body: "L'assistant répond et qualifie même la nuit." },
    { title: 'Désinstallation en 1 clic', body: "Pas convaincu ? Retirez le widget en 5 secondes." },
  ], [])

  return (
    <aside className="hidden bg-gradient-to-b from-primary/10 via-surface to-surface lg:flex lg:w-[420px] lg:flex-col lg:justify-between lg:p-12">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">A</div>
        <span className="font-display text-[20px] font-semibold tracking-tight">AutoLead AI</span>
      </Link>

      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="font-display text-[32px] font-semibold leading-tight tracking-tight"
        >
          Lancez votre assistant en 3 minutes.
        </motion.h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {step <= 1 && "On commence par votre compte. Le reste est rapide, promis."}
          {step === 2 && "Quelques infos sur votre garage pour personnaliser l'expérience client."}
          {step === 3 && "Choisissez les services que vous proposez — l'assistant pourra chiffrer dès maintenant."}
          {step === 4 && "Définissez vos horaires d'ouverture. Vous pouvez les modifier à tout moment."}
        </p>

        <ul className="mt-10 space-y-5">
          {valueProps.map((v, i) => (
            <motion.li
              key={v.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: 0.2 + i * 0.08 }}
              className="flex gap-3"
            >
              <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[14px] font-semibold">{v.title}</p>
                <p className="text-[13px] text-muted-foreground">{v.body}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      <p className="text-[12px] text-muted-foreground">
        Vos données restent en France · RGPD compliant
      </p>
    </aside>
  )
}

function ProgressIndicator({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {STEP_LABELS.slice(0, 4).map((label, i) => {
          const idx = i + 1
          const isActive = idx === step
          const isDone = idx < step
          return (
            <motion.div
              key={label}
              initial={false}
              animate={{ scale: isActive ? 1.05 : 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                isActive || isDone ? 'bg-primary' : 'bg-muted',
              )}
            />
          )
        })}
      </div>
      <p className="mt-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {STEP_LABELS[step - 1]}
      </p>
    </div>
  )
}

type StepProps = {
  state: FormState
  errors: Record<string, string>
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

function StepAccount({ state, errors, update, onNext }: StepProps & { onNext: () => void }) {
  return (
    <form
      onSubmit={e => { e.preventDefault(); onNext() }}
      className="space-y-5"
    >
      <header>
        <h2 className="font-display text-[22px] font-semibold">Créer un compte</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">14 jours gratuits. Sans carte bancaire.</p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email professionnel</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="contact@garage-martin.fr"
          value={state.email}
          onChange={e => update('email', e.target.value)}
          className={cn(errors.email && 'border-destructive')}
        />
        {errors.email && <p className="text-[12px] text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={state.password}
          onChange={e => update('password', e.target.value)}
          className={cn(errors.password && 'border-destructive')}
        />
        {errors.password && <p className="text-[12px] text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={state.confirmPassword}
          onChange={e => update('confirmPassword', e.target.value)}
          className={cn(errors.confirmPassword && 'border-destructive')}
        />
        {errors.confirmPassword && <p className="text-[12px] text-destructive">{errors.confirmPassword}</p>}
      </div>

      <Button type="submit" className="w-full">Continuer →</Button>
    </form>
  )
}

function StepGarage({ state, errors, update, onNext }: StepProps & { onNext: () => void }) {
  function handleAddressChange(v: AddressValue) {
    update('address', v.address)
    update('city', v.city)
    update('postalCode', v.postalCode)
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onNext() }}
      className="space-y-5"
    >
      <header>
        <h2 className="font-display text-[22px] font-semibold">Votre garage</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Ces infos apparaîtront dans vos emails de confirmation et permettent aux clients de vous joindre.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="garageName">Nom du garage</Label>
        <Input
          id="garageName"
          autoFocus
          placeholder="Garage Martin"
          value={state.garageName}
          onChange={e => update('garageName', e.target.value)}
          className={cn(errors.garageName && 'border-destructive')}
        />
        {errors.garageName && <p className="text-[12px] text-destructive">{errors.garageName}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          value={state.phone}
          onChange={e => update('phone', e.target.value)}
          className={cn(errors.phone && 'border-destructive')}
        />
        {errors.phone && <p className="text-[12px] text-destructive">{errors.phone}</p>}
      </div>

      <AddressAutocomplete
        value={{ address: state.address, city: state.city, postalCode: state.postalCode }}
        onChange={handleAddressChange}
        errors={{ address: errors.address, city: errors.city, postalCode: errors.postalCode }}
      />

      <div className="space-y-1.5">
        <Label htmlFor="website">
          Site web <span className="text-muted-foreground">(optionnel)</span>
        </Label>
        <Input
          id="website"
          type="url"
          placeholder="https://garage-martin.fr"
          value={state.website}
          onChange={e => update('website', e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full">Continuer →</Button>
    </form>
  )
}

function StepServices({
  state,
  update,
  onContinue,
  onSkip,
}: Omit<StepProps, 'errors'> & { onContinue: () => void; onSkip: () => void }) {
  function toggle(id: string) {
    const next = state.selectedServiceIds.includes(id)
      ? state.selectedServiceIds.filter(x => x !== id)
      : [...state.selectedServiceIds, id]
    update('selectedServiceIds', next)
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-[22px] font-semibold">Vos services</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          L'assistant chiffrera ces prestations automatiquement. Les plus communs sont pré-cochés.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        {SERVICE_CATALOG.map(s => {
          const checked = state.selectedServiceIds.includes(s.id)
          return (
            <label
              key={s.id}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors',
                checked && 'border-primary bg-primary/5',
              )}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(s.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="text-[14px] font-medium">{s.label}</p>
                <p className="text-[12px] text-muted-foreground">
                  {s.duration_min} min · ~{s.base_price}€
                </p>
              </div>
            </label>
          )
        })}
      </div>

      <Button type="button" onClick={onContinue} className="w-full">
        Continuer ({state.selectedServiceIds.length} {state.selectedServiceIds.length > 1 ? 'services' : 'service'}) →
      </Button>

      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
        <p className="text-[13px] font-medium">Pas le temps maintenant ?</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          On le fait pour vous. Notre équipe vous contacte sous 24h pour configurer vos services.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onSkip}>
          Nous contacter pour qu'on le fasse à votre place
        </Button>
      </div>
    </div>
  )
}

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const

function StepHours({
  state,
  update,
  onContinue,
  onSkip,
  isSubmitting,
}: Omit<StepProps, 'errors'> & { onContinue: () => void; onSkip: () => void; isSubmitting: boolean }) {
  function updateDay(day: string, patch: Partial<{ open: string; close: string; closed: boolean }>) {
    update('openingHours', {
      ...state.openingHours,
      [day]: { ...state.openingHours[day], ...patch },
    })
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-[22px] font-semibold">Vos horaires d'ouverture</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          L'assistant ne proposera que des créneaux dans ces plages. Modifiables à tout moment.
        </p>
      </header>

      <div className="space-y-2">
        {DAYS.map(day => {
          const hours = state.openingHours[day]
          if (!hours) return null
          return (
            <div
              key={day}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-card p-3',
                hours.closed && 'opacity-60',
              )}
            >
              <div className="w-24 text-[14px] font-medium capitalize">{day}</div>
              <Switch
                checked={!hours.closed}
                onCheckedChange={v => updateDay(day, { closed: !v })}
              />
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={hours.open}
                  disabled={hours.closed}
                  onChange={e => updateDay(day, { open: e.target.value })}
                  className="h-9 w-28"
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  type="time"
                  value={hours.close}
                  disabled={hours.closed}
                  onChange={e => updateDay(day, { close: e.target.value })}
                  className="h-9 w-28"
                />
              </div>
            </div>
          )
        })}
      </div>

      <Button type="button" onClick={onContinue} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Création de votre compte…' : "C'est parti ! Créer mon compte →"}
      </Button>

      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
        <p className="text-[13px] font-medium">Pas sûr de vos horaires ?</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          On le fait pour vous. Notre équipe vous appelle pour caler vos plages d'ouverture.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onSkip} disabled={isSubmitting}>
          Nous contacter pour qu'on le fasse à votre place
        </Button>
      </div>
    </div>
  )
}

function StepSuccess({
  garageName,
  email,
  onGoToDashboard,
}: {
  garageName: string
  email: string
  onGoToDashboard: () => void
}) {
  return (
    <div className="w-full max-w-3xl">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mb-8 text-center"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight sm:text-[32px]">
          Bienvenue {garageName} !
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Votre essai gratuit de 14 jours a commencé. Un email avec votre snippet d'installation vient de partir vers <strong className="text-foreground">{email}</strong>.
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="mb-6 rounded-xl border border-border bg-card p-5 sm:p-6"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-[18px] font-semibold">Réservez 15 min pour qu'on configure votre assistant</h2>
            <p className="text-[13px] text-muted-foreground">
              C'est gratuit, simple et rapide. On s'occupe de tout, vous repartez avec un chatbot opérationnel.
            </p>
          </div>
        </div>
        <CalendlyEmbed garageName={garageName} email={email} />
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.25 }}
        className="flex flex-col items-center gap-3"
      >
        <Button onClick={onGoToDashboard} variant="outline" size="lg">
          Accéder au tableau de bord
        </Button>
        <p className="text-[12px] text-muted-foreground">
          Pensez à vérifier votre boîte mail — votre snippet d'intégration y est conservé.
        </p>
      </motion.div>
    </div>
  )
}
