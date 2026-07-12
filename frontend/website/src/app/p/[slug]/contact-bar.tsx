'use client';

import { Phone, MessageSquare } from 'lucide-react';
import { trackClick } from './event-tracker';
import { useKeyboardFocus } from '@/hooks/use-keyboard-focus';

export function ContactBar({
  slug,
  agentPhone,
  agentWhatsapp,
  propertyTitle,
}: {
  slug: string;
  agentPhone?: string | null;
  agentWhatsapp?: string | null;
  propertyTitle: string;
}) {
  if (!agentPhone && !agentWhatsapp) return null;

  const wa = agentWhatsapp
    ? `https://wa.me/${normalize(agentWhatsapp)}?text=${encodeURIComponent(`Hi, I'm interested in this property: ${propertyTitle}`)}`
    : null;
  const tel = agentPhone ? `tel:+${normalize(agentPhone)}` : null;

  const { isKeyboardOpen, isTransitioning } = useKeyboardFocus();

  return (
    <>
      {/* Mobile sticky bar */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 bg-white border-t shadow-[0_-8px_24px_rgba(0,0,0,0.06)] p-4 pb-safe flex gap-3 z-50 animate-slide-in-up ${isTransitioning ? 'transition-none' : 'transition-all duration-300'} ${isKeyboardOpen ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(slug, 'CLICK_WHATSAPP')}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-primary-foreground font-semibold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/10"
          >
            <MessageSquare className="h-4.5 w-4.5 fill-current" /> WhatsApp
          </a>
        )}
        {tel && (
          <a
            href={tel}
            onClick={() => trackClick(slug, 'CLICK_CALL')}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-semibold py-3.5 rounded-xl text-sm transition-all shadow-md shadow-primary/10"
          >
            <Phone className="h-4.5 w-4.5" /> Call
          </a>
        )}
      </div>

      {/* Desktop inline */}
      <div className="hidden md:flex gap-2.5">
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(slug, 'CLICK_WHATSAPP')}
            className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-primary-foreground font-semibold px-4.5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            <MessageSquare className="h-4 w-4 fill-current" /> WhatsApp
          </a>
        )}
        {tel && (
          <a
            href={tel}
            onClick={() => trackClick(slug, 'CLICK_CALL')}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground font-semibold px-4.5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            <Phone className="h-4 w-4" /> Call Agent
          </a>
        )}
      </div>
    </>
  );
}

function normalize(num: string): string {
  const digits = num.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
