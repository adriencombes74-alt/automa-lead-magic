import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Reveal from "@/components/motion/Reveal";

const faqs = [
  {
    q: "Je ne suis pas du tout à l'aise avec l'informatique. C'est compliqué ?",
    a: "Non. L'installation prend 3 minutes et notre équipe le fait pour vous gratuitement si besoin. Si vous savez envoyer un SMS, vous savez utiliser AutoLead AI.",
  },
  {
    q: "Et si l'IA dit une bêtise à un client ?",
    a: "L'IA est entraînée uniquement sur vos tarifs et vos prestations. Elle ne s'invente rien. En cas de doute, elle vous transfère la conversation. Vous gardez toujours le contrôle.",
  },
  {
    q: "Est-ce que ça marche sans site internet ?",
    a: "Oui. AutoLead fonctionne sur WhatsApp, Messenger, Instagram et votre fiche Google. Aucun site requis.",
  },
  {
    q: "L'IA répond aussi aux appels téléphoniques ?",
    a: "Oui, sur le plan Premium. L'IA décroche à votre place, identifie le besoin (devis, RDV, info), et soit envoie un SMS de suivi, soit transfère l'appel selon vos règles. Vous récupérez la transcription dans votre tableau de bord.",
  },
  {
    q: "Les relances révisions et pneus hiver, ça marche comment ?",
    a: "Inclus dans les plans Pro et Premium. Quand vous prenez un RDV, l'IA programme automatiquement une relance SMS à la bonne échéance — 6 ou 12 mois pour la révision, octobre pour les pneus hiver. Le client n'a qu'à répondre pour caler le RDV.",
  },
  {
    q: "Combien de temps je gagne par semaine ?",
    a: "En moyenne 8 à 12 heures pour un garage qui reçoit 30 demandes/semaine. Soit l'équivalent d'une journée complète.",
  },
  {
    q: "Je peux annuler quand je veux ?",
    a: "Oui. Aucun engagement. Vous testez 14 jours gratuitement, sans carte bancaire. Vous arrêtez en un clic.",
  },
  {
    q: "Mes clients vont savoir que c'est un robot ?",
    a: "Le ton est naturel et adapté à votre garage. Beaucoup de clients pensent que c'est vous. Vous pouvez choisir d'afficher ou non que c'est une IA.",
  },
];

const Faq = () => (
  <section id="faq" className="border-b border-border bg-surface py-20 md:py-28">
    <div className="container-page grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
      <Reveal>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          FAQ
        </span>
        <h2 className="text-display mt-3 text-[34px] sm:text-[44px]">
          Les vraies questions <br /> qu'on nous pose.
        </h2>
        <p className="mt-4 text-[15px] text-muted-foreground">
          Une question qui n'est pas listée ? Écrivez-nous, on répond en moins d'une heure.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-background px-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-b-0">
              <AccordionTrigger className="px-4 text-left font-display text-[16px] font-semibold tracking-tight transition-colors hover:bg-muted/40 hover:no-underline data-[state=open]:bg-muted/30">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="px-4 text-[14px] leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </div>
  </section>
);

export default Faq;
