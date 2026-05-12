import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, CalendarDays, List, Mail, Phone, Car, FileText, MessageSquare, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase, RendezVous, Conversation } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'today' | 'upcoming' | 'past'

function StatusBadge({ status }: { status: RendezVous['status'] }) {
  const map: Record<RendezVous['status'], { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'border-yellow-400 text-yellow-600' },
    confirmed: { label: 'Confirmé', className: 'bg-success/10 text-success border-success/20' },
    cancelled: { label: 'Annulé', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    completed: { label: 'Terminé', className: 'bg-muted text-muted-foreground' },
    no_show: { label: 'Absent', className: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  }
  const { label, className } = map[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}

function vehicleLabel(v: RendezVous['vehicle']): string {
  if (!v) return '—'
  const parts = [v.brand, v.model, v.year].filter(Boolean)
  return parts.length ? parts.join(' ') : '—'
}

function clientName(rdv: RendezVous): string {
  return rdv.client_name ?? rdv.clients?.name ?? 'Anonyme'
}

function clientPhone(rdv: RendezVous): string | null {
  return rdv.client_phone ?? rdv.clients?.phone ?? null
}

function clientEmail(rdv: RendezVous): string | null {
  return rdv.client_email ?? rdv.clients?.email ?? null
}

export default function Rdv() {
  const { user } = useAuth()
  const garageId = user?.id
  const queryClient = useQueryClient()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [detailRdv, setDetailRdv] = useState<RendezVous | null>(null)

  const { data: rdvList = [], isLoading } = useQuery({
    queryKey: ['rdv', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('rendez_vous')
        .select('*, clients(*)')
        .eq('garage_id', garageId!)
        .order('scheduled_at', { ascending: true })
      return (data ?? []) as RendezVous[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RendezVous['status'] }) => {
      await supabase.from('rendez_vous').update({ status }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rdv', garageId] })
      toast.success('Statut mis à jour')
    },
  })

  const filtered = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday.getTime() + 24 * 3600 * 1000)

    return rdvList.filter(r => {
      if (selectedDate && format(new Date(r.scheduled_at), 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
        return false
      }
      const at = new Date(r.scheduled_at)
      switch (statusFilter) {
        case 'pending': return r.status === 'pending'
        case 'confirmed': return r.status === 'confirmed'
        case 'today': return at >= startOfToday && at < endOfToday
        case 'upcoming': return at >= now && r.status !== 'cancelled'
        case 'past': return at < now
        default: return true
      }
    })
  }, [rdvList, statusFilter, selectedDate])

  const dayList = useMemo(() => {
    if (!selectedDate) return []
    return rdvList
      .filter(r => format(new Date(r.scheduled_at), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  }, [rdvList, selectedDate])

  const rdvDates = rdvList.map(r => new Date(r.scheduled_at))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Rendez-vous</h1>
          <p className="text-sm text-muted-foreground">{rdvList.length} rendez-vous</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 text-[12px]"
            onClick={() => setView('list')}
          >
            <List className="h-3.5 w-3.5" /> Liste
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 gap-1.5 text-[12px]"
            onClick={() => setView('calendar')}
          >
            <CalendarDays className="h-3.5 w-3.5" /> Calendrier
          </Button>
        </div>
      </div>

      {view === 'calendar' && (
        <div className="flex flex-col gap-4 lg:flex-row">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={fr}
            modifiers={{ hasRdv: rdvDates }}
            modifiersClassNames={{ hasRdv: 'font-bold underline decoration-primary' }}
            className="rounded-lg border border-border p-3"
          />
          <div className="flex-1 rounded-lg border border-border p-4">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">Sélectionne un jour pour voir les rendez-vous.</p>
            ) : dayList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun rendez-vous le {format(selectedDate, 'd MMMM yyyy', { locale: fr })}.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[13px] font-medium">
                  {dayList.length} RDV le {format(selectedDate, 'd MMMM yyyy', { locale: fr })}
                </p>
                <ul className="space-y-1.5">
                  {dayList.map(r => (
                    <li key={r.id}>
                      <button
                        onClick={() => setDetailRdv(r)}
                        className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-[13px] hover:bg-accent/40"
                      >
                        <span className="font-mono text-[12px] text-muted-foreground">
                          {format(new Date(r.scheduled_at), 'HH:mm')}
                        </span>
                        <span className="flex-1 truncate">{clientName(r)}</span>
                        <span className="truncate text-[12px] text-muted-foreground">{r.service ?? '—'}</span>
                        <StatusBadge status={r.status} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmés</TabsTrigger>
          <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
          <TabsTrigger value="upcoming">À venir</TabsTrigger>
          <TabsTrigger value="past">Passés</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date &amp; heure</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  {selectedDate
                    ? `Aucun rendez-vous ce jour`
                    : statusFilter !== 'all'
                      ? `Aucun rendez-vous dans cette catégorie`
                      : 'Aucun rendez-vous pour le moment. Ils apparaissent automatiquement quand un client prend RDV via le widget.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(rdv => (
                <TableRow
                  key={rdv.id}
                  className="cursor-pointer hover:bg-accent/40"
                  onClick={() => setDetailRdv(rdv)}
                >
                  <TableCell className="text-[12px] font-mono">{rdv.reference}</TableCell>
                  <TableCell>
                    <p className="text-[13px] font-medium">{clientName(rdv)}</p>
                    <p className="text-[12px] text-muted-foreground">{clientPhone(rdv) ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-[13px]">{vehicleLabel(rdv.vehicle)}</TableCell>
                  <TableCell className="text-[13px]">{rdv.service ?? '—'}</TableCell>
                  <TableCell className="text-[13px]">
                    {format(new Date(rdv.scheduled_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-[13px]">{rdv.duration_min} min</TableCell>
                  <TableCell><StatusBadge status={rdv.status} /></TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: rdv.id, status: 'confirmed' })}>
                          Confirmer
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: rdv.id, status: 'completed' })}>
                          Marquer terminé
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: rdv.id, status: 'no_show' })}>
                          Absent
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => updateStatus.mutate({ id: rdv.id, status: 'cancelled' })}
                        >
                          Annuler
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RdvDetailSheet
        rdv={detailRdv}
        onClose={() => setDetailRdv(null)}
        onUpdateStatus={status => detailRdv && updateStatus.mutate({ id: detailRdv.id, status })}
      />
    </div>
  )
}

function RdvDetailSheet({
  rdv,
  onClose,
  onUpdateStatus,
}: {
  rdv: RendezVous | null
  onClose: () => void
  onUpdateStatus: (status: RendezVous['status']) => void
}) {
  const { data: conversation } = useQuery({
    queryKey: ['rdv-conversation', rdv?.client_id],
    enabled: !!rdv?.client_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('garage_id', rdv!.garage_id)
        .eq('client_id', rdv!.client_id!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      return (data ?? null) as Conversation | null
    },
  })

  if (!rdv) return null

  const phone = clientPhone(rdv)
  const email = clientEmail(rdv)
  const lastMessages = conversation?.messages?.slice(-6) ?? []

  return (
    <Sheet open={!!rdv} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>Rendez-vous</span>
            <StatusBadge status={rdv.status} />
          </SheetTitle>
          <SheetDescription className="font-mono text-[12px]">{rdv.reference}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5 text-[13px]">
          <Section icon={<CalendarDays className="h-4 w-4" />} title="Date & heure">
            <p className="font-medium">
              {format(new Date(rdv.scheduled_at), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
            <p className="text-muted-foreground">Durée estimée : {rdv.duration_min} min</p>
          </Section>

          <Section icon={<Phone className="h-4 w-4" />} title="Client">
            <p className="font-medium">{clientName(rdv)}</p>
            {phone && (
              <a href={`tel:${phone}`} className="block text-primary hover:underline">{phone}</a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="block text-primary hover:underline">
                <Mail className="mr-1 inline h-3 w-3" />{email}
              </a>
            )}
          </Section>

          <Section icon={<Car className="h-4 w-4" />} title="Véhicule">
            <p>{vehicleLabel(rdv.vehicle)}</p>
          </Section>

          <Section icon={<FileText className="h-4 w-4" />} title="Service">
            <p>{rdv.service ?? '—'}</p>
          </Section>

          {rdv.notes && (
            <Section icon={<MessageSquare className="h-4 w-4" />} title="Demande du client">
              <p className="rounded-md bg-yellow-50 p-3 italic text-[13px] text-yellow-900">{rdv.notes}</p>
            </Section>
          )}

          {lastMessages.length > 0 && (
            <Section icon={<MessageSquare className="h-4 w-4" />} title="Conversation récente">
              <ul className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3">
                {lastMessages.map((m, i) => (
                  <li key={i} className="text-[12px]">
                    <span className={m.role === 'user' ? 'font-medium' : 'text-muted-foreground'}>
                      {m.role === 'user' ? 'Client' : 'Bot'} :
                    </span>{' '}
                    <span>{m.content}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {rdv.confirmation_sent_at && (
            <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Confirmation envoyée par email le{' '}
              {format(new Date(rdv.confirmation_sent_at), "d MMM 'à' HH:mm", { locale: fr })}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {rdv.status !== 'confirmed' && (
              <Button size="sm" onClick={() => onUpdateStatus('confirmed')}>Confirmer</Button>
            )}
            {rdv.status !== 'completed' && (
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus('completed')}>Terminé</Button>
            )}
            {rdv.status !== 'no_show' && (
              <Button size="sm" variant="outline" onClick={() => onUpdateStatus('no_show')}>Absent</Button>
            )}
            {rdv.status !== 'cancelled' && (
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => onUpdateStatus('cancelled')}>
                Annuler
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Section({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}{title}
      </div>
      <div>{children}</div>
    </div>
  )
}
