import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, Check, Plus, Trash2, Upload, FileText, Loader2 } from 'lucide-react'
import { supabase, GarageConfig, Service, ReminderFrequencies } from '@/lib/supabase'
import { DEFAULT_REMINDER_FREQUENCIES } from '@/lib/serviceCatalog'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const MAX_PDF_SIZE_MB = 15

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export default function DashboardSettings() {
  const { user, garageProfile } = useAuth()
  const garageId = user?.id
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)

  const { data: config } = useQuery({
    queryKey: ['garage-config', garageId],
    enabled: !!garageId,
    queryFn: async () => {
      const { data } = await supabase
        .from('garage_configs')
        .select('*')
        .eq('garage_id', garageId!)
        .single()
      return data as GarageConfig
    },
  })

  // Garage tab state
  const [garageName, setGarageName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [laborRate, setLaborRate] = useState([75])

  useEffect(() => {
    if (garageProfile) {
      setGarageName(garageProfile.garage_name ?? '')
      setPhone(garageProfile.phone ?? '')
      setAddress(garageProfile.address ?? '')
    }
    if (config) {
      setLaborRate([config.config?.labor_rate ?? 75])
    }
  }, [garageProfile, config])

  // Widget tab state
  const [botName, setBotName] = useState('')
  const [widgetColor, setWidgetColor] = useState('#2563eb')
  const [widgetPosition, setWidgetPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')

  useEffect(() => {
    if (config?.config) {
      setBotName(config.config.bot_name ?? 'Assistant AutoLead')
      setWidgetColor(config.config.widget_color ?? '#2563eb')
      setWidgetPosition(config.config.widget_position ?? 'bottom-right')
    }
  }, [config])

  // Services tab state
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    if (config?.config?.services) setServices(config.config.services)
  }, [config])

  // Reminders tab state
  const [reminderFreqs, setReminderFreqs] = useState<ReminderFrequencies>(DEFAULT_REMINDER_FREQUENCIES)

  useEffect(() => {
    if (config?.config?.reminder_frequencies) {
      setReminderFreqs({
        revision: { ...DEFAULT_REMINDER_FREQUENCIES.revision!, ...config.config.reminder_frequencies.revision },
        pneus_hiver: { ...DEFAULT_REMINDER_FREQUENCIES.pneus_hiver!, ...config.config.reminder_frequencies.pneus_hiver },
        pneus_ete: { ...DEFAULT_REMINDER_FREQUENCIES.pneus_ete!, ...config.config.reminder_frequencies.pneus_ete },
      })
    }
  }, [config])

  // PDF tariff import state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [extractedServices, setExtractedServices] = useState<Service[] | null>(null)
  const [importWarnings, setImportWarnings] = useState<string[]>([])
  const [mergeMode, setMergeMode] = useState<'replace' | 'append'>('replace')

  async function handlePdfUpload(file: File) {
    if (!garageId) return
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés')
      return
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      toast.error(`Le PDF dépasse ${MAX_PDF_SIZE_MB} Mo. Merci de le compresser ou le scinder.`)
      return
    }

    setImporting(true)
    try {
      const path = `${garageId}/${Date.now()}.pdf`
      const { error: upErr } = await supabase.storage
        .from('tariffs')
        .upload(path, file, { upsert: false, contentType: 'application/pdf' })
      if (upErr) throw upErr

      const { data, error: fnErr } = await supabase.functions.invoke('parse-tariffs', {
        body: { storage_path: path },
      })
      if (fnErr) throw fnErr

      const parsed = (data?.services ?? []) as Service[]
      const warnings = (data?.warnings ?? []) as string[]

      if (parsed.length === 0) {
        toast.error('Aucun service détecté dans le PDF. Vérifiez votre document.')
        return
      }

      setExtractedServices(parsed)
      setImportWarnings(warnings)
      setMergeMode('replace')
      toast.success(`${parsed.length} service(s) détecté(s) — vérifiez avant de sauvegarder.`)
    } catch (err) {
      console.error(err)
      toast.error("Échec de l'analyse du PDF. Réessayez ou ajoutez les services manuellement.")
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function updateExtractedService(index: number, field: keyof Service, value: string | number) {
    setExtractedServices(prev => prev?.map((s, i) => i === index ? { ...s, [field]: value } : s) ?? null)
  }

  function removeExtractedService(index: number) {
    setExtractedServices(prev => prev?.filter((_, i) => i !== index) ?? null)
  }

  function confirmImport() {
    if (!extractedServices) return
    if (mergeMode === 'replace') {
      setServices(extractedServices)
    } else {
      const existingIds = new Set(services.map(s => s.id))
      const merged = [...services]
      for (const svc of extractedServices) {
        let id = svc.id
        let suffix = 2
        while (existingIds.has(id)) {
          id = `${svc.id}-${suffix++}`
        }
        existingIds.add(id)
        merged.push({ ...svc, id })
      }
      setServices(merged)
    }
    setExtractedServices(null)
    setImportWarnings([])
    toast.success("Services importés. N'oubliez pas de sauvegarder.")
  }

  function cancelImport() {
    setExtractedServices(null)
    setImportWarnings([])
  }

  const saveGarage = useMutation({
    mutationFn: async () => {
      await Promise.all([
        supabase.from('users').update({ garage_name: garageName, phone, address }).eq('id', garageId!),
        supabase.from('garage_configs').update({ config: { ...config?.config, labor_rate: laborRate[0] } }).eq('garage_id', garageId!),
      ])
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-config', garageId] })
      toast.success('Informations sauvegardées')
    },
  })

  const saveWidget = useMutation({
    mutationFn: async () => {
      await supabase.from('garage_configs').update({
        config: { ...config?.config, bot_name: botName, widget_color: widgetColor, widget_position: widgetPosition },
      }).eq('garage_id', garageId!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-config', garageId] })
      toast.success('Widget sauvegardé')
    },
  })

  const saveServices = useMutation({
    mutationFn: async () => {
      await supabase.from('garage_configs').update({
        config: { ...config?.config, services },
      }).eq('garage_id', garageId!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-config', garageId] })
      toast.success('Services sauvegardés')
    },
  })

  const saveReminders = useMutation({
    mutationFn: async () => {
      await supabase.from('garage_configs').update({
        config: { ...config?.config, reminder_frequencies: reminderFreqs },
      }).eq('garage_id', garageId!)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garage-config', garageId] })
      toast.success('Rappels SMS sauvegardés')
    },
  })

  function addService() {
    setServices(prev => [...prev, {
      id: `svc-${Date.now()}`,
      label: 'Nouveau service',
      base_price: 0,
      labor_hours: 1,
      duration_min: 60,
      reminder_type: 'aucun',
    }])
  }

  function updateService(index: number, field: keyof Service, value: string | number) {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeService(index: number) {
    setServices(prev => prev.filter((_, i) => i !== index))
  }

  function copyWidgetCode() {
    const code = `<script src="https://cdn.autolead.ai/widget.js" data-widget-token="${config?.widget_token ?? 'votre-token'}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const embedCode = `<script src="https://cdn.autolead.ai/widget.js"\n        data-widget-token="${config?.widget_token ?? '...'}"></script>`

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configurez votre garage et votre widget</p>
      </div>

      <Tabs defaultValue="garage">
        <TabsList>
          <TabsTrigger value="garage">Garage</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="reminders">Rappels SMS</TabsTrigger>
          <TabsTrigger value="widget">Widget</TabsTrigger>
        </TabsList>

        {/* Tab Garage */}
        <TabsContent value="garage" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du garage</Label>
                <Input value={garageName} onChange={e => setGarageName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Taux horaire main d'œuvre</Label>
                  <span className="text-[13px] font-semibold">{laborRate[0]} €/h</span>
                </div>
                <Slider min={50} max={120} step={5} value={laborRate} onValueChange={setLaborRate} />
                <p className="text-[12px] text-muted-foreground">Utilisé pour calculer le coût des devis automatiques</p>
              </div>
              <Button onClick={() => saveGarage.mutate()} disabled={saveGarage.isPending}>
                {saveGarage.isPending ? 'Sauvegarde…' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Services */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Importer une grille tarifaire (PDF)</CardTitle>
              <CardDescription>
                Téléversez votre grille tarifaire au format PDF — l'IA extrait automatiquement vos services.
                Vous pourrez les vérifier et les modifier avant de sauvegarder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handlePdfUpload(file)
                }}
              />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Choisir un PDF</>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-2">PDF jusqu'à {MAX_PDF_SIZE_MB} Mo. Scans et PDF natifs supportés.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Catalogue de services</CardTitle>
              <CardDescription>Ces services sont utilisés par l'IA pour générer des devis automatiques.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucun service configuré</p>
              )}
              {services.map((svc, i) => (
                <div key={svc.id} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      className="h-7 text-[13px] font-medium border-0 px-0 focus-visible:ring-0"
                      value={svc.label}
                      onChange={e => updateService(i, 'label', e.target.value)}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeService(i)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Prix pièces (€)</Label>
                      <Input type="number" className="h-7 text-[13px]" value={svc.base_price} onChange={e => updateService(i, 'base_price', +e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Heures MO</Label>
                      <Input type="number" step="0.5" className="h-7 text-[13px]" value={svc.labor_hours} onChange={e => updateService(i, 'labor_hours', +e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Durée (min)</Label>
                      <Input type="number" step="15" className="h-7 text-[13px]" value={svc.duration_min} onChange={e => updateService(i, 'duration_min', +e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Type de rappel SMS</Label>
                    <Select
                      value={svc.reminder_type ?? 'aucun'}
                      onValueChange={v => updateService(i, 'reminder_type', v)}
                    >
                      <SelectTrigger className="h-7 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aucun">Aucun rappel</SelectItem>
                        <SelectItem value="revision">Révision (rappel à 12 mois)</SelectItem>
                        <SelectItem value="pneus">Pneus (rappel saisonnier)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addService}>
                <Plus className="h-3.5 w-3.5" /> Ajouter un service
              </Button>
              <div className="pt-2">
                <Button onClick={() => saveServices.mutate()} disabled={saveServices.isPending}>
                  {saveServices.isPending ? 'Sauvegarde…' : 'Sauvegarder les services'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Reminders */}
        <TabsContent value="reminders" className="space-y-4 mt-4">
          <RemindersConfig
            freqs={reminderFreqs}
            onChange={setReminderFreqs}
            garageName={garageName || 'votre garage'}
            garagePhone={phone || '01 23 45 67 89'}
          />
          <Button onClick={() => saveReminders.mutate()} disabled={saveReminders.isPending}>
            {saveReminders.isPending ? 'Sauvegarde…' : 'Sauvegarder les rappels'}
          </Button>
        </TabsContent>

        {/* Tab Widget */}
        <TabsContent value="widget" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Apparence du widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nom du bot</Label>
                <Input value={botName} onChange={e => setBotName(e.target.value)} placeholder="Assistant AutoLead" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Couleur</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="h-9 w-14 cursor-pointer rounded border border-border" />
                    <Input value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="font-mono text-[13px]" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Position</Label>
                  <Select value={widgetPosition} onValueChange={v => setWidgetPosition(v as 'bottom-right' | 'bottom-left')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bas droite</SelectItem>
                      <SelectItem value="bottom-left">Bas gauche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prévisualisation */}
              <div className="relative h-32 rounded-lg border border-dashed border-border bg-muted/30 overflow-hidden">
                <p className="absolute top-3 left-3 text-[11px] text-muted-foreground">Aperçu du widget</p>
                <div
                  className={`absolute bottom-3 ${widgetPosition === 'bottom-right' ? 'right-3' : 'left-3'} flex items-center gap-2 rounded-full px-4 py-2 text-white text-[13px] font-medium shadow-lg`}
                  style={{ backgroundColor: widgetColor }}
                >
                  💬 {botName || 'Assistant AutoLead'}
                </div>
              </div>

              <Button onClick={() => saveWidget.mutate()} disabled={saveWidget.isPending}>
                {saveWidget.isPending ? 'Sauvegarde…' : 'Sauvegarder le widget'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Code d'intégration</CardTitle>
              <CardDescription>Copiez ce code et collez-le avant le &lt;/body&gt; de votre site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea readOnly value={embedCode} className="font-mono text-[12px] resize-none h-16" />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copyWidgetCode}>
                {copied ? <><Check className="h-3.5 w-3.5" /> Copié !</> : <><Copy className="h-3.5 w-3.5" /> Copier le code</>}
              </Button>
              <p className="text-[12px] text-muted-foreground">
                Token : <code className="font-mono">{config?.widget_token ?? '...'}</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={extractedServices !== null} onOpenChange={open => { if (!open) cancelImport() }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> Services extraits du PDF
            </DialogTitle>
            <DialogDescription>
              Vérifiez et ajustez les libellés et prix avant de les ajouter à votre catalogue.
            </DialogDescription>
          </DialogHeader>

          {importWarnings.length > 0 && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-[12px] text-yellow-900">
              <p className="font-medium mb-1">Avertissements :</p>
              <ul className="list-disc list-inside space-y-0.5">
                {importWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            {extractedServices?.map((svc, i) => (
              <div key={`${svc.id}-${i}`} className="rounded-lg border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    className="h-7 text-[13px] font-medium border-0 px-0 focus-visible:ring-0"
                    value={svc.label}
                    onChange={e => updateExtractedService(i, 'label', e.target.value)}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeExtractedService(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Prix pièces (€)</Label>
                    <Input type="number" className="h-7 text-[13px]" value={svc.base_price} onChange={e => updateExtractedService(i, 'base_price', +e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Heures MO</Label>
                    <Input type="number" step="0.5" className="h-7 text-[13px]" value={svc.labor_hours} onChange={e => updateExtractedService(i, 'labor_hours', +e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Durée (min)</Label>
                    <Input type="number" step="15" className="h-7 text-[13px]" value={svc.duration_min} onChange={e => updateExtractedService(i, 'duration_min', +e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Type de rappel SMS</Label>
                  <Select
                    value={svc.reminder_type ?? 'aucun'}
                    onValueChange={v => updateExtractedService(i, 'reminder_type', v)}
                  >
                    <SelectTrigger className="h-7 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aucun">Aucun rappel</SelectItem>
                      <SelectItem value="revision">Révision (rappel à 12 mois)</SelectItem>
                      <SelectItem value="pneus">Pneus (rappel saisonnier)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border p-3 space-y-2">
            <p className="text-[12px] font-medium">Mode d'import</p>
            <RadioGroup value={mergeMode} onValueChange={v => setMergeMode(v as 'replace' | 'append')}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="replace" id="merge-replace" className="mt-0.5" />
                <Label htmlFor="merge-replace" className="text-[13px] font-normal cursor-pointer">
                  Remplacer la liste actuelle ({services.length} service{services.length > 1 ? 's' : ''})
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="append" id="merge-append" className="mt-0.5" />
                <Label htmlFor="merge-append" className="text-[13px] font-normal cursor-pointer">
                  Ajouter aux services existants
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelImport}>Annuler</Button>
            <Button onClick={confirmImport} disabled={!extractedServices?.length}>
              Confirmer l'import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// RemindersConfig — éditeur des rappels SMS (révision + pneus)
// ============================================================

const SMS_PLACEHOLDERS = [
  { key: '{client_name}', label: 'Prénom du client' },
  { key: '{vehicle}', label: 'Véhicule (marque + modèle)' },
  { key: '{garage_name}', label: 'Nom du garage' },
  { key: '{phone}', label: 'Téléphone du garage' },
]

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

function renderPreview(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

function RemindersConfig({
  freqs,
  onChange,
  garageName,
  garagePhone,
}: {
  freqs: ReminderFrequencies
  onChange: (next: ReminderFrequencies) => void
  garageName: string
  garagePhone: string
}) {
  const previewVars = useMemo(() => ({
    client_name: 'Jean',
    vehicle: 'Renault Clio',
    garage_name: garageName,
    phone: garagePhone,
  }), [garageName, garagePhone])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[15px]">Comment ça marche ?</CardTitle>
          <CardDescription>
            Les rappels sont envoyés automatiquement par SMS aux clients ayant donné leur consentement. Vous pouvez activer/désactiver chaque type, choisir la fréquence, et personnaliser le message.
          </CardDescription>
        </CardHeader>
      </Card>

      <RevisionCard
        cfg={freqs.revision ?? DEFAULT_REMINDER_FREQUENCIES.revision!}
        onChange={r => onChange({ ...freqs, revision: r })}
        previewVars={previewVars}
      />

      <SeasonalCard
        title="Pneus hiver"
        description="Rappel envoyé aux clients ayant fait monter des pneus dans les 12 derniers mois."
        cfg={freqs.pneus_hiver ?? DEFAULT_REMINDER_FREQUENCIES.pneus_hiver!}
        onChange={r => onChange({ ...freqs, pneus_hiver: r })}
        previewVars={previewVars}
      />

      <SeasonalCard
        title="Pneus été"
        description="Rappel envoyé aux clients ayant fait monter des pneus dans les 12 derniers mois."
        cfg={freqs.pneus_ete ?? DEFAULT_REMINDER_FREQUENCIES.pneus_ete!}
        onChange={r => onChange({ ...freqs, pneus_ete: r })}
        previewVars={previewVars}
      />
    </div>
  )
}

function PlaceholderHelp() {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground mb-1">Placeholders disponibles :</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {SMS_PLACEHOLDERS.map(p => (
          <span key={p.key} className="text-[11px] text-muted-foreground">
            <code className="rounded bg-background px-1 py-0.5 text-[10px] font-mono">{p.key}</code>
            <span className="ml-1">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function SmsTextarea({
  value,
  onChange,
  previewVars,
}: {
  value: string
  onChange: (v: string) => void
  previewVars: Record<string, string>
}) {
  const preview = renderPreview(value, previewVars)
  const length = preview.length
  const segments = length === 0 ? 0 : Math.ceil(length / 160)
  const warning = length > 160

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="font-mono text-[12px]"
      />
      <PlaceholderHelp />
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-[11px] font-medium text-muted-foreground mb-1">Aperçu (Jean — Renault Clio) :</p>
        <p className="text-[13px] leading-relaxed">{preview}</p>
      </div>
      <p className={cn('text-[11px]', warning ? 'text-yellow-600' : 'text-muted-foreground')}>
        {length} caractère{length > 1 ? 's' : ''} · {segments} SMS
        {warning && ' — au-delà de 160 caractères, le SMS est facturé en plusieurs segments'}
      </p>
    </div>
  )
}

function RevisionCard({
  cfg,
  onChange,
  previewVars,
}: {
  cfg: NonNullable<ReminderFrequencies['revision']>
  onChange: (cfg: NonNullable<ReminderFrequencies['revision']>) => void
  previewVars: Record<string, string>
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[15px]">Révision</CardTitle>
            <CardDescription>
              Rappel envoyé X mois après chaque révision marquée comme terminée dans l'agenda.
            </CardDescription>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={v => onChange({ ...cfg, enabled: v })}
          />
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', !cfg.enabled && 'opacity-50 pointer-events-none')}>
        <div className="space-y-1.5">
          <Label className="text-[13px]">Intervalle (en mois)</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={60}
              value={cfg.interval_months}
              onChange={e => onChange({ ...cfg, interval_months: Math.max(1, Math.min(60, +e.target.value || 12)) })}
              className="w-24"
            />
            <span className="text-[13px] text-muted-foreground">
              {cfg.interval_months === 12 ? '= 1 an' : cfg.interval_months === 24 ? '= 2 ans' : `= ${(cfg.interval_months / 12).toFixed(1)} an(s)`}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Message SMS</Label>
          <SmsTextarea
            value={cfg.sms_template}
            onChange={v => onChange({ ...cfg, sms_template: v })}
            previewVars={previewVars}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function SeasonalCard({
  title,
  description,
  cfg,
  onChange,
  previewVars,
}: {
  title: string
  description: string
  cfg: NonNullable<ReminderFrequencies['pneus_hiver']>
  onChange: (cfg: NonNullable<ReminderFrequencies['pneus_hiver']>) => void
  previewVars: Record<string, string>
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[15px]">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={v => onChange({ ...cfg, enabled: v })}
          />
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-4', !cfg.enabled && 'opacity-50 pointer-events-none')}>
        <div className="space-y-1.5">
          <Label className="text-[13px]">Date d'envoi annuelle</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={31}
              value={cfg.send_day}
              onChange={e => onChange({ ...cfg, send_day: Math.max(1, Math.min(31, +e.target.value || 1)) })}
              className="w-20"
            />
            <Select
              value={String(cfg.send_month)}
              onValueChange={v => onChange({ ...cfg, send_month: +v })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS_FR.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[12px] text-muted-foreground">de chaque année</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[13px]">Message SMS</Label>
          <SmsTextarea
            value={cfg.sms_template}
            onChange={v => onChange({ ...cfg, sms_template: v })}
            previewVars={previewVars}
          />
        </div>
      </CardContent>
    </Card>
  )
}
