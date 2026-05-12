import { useEffect, useState } from 'react'
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

const schema = z.object({
  password: z.string().min(6, 'Mot de passe trop court (6 caractères minimum)'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasRecoverySession(true)
      }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasRecoverySession(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const { error } = await updatePassword(data.password)
    setIsLoading(false)
    if (error) {
      toast.error('Erreur', { description: error })
    } else {
      toast.success('Mot de passe mis à jour')
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
            <CardTitle className="text-[22px]">Nouveau mot de passe</CardTitle>
            <CardDescription>
              {hasRecoverySession === false
                ? 'Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.'
                : 'Choisissez un nouveau mot de passe pour votre compte.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasRecoverySession === false ? (
              <Button asChild className="w-full">
                <Link to="/forgot-password">Demander un nouveau lien</Link>
              </Button>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                  {errors.confirmPassword && <p className="text-[12px] text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || hasRecoverySession === null}>
                  {isLoading ? 'Mise à jour…' : 'Mettre à jour'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
