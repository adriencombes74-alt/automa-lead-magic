import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase, GarageProfile } from '@/lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  garageProfile: GarageProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, garageName: string, phone?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [garageProfile, setGarageProfile] = useState<GarageProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchGarageProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    setGarageProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchGarageProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchGarageProfile(session.user.id)
      } else {
        setGarageProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signUp(email: string, password: string, garageName: string, phone?: string) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error || !data.user) return { error: error?.message ?? 'Erreur lors de la création du compte' }

    const userId = data.user.id

    await supabase.from('users').insert({
      id: userId,
      garage_name: garageName,
      phone: phone ?? null,
    })

    await supabase.from('garage_configs').insert({
      garage_id: userId,
      config: {
        bot_name: 'Assistant AutoLead',
        widget_color: '#2563eb',
        widget_position: 'bottom-right',
        labor_rate: 75,
        services: [],
        opening_hours: {
          lundi: { open: '08:00', close: '18:00', closed: false },
          mardi: { open: '08:00', close: '18:00', closed: false },
          mercredi: { open: '08:00', close: '18:00', closed: false },
          jeudi: { open: '08:00', close: '18:00', closed: false },
          vendredi: { open: '08:00', close: '18:00', closed: false },
          samedi: { open: '08:00', close: '12:00', closed: false },
          dimanche: { open: '08:00', close: '12:00', closed: true },
        },
      },
    })

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 14)

    await supabase.from('subscriptions').insert({
      garage_id: userId,
      plan: 'starter',
      status: 'trialing',
      trial_end: trialEnd.toISOString(),
      devis_count: 0,
      rdv_count: 0,
    })

    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error?.message ?? null }
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    return { error: error?.message ?? null }
  }

  return (
    <AuthContext.Provider value={{ session, user, garageProfile, loading, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
