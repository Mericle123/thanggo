'use client';

// ── ThangGo sports scroll — Elva-style stacked cards ────────────────────────
// A hero intro, then the 10 sports as a STACK of cards: each is a big rounded
// card pinned to the viewport; as you scroll, the current card scales down while
// the next rises and stacks over it (you see the previous ones peek behind). Inside
// each card the photo zooms + parallaxes, the layout alternates left/right per sport
// for variety, and a subtle pointer-tilt adds depth. Smooth, premium, varied.
import { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from 'framer-motion';

const ACCENT = '#A3E635';

type Sport = { key: string; no: string; name: string; line: string; accent: string; pos: string };

// Football is the hero banner, so the card stack covers the other nine sports (no repeat).
const STORY: Sport[] = [
  { key: 'basketball', no: '01', name: 'Basketball', line: 'Bounce, rise, finish above the rim.', accent: '#FB923C', pos: 'center' },
  { key: 'tennis', no: '02', name: 'Tennis', line: 'Focus, swing, win — every point matters.', accent: '#C6F24E', pos: 'top' },
  { key: 'cricket', no: '03', name: 'Cricket', line: 'Strategy, skill and sixes into the night.', accent: '#EF4444', pos: 'center' },
  { key: 'volleyball', no: '04', name: 'Volleyball', line: 'Set it, read it, spike it home.', accent: '#3B82F6', pos: 'top' },
  { key: 'taekwondo', no: '05', name: 'Taekwondo', line: 'Discipline. Focus. Power in motion.', accent: '#A855F7', pos: 'center' },
  { key: 'boxing', no: '06', name: 'Boxing', line: 'Slip, guard, counter — heart over fear.', accent: '#F43F5E', pos: 'center' },
  { key: 'swimming', no: '07', name: 'Swimming', line: 'Dive in. Push limits. Flow through water.', accent: '#22D3EE', pos: 'center' },
  { key: 'gym', no: '08', name: 'Gym & Fitness', line: 'Stronger every day. Better than yesterday.', accent: '#F59E0B', pos: 'center' },
  { key: 'running', no: '09', name: 'Run Club', line: 'Run together. Chase the sunrise.', accent: '#A3E635', pos: 'bottom' },
];
const TOTAL = STORY.length;

/* ───────────────────────── hero intro ───────────────────────── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return (
    <section id="home" ref={ref} className="relative h-[100svh] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale, y }}>
        <img src="/sports/football.jpg" alt="" className="kb kb0 h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/40 to-[#08090C]/60" />
      <motion.div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center" style={{ opacity: fade }}>
        <p className="font-display text-xs font-bold uppercase tracking-[0.35em]" style={{ color: ACCENT }}>All sports. One community.</p>
        <h1 className="mt-4 font-display text-6xl font-extrabold leading-[0.9] text-white sm:text-8xl md:text-9xl">
          Play. Compete.<br /><span style={{ color: ACCENT }}>Connect.</span>
        </h1>
        <div className="mt-8 flex items-center gap-2 text-sm text-white/55"><span className="animate-bounce">↓</span> scroll through every sport</div>
      </motion.div>
    </section>
  );
}

/* ───────────────────────── stacked card ───────────────────────── */
function Card({
  sport,
  index,
  progress,
  mx,
  my,
}: {
  sport: Sport;
  index: number;
  progress: MotionValue<number>;
  mx: MotionValue<number>;
  my: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // each card's own entry progress drives the internal photo zoom/parallax
  const { scrollYProgress: entry } = useScroll({ target: ref, offset: ['start end', 'start start'] });
  const imgScale = useTransform(entry, [0, 1], [1.4, 1.02]);
  const imgY = useTransform(entry, [0, 1], ['-8%', '4%']);

  // stack: this card shrinks as later cards cover it
  const targetScale = 1 - (TOTAL - index) * 0.025;
  const scale = useTransform(progress, [index / TOTAL, 1], [1, targetScale]);

  // pointer tilt (subtle depth)
  const rotX = useTransform(my, [-1, 1], [3, -3]);
  const rotY = useTransform(mx, [-1, 1], [-4, 4]);

  const even = index % 2 === 0;

  return (
    <div ref={ref} className="sticky top-0 flex h-[100svh] items-center justify-center px-3 sm:px-6">
      <motion.div
        style={{ scale, rotateX: rotX, rotateY: rotY, top: `calc(-4vh + ${index * 16}px)`, transformPerspective: 1400 }}
        className="relative h-[84vh] w-full max-w-[1180px] overflow-hidden rounded-[2.25rem] border border-white/10 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        {/* scroll parallax (framer) wraps an always-on Ken Burns image (CSS) → live motion */}
        <motion.div className="absolute inset-0" style={{ scale: imgScale, y: imgY }}>
          <img
            src={`/sports/${sport.key}.jpg`}
            alt={sport.name}
            loading={index < 2 ? 'eager' : 'lazy'}
            className={`kb kb${index % 3} h-full w-full`}
            style={{ objectFit: 'cover', objectPosition: sport.pos }}
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/15 to-[#08090C]/45" />
        <div className={`absolute inset-0 ${even ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-[#08090C]/85 via-transparent to-transparent`} />

        {/* big number, opposite corner from the text */}
        <span
          className={`pointer-events-none absolute top-6 font-display font-extrabold leading-none tabular-nums sm:top-10 ${even ? 'right-8 sm:right-12' : 'left-8 sm:left-12'}`}
          style={{ color: sport.accent, fontSize: 'min(20vw, 200px)', opacity: 0.9, textShadow: `0 0 50px ${sport.accent}55` }}
        >
          {sport.no}
        </span>

        {/* caption */}
        <div className={`absolute bottom-0 max-w-lg p-8 sm:p-14 ${even ? 'left-0 text-left' : 'right-0 text-right'}`}>
          <div className={`mb-3 flex items-center gap-3 ${even ? '' : 'justify-end'}`}>
            <span className="h-px w-12" style={{ background: sport.accent }} />
            <span className="font-display text-sm font-bold tracking-[0.25em]" style={{ color: sport.accent }}>{sport.no} / {TOTAL}</span>
          </div>
          <h2 className="font-display text-6xl font-extrabold leading-[0.88] text-white sm:text-8xl">{sport.name}</h2>
          <p className="mt-4 text-lg text-white/80">{sport.line}</p>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── stack container ───────────────────────── */
function Cards() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: container, offset: ['start start', 'end end'] });
  const [active, setActive] = useState(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });
  const onMove = (e: React.MouseEvent) => {
    mx.set((e.clientX / window.innerWidth - 0.5) * 2);
    my.set((e.clientY / window.innerHeight - 0.5) * 2);
  };

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const i = Math.min(TOTAL - 1, Math.max(0, Math.floor(p * TOTAL + 0.15)));
    if (i !== active) setActive(i);
  });

  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="sports" ref={container} className="relative bg-[#08090C]" onMouseMove={onMove}>
      {/* progress bar (sticky) */}
      <div className="sticky top-0 z-40 h-[3px] bg-white/5">
        <motion.div className="h-full" style={{ width: bar, background: ACCENT }} />
      </div>

      {/* timeline rail (sticky, zero-height so it never adds scroll) */}
      <div className="pointer-events-none sticky top-0 z-40 hidden h-0 lg:block">
        <ul className="absolute left-6 top-[50vh] -translate-y-1/2 space-y-1">
          <span className="absolute left-[11px] top-1 bottom-1 w-px bg-white/12" />
          {STORY.map((s, i) => {
            const on = i === active;
            return (
              <li key={s.key} className="relative flex items-center gap-3 py-1">
                <span className="z-10 grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold transition-all duration-300" style={{ borderColor: on ? s.accent : 'rgba(255,255,255,0.2)', background: on ? s.accent : 'transparent', color: on ? '#08090C' : 'rgba(255,255,255,0.5)', transform: on ? 'scale(1.15)' : 'scale(1)' }}>{s.no}</span>
                <span className="text-sm font-medium transition-all duration-300" style={{ color: on ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {STORY.map((s, i) => (
        <Card key={s.key} sport={s} index={i} progress={scrollYProgress} mx={sx} my={sy} />
      ))}
    </section>
  );
}

export default function SportStory() {
  return (
    <>
      {/* always-on Ken Burns so the photos are alive even when you stop scrolling */}
      <style>{`
        .kb{will-change:transform;transform-origin:center}
        @keyframes kbA{0%,100%{transform:scale(1.06) translate(0%,0%)}50%{transform:scale(1.17) translate(-2%,1.5%)}}
        @keyframes kbB{0%,100%{transform:scale(1.12) translate(1.5%,-1%)}50%{transform:scale(1.04) translate(-1.5%,1%)}}
        @keyframes kbC{0%,100%{transform:scale(1.08) translate(-1.5%,1%)}50%{transform:scale(1.18) translate(1.5%,-1.5%)}}
        .kb0{animation:kbA 17s ease-in-out infinite}
        .kb1{animation:kbB 21s ease-in-out infinite}
        .kb2{animation:kbC 24s ease-in-out infinite}
        @media (prefers-reduced-motion:reduce){.kb0,.kb1,.kb2{animation:none}}
      `}</style>
      <Hero />
      <Cards />
    </>
  );
}
