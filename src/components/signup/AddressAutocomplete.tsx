import { useEffect, useRef, useState } from 'react'
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined

let scriptPromise: Promise<void> | null = null

function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject()
  if ((window as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places) return Promise.resolve()
  if (scriptPromise) return scriptPromise
  if (!API_KEY) return Promise.reject(new Error('missing key'))
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&language=fr&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('failed to load google maps'))
    document.head.appendChild(script)
  })
  return scriptPromise
}

export type AddressValue = {
  address: string
  city: string
  postalCode: string
}

type Props = {
  value: AddressValue
  onChange: (value: AddressValue) => void
  errors?: Partial<Record<keyof AddressValue, string>>
}

export function AddressAutocomplete(props: Props) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(!API_KEY)

  useEffect(() => {
    if (!API_KEY) return
    loadGoogleMaps().then(() => setReady(true)).catch(() => setFailed(true))
  }, [])

  if (failed) return <ManualFields {...props} />
  if (!ready) return <ManualFields {...props} loading />
  return <AutocompleteField {...props} />
}

function AutocompleteField({ value, onChange, errors }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const {
    ready,
    value: query,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { componentRestrictions: { country: 'fr' }, types: ['address'] },
    debounce: 250,
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (value.address && !query) setValue(value.address, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSelect(description: string) {
    setValue(description, false)
    clearSuggestions()
    setOpen(false)
    try {
      const results = await getGeocode({ address: description })
      const components = results[0]?.address_components ?? []
      let streetNumber = '', route = '', city = '', postalCode = ''
      for (const c of components) {
        if (c.types.includes('street_number')) streetNumber = c.long_name
        else if (c.types.includes('route')) route = c.long_name
        else if (c.types.includes('locality')) city = c.long_name
        else if (c.types.includes('postal_code')) postalCode = c.long_name
      }
      const street = [streetNumber, route].filter(Boolean).join(' ').trim() || description
      onChange({ address: street, city, postalCode })
    } catch {
      onChange({ ...value, address: description })
    }
  }

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <Label htmlFor="address-autocomplete">Adresse du garage</Label>
      <div className="relative">
        <Input
          id="address-autocomplete"
          autoComplete="off"
          placeholder="Commencez à taper votre adresse…"
          value={query}
          disabled={!ready}
          onChange={e => { setValue(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {open && status === 'OK' && data.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover shadow-lg">
            {data.map(s => (
              <li
                key={s.place_id}
                role="button"
                tabIndex={0}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
                onMouseDown={e => { e.preventDefault(); handleSelect(s.description) }}
              >
                <span className="font-medium">{s.structured_formatting.main_text}</span>{' '}
                <span className="text-muted-foreground">{s.structured_formatting.secondary_text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {value.city && value.postalCode && (
        <p className="text-[12px] text-muted-foreground">
          {value.city} · {value.postalCode}
        </p>
      )}
      {errors?.address && <p className="text-[12px] text-destructive">{errors.address}</p>}
    </div>
  )
}

function ManualFields({
  value,
  onChange,
  errors,
  loading,
}: Props & { loading?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="address-street">Adresse du garage</Label>
        <Input
          id="address-street"
          placeholder="12 rue de la République"
          autoComplete="street-address"
          disabled={loading}
          value={value.address}
          onChange={e => onChange({ ...value, address: e.target.value })}
          className={cn(errors?.address && 'border-destructive')}
        />
        {errors?.address && <p className="text-[12px] text-destructive">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="address-city">Ville</Label>
          <Input
            id="address-city"
            placeholder="Lyon"
            autoComplete="address-level2"
            disabled={loading}
            value={value.city}
            onChange={e => onChange({ ...value, city: e.target.value })}
            className={cn(errors?.city && 'border-destructive')}
          />
          {errors?.city && <p className="text-[12px] text-destructive">{errors.city}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-postal">Code postal</Label>
          <Input
            id="address-postal"
            placeholder="69001"
            inputMode="numeric"
            autoComplete="postal-code"
            disabled={loading}
            value={value.postalCode}
            onChange={e => onChange({ ...value, postalCode: e.target.value })}
            className={cn(errors?.postalCode && 'border-destructive')}
          />
          {errors?.postalCode && <p className="text-[12px] text-destructive">{errors.postalCode}</p>}
        </div>
      </div>
    </div>
  )
}
