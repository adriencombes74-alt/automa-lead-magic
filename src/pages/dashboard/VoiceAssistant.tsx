import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { subDays, format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  PhoneCall, PhoneOff, Clock, CheckCircle2, CalendarCheck, Search,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { supabase, VoiceCall, VoiceTranscriptItem } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { cn } from '@/lib/utils'

type Period = '7' | '30' | '90'

function formatDuration(secs: number | null): string {
  if (!secs || secs <= 0) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`
}

function SuccessBadge({ value }: { value: VoiceCall['call_successful'] }) {
  const map = {
    success: { label: 'Réussi', className: 'bg-green-500/10 text-green-600 border-green-500/20' },
    failure: { label: 'Échoué', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    unknown: { label: 'Indéterminé', className: 'bg-muted text-muted-foreground' },
  }
  const item = map[value ?? 'unknown'] ?? map.unknown
  return <Badge variant="outline" className={`text-[10px] ${item.className}`}>{item.label}</Badge>
}

export default function VoiceAssistant() {
  const { user } = useAuth()
  const garageId = user?.id
  const [period, setPeriod] = useState<Period>('30')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ['voice-calls', garageId, period],
    enabled: !!garageId,
    queryFn: async () => {
      const since = subDays(new Date(), Number(period)).toISOString()
      const { data } = await supabase
        .from('voice_calls')
        .select('*, clients(*)')
        .eq('garage_id', garageId!)
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .limit(200)
      return (data ?? []) as VoiceCall[]
    },
  })

  const stats = useMemo(() => {
    const total = calls.length
    const durations = calls.map(c => c.duration_secs ?? 0).filter(Boolean)
    const avgDuration = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0
    const success = calls.filter(c => c.call_successful === 'success').length
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0
    const rdvCount = calls.filter(c => c.rdv_id).length
    const conversion = total > 0 ? Math.round((rdvCount / total) * 100) : 0

    const days = Number(period)
    const chartData = Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i)
      const dateStr = format(date, 'yyyy-MM-dd')
      const dayCalls = calls.filter(c => c.started_at?.startsWith(dateStr))
      return {
        date: format(date, 'd MMM', { locale: fr }),
        appels: dayCalls.length,
      }
    })

    // Top services demandés (depuis data_collected.service ou .demande)
    const serviceCounts = new Map<string, number>()
    for (const c of calls) {
      const dc = c.data_collected as Record<string, unknown> | null
      const raw = dc?.service ?? dc?.demande ?? dc?.motif
      const label = typeof raw === 'string' ? raw.trim() : ''
      if (label) serviceCounts.set(label, (serviceCounts.get(label) ?? 0) + 1)
    }
    const topServices = [...serviceCounts.entries()]
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return { total, avgDuration, successRate, rdvCount, conversion, chartData, topServices }
  }, [calls, period])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return calls
    return calls.filter(c =>
      (c.caller_phone ?? '').toLowerCase().includes(q) ||
      (c.clients?.name ?? '').toLowerCase().includes(q) ||
      (c.summary ?? '').toLowerCase().includes(q),
    )
  }, [calls, search])

  const selected = calls.find(c => c.id === selectedId)

  const kpis = [
    { label: 'Appels', value: stats.total, icon: PhoneCall, color: 'text-blue-500' },
    { label: 'Durée moyenne', value: formatDuration(stats.avgDuration), icon: Clock, color: 'text-purple-500' },
    { label: 'Taux de réussite', value: `${stats.successRate}%`, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'RDV pris au tél.', value: stats.rdvCount, icon: CalendarCheck, color: 'text-orange-500', hint: `${stats.conversion}% de conversion` },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Assistant vocal</h1>
          <p className="text-sm text-muted-foreground">Appels traités par votre assistant téléphonique IA</p>
        </div>
        <Tabs value={period} onValueChange={v => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="7">7 j</TabsTrigger>
            <TabsTrigger value="30">30 j</TabsTrigger>
            <TabsTrigger value="90">90 j</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPIs */}
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
                <>
                  <p className="text-[28px] font-bold tracking-tight">{kpi.value}</p>
                  {kpi.hint && <p className="text-[11px] text-muted-foreground">{kpi.hint}</p>}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold">Appels par jour</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ChartContainer config={{ appels: { label: 'Appels', color: 'hsl(var(--primary))' } }} className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(Number(period) / 5))} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="appels" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[15px] font-semibold">Top demandes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : stats.topServices.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Pas encore de données collectées
              </div>
            ) : (
              <ChartContainer config={{ count: { label: 'Appels', color: 'hsl(var(--primary))' } }} className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topServices} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="service" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historique : liste + détail */}
      <Card className="overflow-hidden p-0">
        <div className="flex h-[560px]">
          {/* Liste */}
          <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
            <div className="border-b border-border p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un appel…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 pl-8 text-[13px]"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-lg p-3 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
                  <PhoneOff className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Aucun appel sur la période</p>
                </div>
              ) : (
                <div className="space-y-0.5 p-2">
                  {filtered.map(call => (
                    <button
                      key={call.id}
                      onClick={() => setSelectedId(call.id)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                        selectedId === call.id && 'bg-muted',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-medium truncate">
                          {call.clients?.name ?? call.caller_phone ?? 'Appelant inconnu'}
                        </p>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {call.started_at ? formatDistanceToNow(new Date(call.started_at), { addSuffix: false, locale: fr }) : ''}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <SuccessBadge value={call.call_successful} />
                        <span className="text-[11px] text-muted-foreground">{formatDuration(call.duration_secs)}</span>
                      </div>
                      {call.summary && (
                        <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{call.summary}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Détail */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
                <PhoneCall className="h-10 w-10 opacity-20" />
                <p className="text-sm">Sélectionnez un appel</p>
              </div>
            ) : (
              <>
                <div className="border-b border-border px-5 py-3 flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold truncate">
                      {selected.clients?.name ?? selected.caller_phone ?? 'Appelant inconnu'}
                    </p>
                    <p className="text-[12px] text-muted-foreground truncate">
                      {selected.caller_phone ?? ''}
                      {selected.started_at ? ` · ${format(new Date(selected.started_at), 'd MMM yyyy, HH:mm', { locale: fr })}` : ''}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                    <SuccessBadge value={selected.call_successful} />
                    <Badge variant="outline" className="text-[11px]">{formatDuration(selected.duration_secs)}</Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-5">
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {selected.summary && (
                      <div className="rounded-lg border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Résumé</p>
                        <p className="text-[13px] leading-relaxed">{selected.summary}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {(selected.transcript ?? []).length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">Transcript indisponible</p>
                      ) : (
                        selected.transcript.map((msg: VoiceTranscriptItem, i: number) => (
                          <div key={i} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div className={cn(
                              'max-w-[78%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed',
                              msg.role === 'agent' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                            )}>
                              <p>{msg.message}</p>
                              {typeof msg.time_in_call_secs === 'number' && (
                                <p className={cn(
                                  'mt-1 text-[10px] font-mono',
                                  msg.role === 'agent' ? 'text-primary-foreground/60' : 'text-muted-foreground',
                                )}>
                                  {formatDuration(msg.time_in_call_secs)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
