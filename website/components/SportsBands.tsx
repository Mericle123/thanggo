'use client';

// The numbered sport bands — full-bleed photo rows (Basketball 02 → Run Club 10).
// Each: photo bleeding from the right, darkened on the left for the icon + title + tagline,
// big accent number on the right. Rows reveal + the photo parallaxes slightly on scroll.
import { motion } from 'framer-motion';
import { BANDS } from '@/lib/theme';

export default function SportsBands() {
  return (
    <section id="sports" className="bg-[#0A0B0E]">
      {BANDS.map((b, idx) => (
        <motion.a
          key={b.name}
          href="#join"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="group relative block h-[128px] overflow-hidden border-t border-white/5 sm:h-[140px]"
        >
          {/* photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={b.img}
            alt={b.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          {/* darken left for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0B0E] via-[#0A0B0E]/85 to-[#0A0B0E]/10" />
          <div className="absolute inset-0 bg-[#0A0B0E]/20" />
          {/* accent wipe on hover */}
          <div className="absolute inset-y-0 left-0 w-1 origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100" style={{ background: b.accent }} />

          <div className="relative mx-auto flex h-full max-w-[1280px] items-center justify-between px-5 sm:px-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl ring-2 transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16"
                style={{ background: `${b.accent}1f`, boxShadow: `inset 0 0 0 2px ${b.accent}` , color: b.accent }}
              >
                {b.emoji}
              </span>
              <div>
                <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{b.name}</h3>
                <p className="mt-1 hidden text-sm leading-snug text-white/65 sm:block">
                  {b.l1}<br />{b.l2}
                </p>
              </div>
            </div>

            <span
              className="font-display text-5xl font-extrabold tabular-nums transition-all duration-300 group-hover:scale-110 sm:text-6xl"
              style={{ color: b.accent, textShadow: `0 0 30px ${b.accent}40` }}
            >
              {b.no}
            </span>
          </div>
        </motion.a>
      ))}
    </section>
  );
}
