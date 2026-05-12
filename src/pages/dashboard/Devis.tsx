import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase, Devis as DevisType } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuth as useAuthHook } from '@/contexts/AuthContext'

function StatusBadge({ status }: { status: DevisType['status'] }) {
  const map: Record<DevisType['status'], { label: string; className: string }> = {
    pending: { label: 'En attente', className: 'border-yellow-400 text-yellow-600' },
    accepted: { label: 'Accepté', className: 'bg-success/10 text-success border-success/20' },
    rejected: { label: 'Rejeté', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    expired: { label: 'Expiré', className: 'bg-muted text-muted-foreground' },
  }
  const { label, className } = map[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}

export default function Devis() {
  const { user } = useAuth()
  const garageId = user?.id
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('all')
  const [pdfDialog, setPdfDialog] = useState(false)

  const { data: devis = [], isLoading } = useQuery({
    queryKey: ['devis', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('devis')
        .select('*, clients(*)')
        .eq('garage_id', garageId!)
        .order('created_at', { ascending: false })
      return (data ?? []) as DevisType[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: DevisType['status'] }) => {
      await supabase.from('devis').update({ status }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devis', garageId] })
      toast.success('Statut mis à jour')
    },
  })

  const filtered = devis.filter(d => tab === 'all' || d.status === tab)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Devis</h1>
        <p className="text-sm text-muted-foreground">{devis.length} devis générés</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Tous ({devis.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({devis.filter(d => d.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="accepted">Acceptés ({devis.filter(d => d.status === 'accepted').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({devis.filter(d => d.status === 'rejected').length})</TabsTrigger>
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
              <TableHead className="text-right">Total TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
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
                  {tab !== 'all' ? 'Aucun devis dans cette catégorie' : 'Aucun devis pour le moment. Ils apparaissent automatiquement quand un client demande un devis via le widget.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-[12px] font-mono">{d.reference}</TableCell>
                  <TableCell>
                    <p className="text-[13px] font-medium">{d.clients?.name ?? 'Anonyme'}</p>
                    <p className="text-[12px] text-muted-foreground">{d.clients?.phone ?? '—'}</p>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {d.vehicle ? `${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.year})` : '—'}
                  </TableCell>
                  <TableCell className="text-[13px]">{d.service ?? '—'}</TableCell>
                  <TableCell className="text-right text-[13px] font-semibold">
                    {d.total_ttc?.toFixed(2)} €
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: d.id, status: 'accepted' })}>
                          Marquer accepté
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: d.id, status: 'rejected' })}>
                          Marquer rejeté
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPdfDialog(true)}>
                          Exporter PDF
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

      <Dialog open={pdfDialog} onOpenChange={setPdfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export PDF</DialogTitle>
            <DialogDescription>
              L'export PDF est disponible à partir du plan Pro. Passez au plan Pro pour générer et envoyer des devis PDF à vos clients.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPdfDialog(false)}>Fermer</Button>
            <Button onClick={() => setPdfDialog(false)}>Passer au plan Pro</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
