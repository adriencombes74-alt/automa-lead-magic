import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type ChatWidgetProps = {
  widgetToken?: string
  position?: 'bottom-right' | 'bottom-left'
  color?: string
  botName?: string
  demoMode?: boolean
  demoMessages?: { from: 'client' | 'bot'; text: string; time: string }[]
}

const sessionId = crypto.randomUUID()

export default function ChatWidget({
  widgetToken,
  position = 'bottom-right',
  color = '#2563eb',
  botName = 'Assistant AutoLead',
  demoMode = false,
  demoMessages = [],
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Demo typewriter animation
  useEffect(() => {
    if (!demoMode || !isOpen || isDemoRunning || demoStep >= demoMessages.length) return

    setIsDemoRunning(true)
    const msg = demoMessages[demoStep]
    const delay = demoStep === 0 ? 500 : 1200

    const timer = setTimeout(() => {
      setMessages(prev => [...prev, {
        role: msg.from === 'bot' ? 'assistant' : 'user',
        content: msg.text,
        timestamp: new Date().toISOString(),
      }])
      setDemoStep(s => s + 1)
      setIsDemoRunning(false)
    }, delay)

    return () => clearTimeout(timer)
  }, [demoMode, isOpen, isDemoRunning, demoStep, demoMessages])

  // Reset demo when closed
  useEffect(() => {
    if (!isOpen && demoMode) {
      setMessages([])
      setDemoStep(0)
      setIsDemoRunning(false)
    }
  }, [isOpen, demoMode])

  async function sendMessage() {
    if (!input.trim() || isLoading || demoMode || !widgetToken) return

    const userMsg: Message = { role: 'user', content: input, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: input, session_id: sessionId, widget_token: widgetToken },
      })

      if (error) throw error

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? "Désolé, je n'ai pas pu traiter votre demande.",
        timestamp: new Date().toISOString(),
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Une erreur s'est produite. Veuillez réessayer.",
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const positionClass = position === 'bottom-right' ? 'right-4' : 'left-4'

  return (
    <div className={`fixed bottom-4 ${positionClass} z-50 flex flex-col items-end gap-3`}>
      {/* Fenêtre de chat */}
      {isOpen && (
        <div className="w-[340px] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden" style={{ height: '480px' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: color }}>
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 text-sm font-bold text-white">G</div>
              <div>
                <p className="text-[13px] font-semibold text-white leading-tight">{botName}</p>
                <p className="text-[11px] text-white/70">En ligne · répond instantanément</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 && !isDemoRunning && (
              <div className="flex justify-center py-6">
                <div className="text-center">
                  <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full" style={{ backgroundColor: `${color}20` }}>
                    <MessageSquare className="h-5 w-5" style={{ color }} />
                  </div>
                  <p className="text-[13px] font-medium">Bonjour ! 👋</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">Comment puis-je vous aider ?</p>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={cn(
                    'max-w-[82%] rounded-xl px-3.5 py-2 text-[13px] leading-snug',
                    msg.role === 'assistant' ? 'text-white' : 'bg-muted text-foreground'
                  )}
                  style={msg.role === 'assistant' ? { backgroundColor: color } : undefined}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                  <p className={cn('mt-1 text-[10px] font-mono', msg.role === 'assistant' ? 'text-white/60' : 'text-muted-foreground')}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-end">
                <div className="rounded-xl px-4 py-2.5" style={{ backgroundColor: color }}>
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!demoMode && (
            <div className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Votre message…"
                className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="grid h-8 w-8 place-items-center rounded-full transition-opacity disabled:opacity-40"
                style={{ backgroundColor: color }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="grid h-14 w-14 place-items-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ backgroundColor: color }}
        aria-label="Ouvrir le chat"
      >
        {isOpen
          ? <X className="h-5 w-5 text-white" />
          : <MessageSquare className="h-5 w-5 text-white" />
        }
      </button>
    </div>
  )
}
