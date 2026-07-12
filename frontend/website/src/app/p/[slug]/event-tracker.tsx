'use client';

import { useEffect, useRef } from 'react';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1';

export function EventTracker({ slug }: { slug: string }) {
  const startedAt = useRef<number>(Date.now());
  const maxScrollPct = useRef<number>(0);
  const sessionId = useRef<string>(getOrCreateSession(slug));
  const sentBeacon = useRef<boolean>(false);

  useEffect(() => {
    // page view
    void fetch(`${API}/smart-links/${slug}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({ eventType: 'VIEW', sessionId: sessionId.current, referrer: document.referrer || undefined }),
    }).catch(() => null);

    function onScroll() {
      const h = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const pct = Math.min(100, Math.round((window.scrollY / h) * 100));
      if (pct > maxScrollPct.current) maxScrollPct.current = pct;
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    function flush() {
      if (sentBeacon.current) return;
      sentBeacon.current = true;
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const payload = JSON.stringify({
        eventType: 'SESSION_END',
        sessionId: sessionId.current,
        timeOnPageSeconds: elapsed,
        scrollDepthPct: maxScrollPct.current,
      });
      try {
        navigator.sendBeacon?.(
          `${API}/smart-links/${slug}/events`,
          new Blob([payload], { type: 'application/json' }),
        );
      } catch {
        /* ignore */
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);

    return () => {
      window.removeEventListener('scroll', onScroll);
      flush();
    };
  }, [slug]);

  return null;
}

export function trackClick(slug: string, eventType: string) {
  void fetch(`${API}/smart-links/${slug}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ eventType, sessionId: getOrCreateSession(slug) }),
  }).catch(() => null);
}

function getOrCreateSession(slug: string): string {
  if (typeof window === 'undefined') return '';
  const key = `sb_sid_${slug}`;
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, sid);
  }
  return sid;
}
