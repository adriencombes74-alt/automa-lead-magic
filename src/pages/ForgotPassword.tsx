import { useState } from 'react'
import { Link } from 'react-router-dom'
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
})

type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    const { error } = await resetPassword(data.email)
    setIsLoading(false)
    if (error) {
      toast.error('Erreur', { description: error })
    } else {
      setSent(true)
      toast.success('Email envoyé', { description: 'Consultez votre boîte mail pour réinitialiser votre mot de passe.' })
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
            <CardTitle className="text-[22px]">Mot de passe oublié</CardTitle>
            <CardDescription>
              {sent
                ? 'Si ce compte existe, un email de réinitialisation a été envoyé.'
                : 'Saisissez votre email, nous vous enverrons un lien de réinitialisation.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@garage-martin.fr" {...register('email')} />
                  {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Envoi…' : 'Envoyer le lien'}
                </Button>
              </form>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Retour à la connexion</Link>
              </Button>
            )}

            <p className="mt-4 text-center text-[13px] text-muted-foreground">
              <Link to="/login" className="font-medium text-primary hover:underline">
                ← Retour à la connexion
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
