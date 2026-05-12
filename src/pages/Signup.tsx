import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const step1Schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

const step2Schema = z.object({
  garageName: z.string().min(2, 'Nom du garage requis'),
  phone: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })

  function onStep1Submit(data: Step1Data) {
    setStep1Data(data)
    setStep(2)
  }

  async function onStep2Submit(data: Step2Data) {
    if (!step1Data) return
    setIsLoading(true)
    const { error } = await signUp(step1Data.email, step1Data.password, data.garageName, data.phone)
    setIsLoading(false)
    if (error) {
      toast.error('Inscription échouée', { description: error })
    } else {
      supabase.functions.invoke('send-welcome-email', { body: {} })
        .catch(err => console.error('send-welcome-email failed', err))
      toast.success('Bienvenue ! Votre essai gratuit de 14 jours commence maintenant.')
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">A</div>
            <span className="font-display text-[18px] font-semibold tracking-tight">AutoLead AI</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="mb-2 flex gap-1">
              <div className="h-1 flex-1 rounded-full bg-primary" />
              <div className={`h-1 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
            </div>
            <CardTitle className="text-[22px]">
              {step === 1 ? 'Créer un compte' : 'Votre garage'}
            </CardTitle>
            <CardDescription>
              {step === 1 ? '14 jours gratuits, sans carte bancaire.' : 'Quelques infos pour personnaliser votre assistant.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@garage-martin.fr" {...form1.register('email')} />
                  {form1.formState.errors.email && <p className="text-[12px] text-destructive">{form1.formState.errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...form1.register('password')} />
                  {form1.formState.errors.password && <p className="text-[12px] text-destructive">{form1.formState.errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" {...form1.register('confirmPassword')} />
                  {form1.formState.errors.confirmPassword && <p className="text-[12px] text-destructive">{form1.formState.errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full">Continuer →</Button>
              </form>
            ) : (
              <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="garageName">Nom du garage</Label>
                  <Input id="garageName" placeholder="Garage Martin" {...form2.register('garageName')} />
                  {form2.formState.errors.garageName && <p className="text-[12px] text-destructive">{form2.formState.errors.garageName.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Téléphone <span className="text-muted-foreground">(optionnel)</span></Label>
                  <Input id="phone" type="tel" placeholder="06 12 34 56 78" {...form2.register('phone')} />
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>← Retour</Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Création…' : "C'est parti !"}
                  </Button>
                </div>
              </form>
            )}

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
