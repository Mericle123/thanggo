'use client';

// Lenis smooth scroll, correctly synced with GSAP ScrollTrigger:
//   • Lenis 'scroll' event drives ScrollTrigger.update() and publishes page progress
//   • lenis.raf(time) is driven from gsap.ticker (single RAF loop, no drift)
//   • gsap.ticker.lagSmoothing(0) so scrubbed timelines stay locked to scroll
// Under prefers-reduced-motion we skip Lenis entirely and use native scroll.

import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState } from '@/lib/scrollState';

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    scrollState.width = window.innerWidth;

    const publishProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollState.progress = max > 0 ? window.scrollY / max : 0;
    };
    const onResize = () => {
      scrollState.width = window.innerWidth;
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', onResize);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      window.addEventListener('scroll', publishProgress, { passive: true });
      publishProgress();
      return () => {
        window.removeEventListener('scroll', publishProgress);
        window.removeEventListener('resize', onResize);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', (e: { velocity: number }) => {
      ScrollTrigger.update();
      publishProgress();
      // smoothed velocity for the 3D "energy"
      scrollState.velocity += (Math.min(Math.abs(e.velocity), 40) - scrollState.velocity) * 0.2;
    });

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Smooth-scroll EVERY in-page anchor (nav, hamburger, CTAs) through Lenis.
    const onAnchorClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href') || '';
      if (id.length < 2) return; // ignore "#"
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -10, duration: 1.3 });
    };
    document.addEventListener('click', onAnchorClick);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      document.removeEventListener('click', onAnchorClick);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return <>{children}</>;
}
