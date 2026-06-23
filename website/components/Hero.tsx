'use client';

// Dark split hero (reference): bold "Play. Compete. Connect." on the left over near-black,
// an auto-rotating sport-photo carousel on the right with dot indicators, and store badges.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HERO, ACCENT } from '@/lib/theme';

function AppleBadge() {
  return (
    <a href="#join" className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 transition-colors hover:bg-white/10">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden>
        <path d="M16.365 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.98 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.2-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zM20.93 17.14c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8C3.54 18.38 2.5 15.57 2.5 12.92c0-4.28 2.8-6.55 5.55-6.55 1.45 0 2.68.95 3.6.95.86 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.46z" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] text-white/60">Download on the</span>
        <span className="block text-sm font-semibold text-white">App Store</span>
      </span>
    </a>
  );
}
function PlayBadge() {
  return (
    <a href="#join" className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 transition-colors hover:bg-white/10">
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path d="M3 2.5l11 9.5L3 21.5z" fill={ACCENT} />
        <path d="M3 2.5l8 9.5-8 9.5c-.4-.2-.6-.6-.6-1.1V3.6c0-.5.2-.9.6-1.1z" fill="#38BDF8" />
      </svg>
      <span className="text-left leading-tight">
        <span className="block text-[10px] text-white/60">GET IT ON</span>
        <span className="block text-sm font-semibold text-white">Google Play</span>
      </span>
    </a>
  );
}

export default function Hero() {
  const [i, setI] = useState(0);
  const n = HERO.slides.length;
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n]);

  return (
    <section id="home" className="relative overflow-hidden bg-[#0A0B0E] pt-20">
      {/* right-side image carousel, bleeding to the top-right */}
      <div className="absolute right-0 top-0 h-[58%] w-full sm:h-[70%] lg:h-full lg:w-[60%]">
        {HERO.slides.map((src, idx) => (
          <div key={src} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: idx === i ? 1 : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        {/* fade into the dark base on the left + bottom so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-transparent to-transparent lg:bg-gradient-to-b lg:from-transparent" />

        {/* dot indicators */}
        <div className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2.5 lg:flex">
          {HERO.slides.map((_, idx) => (
            <button
              key={idx}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => setI(idx)}
              className="rounded-full transition-all"
              style={{ width: 8, height: 8, background: idx === i ? ACCENT : 'rgba(255,255,255,0.35)', transform: idx === i ? 'scale(1.3)' : 'scale(1)' }}
            />
          ))}
        </div>
      </div>

      {/* text */}
      <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-[1280px] items-center px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-lg py-24 lg:py-32"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
            {HERO.eyebrow}
          </p>
          <h1 className="mt-5 font-display text-6xl font-extrabold leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl">
            {HERO.lines.map((line, idx) => (
              <span key={line} className="block" style={idx === HERO.lines.length - 1 ? { color: ACCENT } : undefined}>
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-md text-base text-white/65 sm:text-lg">{HERO.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AppleBadge />
            <PlayBadge />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
