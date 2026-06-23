'use client';

// "One App. Every Sport." closing band — headline, four quick-feature items, and the
// primary lime CTA. Matches the reference's compact dark footer-CTA strip.
import { motion } from 'framer-motion';
import { CTA_FEATURES, ACCENT } from '@/lib/theme';

function Icon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: ACCENT, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'calendar') return (<svg {...common}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>);
  if (name === 'users') return (<svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M17 11a3 3 0 1 0-1-5.8M21.5 20a6 6 0 0 0-5-5.9" /></svg>);
  if (name === 'trophy') return (<svg {...common}><path d="M6 4h12v4a6 6 0 0 1-12 0zM6 6H3v1a3 3 0 0 0 3 3M18 6h3v1a3 3 0 0 1-3 3M9 18h6M10 14v4M14 14v4M8 21h8" /></svg>);
  return (<svg {...common}><path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" /></svg>); // shield
}

export default function OneApp() {
  return (
    <section id="join" className="border-t border-white/5 bg-[#0A0B0E] py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl font-extrabold leading-[0.95] text-white sm:text-5xl"
        >
          One App.
          <br />
          <span style={{ color: ACCENT }}>Every Sport.</span>
        </motion.h2>

        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 lg:w-auto lg:gap-x-10">
          {CTA_FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                <Icon name={f.icon} />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-white/55">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <a href="#home" className="rounded-full px-7 py-3 text-base font-bold text-black transition-transform hover:scale-105" style={{ background: ACCENT }}>
            Join ThangGo Today
          </a>
          <span className="text-xs text-white/55">It&apos;s free. It&apos;s for everyone.</span>
        </div>
      </div>
    </section>
  );
}
