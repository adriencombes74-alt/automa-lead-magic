import { useQuery } from '@tanstack/react-query'
import { BarChart3, Calendar, FileText, TrendingUp } from 'lucide-react'
import { subDays, format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function Overview() {
  const { user } = useAuth()
  const garageId = user?.id

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString()

      const [convRes, devisRes, rdvRes] = await Promise.all([
        supabase.from('conversations').select('created_at, status').eq('garage_id', garageId!).gte('created_at', thirtyDaysAgo),
        supabase.from('devis').select('status, created_at').eq('garage_id', garageId!).gte('created_at', thirtyDaysAgo),
        supabase.from('rendez_vous').select('status, created_at').eq('garage_id', garageId!).gte('created_at', thirtyDaysAgo),
      ])

      const conversations = convRes.data ?? []
      const devisData = devisRes.data ?? []
      const rdvData = rdvRes.data ?? []

      const totalLeads = conversations.filter(c => c.status !== 'abandoned').length
      const totalDevis = devisData.length
      const totalRdv = rdvData.filter(r => r.status === 'confirmed' || r.status === 'completed').length
      const accepted = devisData.filter(d => d.status === 'accepted').length
      const conversionRate = totalDevis > 0 ? Math.round((accepted / totalDevis) * 100) : 0

      const chartData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i)
        const dateStr = format(date, 'yyyy-MM-dd')
        const count = conversations.filter(c => c.created_at.startsWith(dateStr)).length
        return { date: format(date, 'd MMM', { locale: fr }), conversations: count }
      })

      return { totalLeads, totalDevis, totalRdv, conversionRate, chartData }
    },
  })

  const kpis = [
    { label: 'Leads ce mois', value: stats?.totalLeads ?? 0, icon: TrendingUp, color: 'text-blue-500' },
    { label: 'Devis générés', value: stats?.totalDevis ?? 0, icon: FileText, color: 'text-purple-500' },
    { label: 'RDV confirmés', value: stats?.totalRdv ?? 0, icon: Calendar, color: 'text-green-500' },
    { label: 'Taux de conversion', value: `${stats?.conversionRate ?? 0}%`, icon: BarChart3, color: 'text-orange-500' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Activité des 30 derniers jours</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-[28px] font-bold tracking-tight">{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Conversations par jour</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ChartContainer config={{ conversations: { label: 'Conversations', color: 'hsl(var(--primary))' } }} className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.chartData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={6} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="conversations" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
