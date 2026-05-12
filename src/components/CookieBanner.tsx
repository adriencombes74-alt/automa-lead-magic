import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";

const STORAGE_KEY = "cookie-consent";
const OPEN_EVENT = "cookie-banner:open";

export type CookieConsent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  date: string;
};

export const getCookieConsent = (): CookieConsent | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookieConsent) : null;
  } catch {
    return null;
  }
};

export const openCookieBanner = () => {
  window.dispatchEvent(new Event(OPEN_EVENT));
};

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true);
    const reopen = () => {
      const current = getCookieConsent();
      setAnalytics(current?.analytics ?? false);
      setMarketing(current?.marketing ?? false);
      setVisible(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  const save = (consent: Omit<CookieConsent, "essential" | "date">) => {
    const payload: CookieConsent = {
      essential: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      date: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setVisible(false);
    setDetailOpen(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-lg backdrop-blur md:px-6">
        <div className="container-page flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-[13px] leading-relaxed text-muted-foreground md:max-w-3xl">
            Nous utilisons des cookies pour faire fonctionner le site et, avec votre accord, mesurer son audience.
            Vous pouvez accepter, refuser ou choisir cookie par cookie. Voir notre{" "}
            <Link to="/cookies" className="underline hover:text-foreground">
              politique cookies
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDetailOpen(true)}>
              Personnaliser
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              Tout refuser
            </Button>
            <Button size="sm" onClick={() => save({ analytics: true, marketing: true })}>
              Tout accepter
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Préférences cookies</DialogTitle>
            <DialogDescription>
              Choisissez les catégories que vous autorisez. Vous pouvez revenir sur ce choix à tout moment depuis le footer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Essentiels</p>
                <p className="text-xs text-muted-foreground">
                  Nécessaires au fonctionnement du site (session, sécurité). Ne peuvent pas être désactivés.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Mesure d'audience</p>
                <p className="text-xs text-muted-foreground">
                  Statistiques anonymisées pour comprendre comment le site est utilisé.
                </p>
              </div>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Marketing</p>
                <p className="text-xs text-muted-foreground">
                  Personnalisation des contenus et publicités, suivi de conversion.
                </p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => save({ analytics: false, marketing: false })}
            >
              Tout refuser
            </Button>
            <Button onClick={() => save({ analytics, marketing })}>
              Enregistrer mes choix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieBanner;
