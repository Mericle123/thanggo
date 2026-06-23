'use client';

// Dark navbar: transparent over the hero, frosts to near-black on scroll. Center links
// + a single "Get the app" CTA (links to the download section). Animated mobile menu.
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV_MAIN, ACCENT } from '@/lib/theme';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-[#0A0B0E]/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8">
          <a href="#home" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <span className="grid h-7 w-7 place-items-center rounded-md" style={{ background: ACCENT }}>
              <span className="text-sm font-black text-black">T</span>
            </span>
            <span className="italic">ThangGo</span>
          </a>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_MAIN.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-white/75 transition-colors hover:text-white">
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <a href="#download" className="rounded-full px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105" style={{ background: ACCENT }}>
              Get the app
            </a>
            <button aria-label="Menu" onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white lg:hidden">
              ☰
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#0A0B0E] p-6 lg:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold italic text-white">ThangGo</span>
              <button aria-label="Close" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-xl text-white">
                ✕
              </button>
            </div>
            <div className="mt-10 flex flex-col gap-1">
              {NAV_MAIN.map((l, i) => (
                <motion.a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.1 }}
                  className="border-b border-white/10 py-4 text-2xl font-bold text-white"
                >
                  {l.label}
                </motion.a>
              ))}
            </div>
            <a href="#download" onClick={() => setOpen(false)} className="mt-auto rounded-full py-3.5 text-center text-base font-bold text-black" style={{ background: ACCENT }}>
              Get the app
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
