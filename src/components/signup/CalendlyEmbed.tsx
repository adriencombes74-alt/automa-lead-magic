import { InlineWidget } from 'react-calendly'

type Props = {
  garageName: string
  email: string
}

export function CalendlyEmbed({ garageName, email }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <InlineWidget
        url="https://calendly.com/automobilelead-ia/configurer-mon-assistant-autolead-ai"
        prefill={{ name: garageName, email }}
        utm={{ utmSource: 'signup_success' }}
        pageSettings={{
          backgroundColor: 'ffffff',
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '2563eb',
          textColor: '1a1a1a',
        }}
        styles={{ height: 720, width: '100%' }}
      />
    </div>
  )
}
