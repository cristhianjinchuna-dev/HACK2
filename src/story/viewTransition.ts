import type { CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import type { NavigateFunction, To } from 'react-router-dom';

// ¿El usuario pidió reducir el movimiento en su sistema?
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Navega con View Transition API si existe; si no (o con reduced motion) → navegación normal
export function navigateWithTransition(navigate: NavigateFunction, to: To, state?: unknown) {
  if (!('startViewTransition' in document) || prefersReducedMotion()) {
    navigate(to, { state });
    return;
  }
  document.startViewTransition(() => {
    // flushSync: React pinta la página nueva YA, para que el navegador tome la "foto" final
    flushSync(() => {
      navigate(to, { state });
    });
  });
}

// Mismo nombre en dos páginas = ese elemento "vuela" de una a otra
export function transitionName(name: string): CSSProperties {
  return { viewTransitionName: name } as CSSProperties;
}