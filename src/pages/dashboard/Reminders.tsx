import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase, Reminder } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

const STATUS_LABELS: Record<Reminder['status'], { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'border-yellow-400 text-yellow-600' },
  sent: { label: 'Envoyé', className: 'bg-success/10 text-success border-success/20' },
  cancelled: { label: 'Annulé', className: 'bg-muted text-muted-foreground' },
  failed: { label: 'Échec', className: 'bg-destructive/10 text-destructive border-destructive/20' },
}

const TYPE_LABELS: Record<Reminder['reminder_type'], string> = {
  revision: 'Révision',
  pneus_hiver: 'Pneus hiver',
  pneus_ete: 'Pneus été',
}

export default function Reminders() {
  const { user } = useAuth()
  const garageId = user?.id
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<Reminder['status'] | 'all'>('all')

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('reminders')
        .select('*, clients(*)')
        .eq('garage_id', garageId!)
        .order('scheduled_at', { ascending: false })
      return (data ?? []) as Reminder[]
    },
  })

  const cancelReminder = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('reminders').update({ status: 'cancelled' }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', garageId] })
      toast.success('Rappel annulé')
    },
  })

  const filtered = statusFilter === 'all'
    ? reminders
    : reminders.filter(r => r.status === statusFilter)

  const counts = {
    all: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
    failed: reminders.filter(r => r.status === 'failed').length,
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Rappels SMS</h1>
          <p className="text-sm text-muted-foreground">
            {counts.pending} en attente · {counts.sent} envoyés · {counts.failed} échec
          </p>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
        <TabsList>
          <TabsTrigger value="all">Tous ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({counts.pending})</TabsTrigger>
          <TabsTrigger value="sent">Envoyés ({counts.sent})</TabsTrigger>
          <TabsTrigger value="failed">Échec ({counts.failed})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service / véhicule</TableHead>
              <TableHead>Date d'envoi</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Aucun rappel pour le moment.
                  <p className="text-[12px] mt-1">
                    Les rappels sont créés automatiquement quand un RDV est marqué « terminé »
                    et que le client a donné son consentement SMS.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(r => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="text-[13px] font-medium">{r.clients?.name ?? 'Anonyme'}</p>
                    <p className="text-[12px] text-muted-foreground">{r.clients?.phone ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-[13px]">{TYPE_LABELS[r.reminder_type]}</TableCell>
                  <TableCell className="text-[13px]">
                    {r.service_label ?? '—'}
                    {r.vehicle?.brand && (
                      <p className="text-[12px] text-muted-foreground">
                        {r.vehicle.brand}{r.vehicle.model ? ` ${r.vehicle.model}` : ''}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {format(new Date(r.scheduled_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    {r.sent_at && (
                      <p className="text-[12px] text-muted-foreground">
                        envoyé le {format(new Date(r.sent_at), 'd MMM HH:mm', { locale: fr })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_LABELS[r.status].className}>
                      {STATUS_LABELS[r.status].label}
                    </Badge>
                    {r.error_message && (
                      <p className="text-[11px] text-destructive mt-1 max-w-[200px] truncate" title={r.error_message}>
                        {r.error_message}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={() => cancelReminder.mutate(r.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
