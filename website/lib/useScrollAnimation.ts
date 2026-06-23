'use client';

// Shared ScrollTrigger plumbing so every pinned section follows the same pattern.
// - registers the plugin once
// - exposes prefersReducedMotion()
// - usePinnedSection(): pins a section and returns a scrubbed timeline you fill in
//   with reveals; automatically becomes a no-op (static content) under reduced motion.

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

type BuildTimeline = (
  tl: gsap.core.Timeline,
  ctx: { root: HTMLElement; q: (sel: string) => Element[] }
) => void;

/**
 * Pin `root` for `distance` (× viewport height) and scrub a timeline through it.
 * Under reduced motion, content is shown statically with a soft fade-in instead.
 */
export function usePinnedSection<T extends HTMLElement = HTMLDivElement>(
  build: BuildTimeline,
  distance = 1.1
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    // Full experience — pinned + scrubbed.
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: () => `+=${window.innerHeight * distance}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
          },
        });
        build(tl, { root, q: (sel) => gsap.utils.toArray(root.querySelectorAll(sel)) });
      }, root);
      return () => ctx.revert();
    });

    // Reduced motion — no pin, no scrub. Just reveal once on enter.
    mm.add('(prefers-reduced-motion: reduce)', () => {
      const ctx = gsap.context(() => {
        gsap.from(root.querySelectorAll('[data-reveal]'), {
          opacity: 0,
          y: 20,
          duration: 0.6,
          stagger: 0.08,
          scrollTrigger: { trigger: root, start: 'top 75%' },
        });
      }, root);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [build, distance]);

  return ref;
}

/** Simple staggered reveal for non-pinned sections (intro, footer, etc.). */
export function useReveal<T extends HTMLElement = HTMLDivElement>(selector = '[data-reveal]') {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll(selector), {
        opacity: 0,
        y: reduce ? 12 : 40,
        duration: reduce ? 0.5 : 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: 'top 78%' },
      });
    }, root);
    return () => ctx.revert();
  }, [selector]);
  return ref;
}

export { gsap, ScrollTrigger };
