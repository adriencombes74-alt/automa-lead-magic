import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MessageSquare } from 'lucide-react'
import { supabase, Conversation, Message } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

function IntentBadge({ intent }: { intent: Conversation['intent'] }) {
  if (!intent || intent === 'unknown' || intent === 'greeting') return null
  const map = {
    devis: { label: 'Devis', className: 'bg-purple-500/10 text-purple-600' },
    rdv: { label: 'RDV', className: 'bg-green-500/10 text-green-600' },
    question: { label: 'Question', className: 'bg-blue-500/10 text-blue-600' },
  }
  const item = map[intent as keyof typeof map]
  if (!item) return null
  return <Badge className={`text-[10px] ${item.className}`}>{item.label}</Badge>
}

export default function Conversations() {
  const { user } = useAuth()
  const garageId = user?.id
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*, clients(*)')
        .eq('garage_id', garageId!)
        .order('created_at', { ascending: false })
        .limit(100)
      return (data ?? []) as Conversation[]
    },
  })

  const selected = conversations.find(c => c.id === selectedId)
  const messages: Message[] = selected?.messages ?? []

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden">
      {/* Liste */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        <div className="border-b border-border px-4 py-3">
          <h1 className="text-[15px] font-semibold">Conversations</h1>
          <p className="text-[12px] text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
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
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center text-muted-foreground">
              <MessageSquare className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune conversation</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {conversations.map(conv => {
                const lastMsg = conv.messages?.[conv.messages.length - 1]
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      selectedId === conv.id && 'bg-muted'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium truncate">
                        {conv.clients?.name ?? 'Visiteur anonyme'}
                      </p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.created_at), { addSuffix: false, locale: fr })}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <IntentBadge intent={conv.intent} />
                      {lastMsg && (
                        <p className="text-[12px] text-muted-foreground truncate">
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Détail */}
      <div className="flex-1 flex flex-col">
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-10 w-10 opacity-20" />
            <p className="text-sm">Sélectionnez une conversation</p>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-5 py-3 flex items-center gap-3">
              <div>
                <p className="text-[14px] font-semibold">
                  {selected.clients?.name ?? 'Visiteur anonyme'}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {selected.clients?.phone ?? ''}{selected.clients?.vehicle_brand ? ` · ${selected.clients.vehicle_brand} ${selected.clients.vehicle_model ?? ''}` : ''}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <IntentBadge intent={selected.intent} />
                <Badge variant="outline" className="text-[11px]">
                  {selected.messages?.length ?? 0} messages
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 p-5">
              <div className="space-y-3 max-w-2xl mx-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Aucun message</p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                      <div className={cn(
                        'max-w-[78%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed',
                        msg.role === 'assistant'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}>
                        <p>{msg.content}</p>
                        <p className={cn(
                          'mt-1 text-[10px] font-mono',
                          msg.role === 'assistant' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        )}>
                          {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  )
}
