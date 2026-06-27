'use client';

// Scroll-scrubbed video (Hubtown-style): the video's currentTime is driven by scroll, so
// it plays FORWARD as you scroll down and BACKWARD as you scroll up — you're "scrubbing"
// the footage with the wheel. Pinned full-screen while the tall section scrolls past.
// Small SD clips keep seeking buttery. Decoder is primed with a muted play()/pause().
import { useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';

export default function ScrubVideo({
  src,
  eyebrow,
  title,
  line,
  accent = '#A3E635',
  id,
}: {
  src: string;
  eyebrow: string;
  title: string;
  line: string;
  accent?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const vRef = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const raf = useRef(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // prime the decoder so frames render while we only ever seek (never "play")
  useEffect(() => {
    const v = vRef.current;
    if (!v) return;
    const prime = () => {
      v.play().then(() => v.pause()).catch(() => {});
    };
    if (v.readyState >= 1) prime();
    else v.addEventListener('loadedmetadata', prime, { once: true });

    // smooth, rAF-eased seeking toward the scroll target (avoids decode thrash)
    const loop = () => {
      if (v.duration) {
        const want = target.current * v.duration;
        const cur = v.currentTime;
        const next = cur + (want - cur) * 0.18;
        if (Math.abs(want - cur) > 0.005) v.currentTime = next;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    target.current = Math.max(0, Math.min(1, p));
  });

  const textO = useTransform(scrollYProgress, [0, 0.12, 0.82, 1], [0, 1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const barW = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id={id} ref={ref} className="relative bg-[color:var(--bg)]" style={{ height: '320vh' }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <video
          ref={vRef}
          src={src}
          muted
          playsInline
          preload="auto"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ 'webkit-playsinline': 'true' } as any)}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/25 to-[#08090C]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08090C]/80 via-transparent to-transparent" />

        <motion.div style={{ opacity: textO, y: textY }} className="absolute inset-0 flex flex-col justify-end px-6 pb-24 sm:px-16 sm:pb-28">
          <div className="mx-auto w-full max-w-[1280px]">
            <span className="font-display text-xs font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>{eyebrow}</span>
            <h2 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[0.92] text-white sm:text-8xl">{title}</h2>
            <p className="mt-4 max-w-md text-lg text-white/75">{line}</p>
          </div>
        </motion.div>

        {/* scrub progress */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--surface)]">
          <motion.div className="h-full" style={{ width: barW, background: accent }} />
        </div>
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 rotate-90 text-xs uppercase tracking-[0.3em] text-white/40 sm:block">scroll to scrub ▸◂</div>
      </div>
    </section>
  );
}
