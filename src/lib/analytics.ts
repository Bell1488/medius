declare global {
  interface Window {
    ym?: ((counterId: number, action: string, ...args: unknown[]) => void) & { a?: unknown[]; l?: number };
    dataLayer?: unknown[];
  }
}

const DEFAULT_METRIKA_ID = 113716616;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid'] as const;
const ATTRIBUTION_KEY = 'medius_attribution';

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {};

  const current = new URLSearchParams(window.location.search);
  const stored = readAttribution();
  const next: Attribution = { ...stored };

  UTM_KEYS.forEach((key) => {
    const value = current.get(key);
    if (value) next[key] = value.slice(0, 200);
  });

  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(next));
  } catch {
    // Storage may be disabled; the lead can still be sent without attribution.
  }

  return next;
}

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  try {
    const value = window.sessionStorage.getItem(ATTRIBUTION_KEY);
    return value ? JSON.parse(value) as Attribution : {};
  } catch {
    return {};
  }
}

export function trackGoal(goal: string, params?: Record<string, unknown>) {
  const counterId = Number(import.meta.env.VITE_YANDEX_METRIKA_ID || DEFAULT_METRIKA_ID);
  if (counterId > 0 && typeof window !== 'undefined' && window.ym) {
    window.ym(counterId, 'reachGoal', goal, params);
  }
}

export function initMetrika() {
  const counterId = Number(import.meta.env.VITE_YANDEX_METRIKA_ID || DEFAULT_METRIKA_ID);
  if (!counterId || typeof window === 'undefined' || window.ym) return;

  window.ym = function (...args: unknown[]) {
    (window.ym!.a = window.ym!.a || []).push(args);
  };
  window.ym.l = Date.now();
  window.ym.a = [];
  window.dataLayer = window.dataLayer || [];

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
  script.onload = () => window.ym?.(counterId, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: window.location.href,
    accurateTrackBounce: true,
    trackLinks: true,
  });
  document.head.appendChild(script);
}
