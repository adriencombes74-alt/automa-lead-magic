import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
})

type FormData = z.infer<typeof schema>

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const { error } = await signIn(data.email, data.password)
    setIsLoading(false)
    if (error) {
      const msg = error.toLowerCase()
      if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        toast.error('Email non confirmé', { description: 'Vérifiez votre boîte mail pour valider votre compte.' })
      } else if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
        toast.error('Identifiants invalides', { description: 'Email ou mot de passe incorrect. Réinitialisez votre mot de passe si besoin.' })
      } else {
        toast.error('Connexion échouée', { description: error })
      }
    } else {
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
            <CardTitle className="text-[22px]">Connexion</CardTitle>
            <CardDescription>Accédez à votre tableau de bord garage.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contact@garage-martin.fr" {...register('email')} />
                {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Link to="/forgot-password" className="text-[12px] font-medium text-primary hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
              Pas encore de compte ?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Essayer gratuitement
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
