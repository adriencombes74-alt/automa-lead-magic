import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Search } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { supabase, Lead } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-success/10 text-success hover:bg-success/20">HOT</Badge>
  if (score >= 40) return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">WARM</Badge>
  return <Badge variant="outline">COLD</Badge>
}

function StatusBadge({ status }: { status: Lead['status'] }) {
  const map: Record<Lead['status'], { label: string; className: string }> = {
    new: { label: 'Nouveau', className: 'bg-blue-500/10 text-blue-600' },
    contacted: { label: 'Contacté', className: 'bg-purple-500/10 text-purple-600' },
    qualified: { label: 'Qualifié', className: 'bg-success/10 text-success' },
    lost: { label: 'Perdu', className: 'bg-muted text-muted-foreground' },
  }
  const { label, className } = map[status]
  return <Badge className={`${className} hover:opacity-80`}>{label}</Badge>
}

export default function Leads() {
  const { user } = useAuth()
  const garageId = user?.id
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*, clients(*), conversations(id)')
        .eq('garage_id', garageId!)
        .order('created_at', { ascending: false })
      return (data ?? []) as Lead[]
    },
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Lead['status'] }) => {
      await supabase.from('leads').update({ status }).eq('id', id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads', garageId] })
      toast.success('Statut mis à jour')
    },
  })

  const filtered = leads.filter(l => {
    const matchSearch = !search ||
      l.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.clients?.phone?.includes(search)
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">Pipeline de vos prospects</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone…"
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="new">Nouveau</SelectItem>
            <SelectItem value="contacted">Contacté</SelectItem>
            <SelectItem value="qualified">Qualifié</SelectItem>
            <SelectItem value="lost">Perdu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Véhicule</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {search || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun lead pour le moment. Les leads apparaissent quand un visiteur interagit avec votre widget.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <p className="text-[13px] font-medium">{lead.clients?.name ?? 'Anonyme'}</p>
                      <p className="text-[12px] text-muted-foreground">{lead.clients?.phone ?? '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {lead.clients?.vehicle_brand
                      ? `${lead.clients.vehicle_brand} ${lead.clients.vehicle_model ?? ''}`
                      : '—'}
                  </TableCell>
                  <TableCell><ScoreBadge score={lead.score} /></TableCell>
                  <TableCell><StatusBadge status={lead.status} /></TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">
                    {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {lead.conversations && (
                          <DropdownMenuItem onClick={() => navigate('/dashboard/conversations')}>
                            Voir la conversation
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: lead.id, status: 'contacted' })}>
                          Marquer contacté
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateStatus.mutate({ id: lead.id, status: 'qualified' })}>
                          Marquer qualifié
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => updateStatus.mutate({ id: lead.id, status: 'lost' })}
                        >
                          Marquer perdu
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
    </div>
  )
}
