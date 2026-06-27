'use client';

// Light/dark toggle. Flips `html.light` and persists to localStorage. The pre-paint
// script in layout applies the saved choice before hydration, so there's no flash.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle({ className = '', over = false }: { className?: string; over?: boolean }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.classList.contains('light'));
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light', next);
    try { localStorage.setItem('thanggo.theme', next ? 'light' : 'dark'); } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
      title={light ? 'Dark mode' : 'Light mode'}
      className={`relative grid h-9 w-9 place-items-center rounded-full border transition-colors ${over ? 'border-white/25 text-white hover:bg-white/10' : 'border-[color:var(--line)] text-[color:var(--fg)] hover:bg-[color:var(--surface)]'} ${className}`}
    >
      <motion.span key={light ? 'sun' : 'moon'} initial={{ rotate: -90, opacity: 0, scale: 0.5 }} animate={{ rotate: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="text-base">
        {light ? '☀️' : '🌙'}
      </motion.span>
    </button>
  );
}
