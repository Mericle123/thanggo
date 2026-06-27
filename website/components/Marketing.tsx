'use client';

// ── ThangGo marketing site (everything below the cinematic) ──────────────────
// Every nav item maps to a real section here, each with its OWN layout + animation:
//   #app (product) · #venues (grid) · why (pinned horizontal) · #events (timeline)
//   · #community (feed) · stats · testimonials · #about (parallax) · #download · #contact (form)
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';
import ScrubVideo from '@/components/ScrubVideo';
import { VENUES, EVENTS, FEED, STATS, TESTIMONIALS, FAQ as FAQ_ITEMS, BRAND } from '@/lib/theme';

const ACCENT = '#A3E635';
// Login removed — these CTAs simply scroll to the download section.
const openApp = (_mode?: 'login' | 'signup') =>
  document.getElementById('download')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/* ───────────────────────── kinetic marquee ───────────────────────── */
function Marquee() {
  const words = ['Book', 'Play', 'Compete', 'Connect', 'Squad up', 'Challenge', 'Win'];
  const row = [...words, ...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-[color:var(--line)] bg-[color:var(--bg)] py-6">
      <motion.div className="flex w-max items-center gap-8 whitespace-nowrap" animate={{ x: ['0%', '-33.33%'] }} transition={{ duration: 22, ease: 'linear', repeat: Infinity }}>
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-5xl">{w}</span>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ACCENT }} />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ───────────────────────── app showcase ───────────────────────── */
function Phone({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative h-[460px] w-[226px] shrink-0 rounded-[2.4rem] border-[6px] border-[#1a1c20] bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)] ${className}`}>
      <div className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#1a1c20]" />
      <div className="h-full w-full overflow-hidden rounded-[1.9rem] bg-[color:var(--card)]">{children}</div>
    </div>
  );
}
function ScreenChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between px-4 pb-3 pt-7">
      <span className="font-display text-base font-bold text-[color:var(--fg)]">{title}</span>
      <span className="grid h-7 w-7 place-items-center rounded-full text-xs font-black text-black" style={{ background: ACCENT }}>T</span>
    </div>
  );
}
function BookingScreen() {
  return (
    <div className="flex h-full flex-col">
      <ScreenChrome title="Book a court" />
      <div className="flex gap-1.5 px-4 pb-3">
        {['Today', 'Fri', 'Sat', 'Sun'].map((d, i) => (<span key={d} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${i === 0 ? 'text-black' : 'bg-[color:var(--surface)] text-[color:var(--fg-muted)]'}`} style={i === 0 ? { background: ACCENT } : undefined}>{d}</span>))}
      </div>
      <div className="flex-1 space-y-2 px-4">
        {VENUES.slice(0, 3).map((v) => (
          <div key={v.name} className="flex items-center gap-2.5 rounded-2xl bg-[color:var(--surface)] p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v.img} alt="" className="h-11 w-11 rounded-xl object-cover" />
            <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-bold text-[color:var(--fg)]">{v.name}</p><p className="text-[10px] text-[color:var(--fg-dim)]">{v.area} · Nu {v.price}/hr</p></div>
            <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-black" style={{ background: ACCENT }}>Book</span>
          </div>
        ))}
      </div>
      <div className="m-4 rounded-2xl py-2.5 text-center text-xs font-bold text-black" style={{ background: ACCENT }}>Confirm booking</div>
    </div>
  );
}
function SquadScreen() {
  const roster = [['Karma T.', 'Captain'], ['Sonam D.', 'Striker'], ['Tashi W.', 'Defender'], ['Pema L.', 'Midfield']];
  return (
    <div className="flex h-full flex-col">
      <ScreenChrome title="Thimphu Strikers" />
      <div className="mx-4 mb-3 flex items-center gap-2 rounded-2xl bg-[color:var(--surface)] p-3"><span className="grid h-9 w-9 place-items-center rounded-xl text-base" style={{ background: '#6366F133' }}>⚡</span><div><p className="text-[11px] font-bold text-[color:var(--fg)]">Futsal · Competitive</p><p className="text-[10px] text-[color:var(--fg-dim)]">14 players · 11 confirmed</p></div></div>
      <div className="flex-1 space-y-2 px-4">
        {roster.map(([n, r]) => (<div key={n} className="flex items-center justify-between rounded-xl bg-[color:var(--surface)] px-3 py-2"><span className="text-[11px] font-medium text-[color:var(--fg)]">{n}</span><span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: `${ACCENT}22`, color: ACCENT }}>{r}</span></div>))}
      </div>
      <div className="m-4 rounded-2xl border border-[color:var(--line)] py-2.5 text-center text-xs font-bold text-[color:var(--fg)]">+ Invite players</div>
    </div>
  );
}
function MatchScreen() {
  const ch = [['Phoenix Ballers', 'Basketball', 'Sat · 5 PM'], ['Paro Spikers', 'Volleyball', 'Sun · 4 PM']];
  return (
    <div className="flex h-full flex-col">
      <ScreenChrome title="Open challenges" />
      <div className="flex-1 space-y-2.5 px-4">
        {ch.map(([s, sp, t]) => (<div key={s} className="rounded-2xl bg-[color:var(--surface)] p-3"><div className="flex items-center justify-between"><span className="text-[11px] font-bold text-[color:var(--fg)]">{s}</span><span className="text-[9px] font-bold" style={{ color: ACCENT }}>● live</span></div><p className="mt-0.5 text-[10px] text-[color:var(--fg-dim)]">{sp} · {t}</p><div className="mt-2.5 flex gap-2"><span className="flex-1 rounded-full py-1.5 text-center text-[10px] font-bold text-black" style={{ background: ACCENT }}>Accept</span><span className="rounded-full border border-[color:var(--line)] px-3 py-1.5 text-[10px] font-bold text-[color:var(--fg)]">Chat</span></div></div>))}
      </div>
      <div className="m-4 rounded-2xl py-2.5 text-center text-xs font-bold text-black" style={{ background: ACCENT }}>Post a challenge</div>
    </div>
  );
}
function AppShowcase() {
  return (
    <section id="app" className="relative overflow-hidden px-6 py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vh] w-[60vh] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${ACCENT}1a, transparent 70%)`, filter: 'blur(40px)' }} />
      <div className="relative mx-auto max-w-[1280px] text-center">
        <Reveal>
          <span className="inline-block rounded-full border border-[color:var(--line)] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[color:var(--fg-muted)]">The app</span>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] text-[color:var(--fg)] sm:text-7xl">The whole game, <span style={{ color: ACCENT }}>in your pocket.</span></h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[color:var(--fg-muted)]">Book venues, run your squad, find opponents and join events — everything ThangGo does, one tap away.</p>
        </Reveal>
        <div className="mt-16 flex items-end justify-center gap-4 sm:gap-8">
          <motion.div initial={{ opacity: 0, y: 60, rotate: -6 }} whileInView={{ opacity: 1, y: 0, rotate: -6 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="hidden sm:block"><Phone className="origin-bottom"><SquadScreen /></Phone></motion.div>
          <motion.div initial={{ opacity: 0, y: 80 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }} className="z-10 -mb-6"><Phone><BookingScreen /></Phone></motion.div>
          <motion.div initial={{ opacity: 0, y: 60, rotate: 6 }} whileInView={{ opacity: 1, y: 0, rotate: 6 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} className="hidden sm:block"><Phone className="origin-bottom"><MatchScreen /></Phone></motion.div>
        </div>
        <button onClick={() => openApp('signup')} className="mt-14 rounded-full px-8 py-3.5 text-base font-bold text-black transition-transform hover:scale-105" style={{ background: ACCENT }}>Get the app</button>
      </div>
    </section>
  );
}

/* ─────────────────── VENUES — grid ─────────────────── */
function Venues() {
  return (
    <section id="venues" className="px-6 py-28">
      <div className="mx-auto max-w-[1280px]">
        <Reveal><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Venues</span>
          <h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-6xl">Find your ground.</h2>
          <p className="mt-4 max-w-xl text-[color:var(--fg-muted)]">Courts, pitches, pools and gyms across Bhutan — with live availability and instant booking.</p>
        </Reveal>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VENUES.map((v) => (
            <StaggerItem key={v.name}>
              <motion.article whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="group overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)]">
                <div className="relative h-44 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">★ {v.rating}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold text-[color:var(--fg)]">{v.name}</h3>
                  <p className="text-sm text-[color:var(--fg-dim)]">{v.area}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{v.sports.map((s) => (<span key={s} className="rounded-full bg-[color:var(--surface)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--fg-muted)]">{s}</span>))}</div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-lg font-bold text-[color:var(--fg)]">Nu {v.price}<span className="text-sm font-medium text-[color:var(--fg-dim)]">/hr</span></span>
                    <button onClick={() => openApp('signup')} className="rounded-full px-4 py-1.5 text-sm font-bold text-black transition-transform hover:scale-105" style={{ background: ACCENT }}>Book</button>
                  </div>
                </div>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ─────────────────── why ThangGo — pinned horizontal ─────────────────── */
const FEATURES = [
  { k: 'Book any court', d: 'Tap a slot and you’re in — courts, pitches, pools and gyms, live from 6 AM to midnight.', img: '/sports/stadium.jpg', accent: '#22C55E' },
  { k: 'Build your squad', d: 'Rally your crew, hand out roles and roll up to the pitch as a team.', img: '/sports/football.jpg', accent: '#6366F1' },
  { k: 'Call out rivals', d: 'Post a challenge, fill the lobby and settle it on the court — bragging rights on the line.', img: '/sports/boxing.jpg', accent: '#F43F5E' },
  { k: 'Feel the crowd', d: 'Tournaments, open play and packed sidelines — show up and be part of it.', img: '/sports/fans.jpg', accent: '#FB923C' },
  { k: 'Lift the trophy', d: 'Climb the leagues, win the bracket and put your squad on the map.', img: '/sports/trophy.jpg', accent: '#F59E0B' },
  { k: 'Train & glow up', d: 'Memberships, classes and trainers — get fitter every single week.', img: '/sports/gym.jpg', accent: '#22D3EE' },
];
function HorizontalFeatures() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-78%']);
  return (
    <section ref={ref} className="relative" style={{ height: '320vh' }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="mb-8 px-6 sm:px-12"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Why ThangGo</span><h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-6xl">Everything you need to play.</h2></div>
        <motion.div style={{ x }} className="flex gap-5 px-6 sm:px-12">
          {FEATURES.map((f, i) => (
            <article key={f.k} className="group relative h-[60vh] w-[78vw] shrink-0 overflow-hidden rounded-[2rem] sm:w-[42vw] lg:w-[30vw]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.img} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/40 to-transparent" />
              <div className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full font-display text-sm font-bold text-black" style={{ background: f.accent }}>{String(i + 1).padStart(2, '0')}</div>
              <div className="absolute inset-x-0 bottom-0 p-6"><h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">{f.k}</h3><p className="mt-2 max-w-xs text-sm text-white/70">{f.d}</p></div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── EVENTS — timeline ─────────────────── */
function Events() {
  return (
    <section id="events" className="px-6 py-28">
      <div className="mx-auto max-w-3xl">
        <Reveal><div className="text-center"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Events</span><h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-6xl">What’s on.</h2></div></Reveal>
        <div className="relative mt-14 pl-8">
          <span className="absolute left-[7px] top-2 bottom-2 w-px bg-white/12" />
          {EVENTS.map((e) => (
            <motion.div key={e.title} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="relative mb-6">
              <span className="absolute -left-[29px] top-3 h-4 w-4 rounded-full border-2 border-[#08090C]" style={{ background: e.accent }} />
              <article className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] sm:flex-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.img} alt="" loading="lazy" className="h-40 w-full object-cover sm:h-auto sm:w-44" />
                <div className="flex flex-1 flex-col justify-center p-5">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: e.accent }}>{e.date} · {e.tag}</span>
                  <h3 className="mt-1 font-display text-2xl font-bold text-[color:var(--fg)]">{e.title}</h3>
                  <p className="mt-1 text-sm text-[color:var(--fg-dim)]">{e.spots}</p>
                  <button onClick={() => openApp('signup')} className="mt-4 w-max rounded-full border border-[color:var(--line)] px-4 py-1.5 text-sm font-bold text-[color:var(--fg)] transition-colors hover:bg-[color:var(--surface)]">Register →</button>
                </div>
              </article>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── COMMUNITY — feed ─────────────────── */
function Community() {
  return (
    <section id="community" className="relative overflow-hidden px-6 py-28">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sports/fans.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)] via-[var(--bg)]/85 to-[var(--bg)]" />
      <div className="relative mx-auto max-w-[1280px]">
        <Reveal><div className="text-center"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Community</span><h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-6xl">Join the lobby.</h2><p className="mx-auto mt-4 max-w-xl text-[color:var(--fg-muted)]">Match results, squad call-outs and run-club energy — Bhutan’s sports scene, all in one feed.</p></div></Reveal>
        <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
          {FEED.map((p) => (
            <StaggerItem key={p.handle}>
              <motion.article whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="overflow-hidden rounded-3xl border border-[color:var(--line)] bg-[color:var(--card)]">
                <div className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-full text-lg" style={{ background: `${ACCENT}22` }}>{p.sport}</span><div><p className="text-sm font-bold text-[color:var(--fg)]">{p.user}</p><p className="text-xs text-[color:var(--fg-dim)]">{p.handle}</p></div></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" loading="lazy" className="h-48 w-full object-cover" />
                <div className="p-4"><p className="text-[color:var(--fg-muted)]">{p.text}</p><div className="mt-3 flex items-center gap-4 text-sm text-[color:var(--fg-dim)]"><span>❤️ {p.likes}</span><span>💬 Comment</span><span className="ml-auto">↗ Share</span></div></div>
              </motion.article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────────────────── counters + stats ───────────────────────── */
function Counter({ value, suffix }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting || done.current) return; done.current = true; const start = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - start) / 1500); setN(Math.round(value * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, { threshold: 0.5 });
    io.observe(el); return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}
function Stats() {
  return (
    <section id="stats" className="border-y border-[color:var(--line)] px-6 py-20">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 lg:grid-cols-4">
        {STATS.map((s) => (<Reveal key={s.label}><div className="text-center"><p className="font-display text-5xl font-extrabold sm:text-6xl" style={{ color: ACCENT }}><Counter value={s.value} suffix={s.suffix} /></p><p className="mt-2 text-sm font-medium uppercase tracking-wide text-[color:var(--fg-dim)]">{s.label}</p></div></Reveal>))}
      </div>
    </section>
  );
}

/* ───────────────────────── testimonials ───────────────────────── */
function Testimonials() {
  const row = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <section className="overflow-hidden py-28">
      <Reveal><div className="mx-auto mb-12 max-w-[1280px] px-6 text-center"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Loved by players</span><h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-6xl">The lobby is buzzing.</h2></div></Reveal>
      <div className="[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <motion.div className="flex w-max gap-5" animate={{ x: ['0%', '-50%'] }} transition={{ duration: 30, ease: 'linear', repeat: Infinity }}>
          {row.map((t, i) => (<div key={i} className="w-[340px] shrink-0 rounded-3xl border border-[color:var(--line)] bg-[color:var(--surface)] p-6"><p className="text-[color:var(--fg-muted)]">“{t.quote}”</p><div className="mt-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full text-lg" style={{ background: `${ACCENT}22` }}>{t.emoji}</span><div><p className="text-sm font-bold text-[color:var(--fg)]">{t.name}</p><p className="text-xs text-[color:var(--fg-dim)]">{t.role}</p></div></div></div>))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── ABOUT — parallax split ─────────────────── */
function About() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  return (
    <section id="about" ref={ref} className="px-6 py-28">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-2">
        <div className="relative h-[440px] overflow-hidden rounded-[2rem] border border-[color:var(--line)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img src="/sports/mountains.jpg" alt="Bhutan" className="absolute inset-0 h-[124%] w-full object-cover" style={{ y }} />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08090C]/70 to-transparent" />
          <span className="absolute bottom-5 left-5 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur">Thimphu · Bhutan</span>
        </div>
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>About</span>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1] text-[color:var(--fg)] sm:text-6xl">Built in Bhutan, <span style={{ color: ACCENT }}>for every player.</span></h2>
          <p className="mt-5 text-lg text-[color:var(--fg-muted)]">ThangGo started with one idea: make it effortless to find a game in Bhutan. Today it connects players, squads and venues across the country — from Thimphu’s courts to Paro’s pitches.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[['2026', 'Founded'], ['20', 'Districts'], ['100%', 'Local']].map(([a, b]) => (<div key={b}><p className="font-display text-3xl font-extrabold" style={{ color: ACCENT }}>{a}</p><p className="text-sm text-[color:var(--fg-dim)]">{b}</p></div>))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ─────────────────── DOWNLOAD ─────────────────── */
function Download() {
  return (
    <section id="download" className="px-6 py-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-[color:var(--line)] bg-gradient-to-br from-[#11140c] via-[#0c0e12] to-[#0c0e12] px-6 py-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle, ${ACCENT}33, transparent 70%)`, filter: 'blur(50px)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-5xl font-extrabold leading-[0.95] text-white sm:text-7xl">Your game starts <span style={{ color: '#A3E635' }}>tonight.</span></h2>
            <p className="mx-auto mt-5 max-w-md text-lg text-white/70">Download ThangGo and book your first slot, squad or match in minutes.</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a href={BRAND.appStoreUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 transition-colors hover:bg-white/[0.12]"><svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden><path d="M16.36 1.43c0 1.14-.49 2.27-1.18 3.08-.74.9-1.99 1.57-2.98 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.57-2.27 1.2-2.98.8-.94 2.14-1.64 3.25-1.68.03.13.05.28.05.43zM20.93 17.14c-.03.07-.46 1.58-1.52 3.12-.94 1.34-1.94 2.71-3.43 2.71-1.52 0-1.9-.88-3.63-.88-1.7 0-2.3.91-3.67.91-1.38 0-2.33-1.26-3.43-2.8-1.93-2.72-2.5-5.95-1.06-8.06.86-1.27 2.2-2.04 3.46-2.04 1.45 0 2.36.95 3.6.95.86 0 2.22-1.01 3.9-1.01.61 0 2.89.06 4.37 2.19-.13.09-2.38 1.37-2.38 4.19 0 3.26 2.85 4.42 2.96 4.46z" /></svg><span className="text-left leading-tight"><span className="block text-[10px] text-white/55">Download on the</span><span className="block text-sm font-semibold text-white">App Store</span></span></a>
              <a href={BRAND.playStoreUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.06] px-5 py-3 transition-colors hover:bg-white/[0.12]"><svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden><path d="M3 2.5l11 9.5L3 21.5z" fill="#A3E635" /><path d="M3 2.5l8 9.5-8 9.5c-.4-.2-.6-.6-.6-1.1V3.6c0-.5.2-.9.6-1.1z" fill="#38BDF8" /></svg><span className="text-left leading-tight"><span className="block text-[10px] text-white/55">GET IT ON</span><span className="block text-sm font-semibold text-white">Google Play</span></span></a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ─────────────────── CONTACT — working form ─────────────────── */
function Contact() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', msg: '' });
  const submit = (e: React.FormEvent) => { e.preventDefault(); setSent(true); };
  return (
    <section id="contact" className="px-6 pb-28">
      <div className="mx-auto grid max-w-[1100px] gap-12 rounded-[2rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-8 sm:p-12 lg:grid-cols-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Contact</span>
          <h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-5xl">Get in touch.</h2>
          <p className="mt-4 text-[color:var(--fg-muted)]">Venue owner, organiser or just curious? Drop us a line and we’ll get back within a day.</p>
          <div className="mt-8 space-y-3 text-[color:var(--fg-muted)]">
            <p className="flex items-center gap-3"><span style={{ color: ACCENT }}>✉</span> hello@thanggo.bt</p>
            <p className="flex items-center gap-3"><span style={{ color: ACCENT }}>☏</span> +975 17 000 000</p>
            <p className="flex items-center gap-3"><span style={{ color: ACCENT }}>⌖</span> Thimphu, Bhutan</p>
          </div>
        </div>
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)] p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full text-3xl text-black" style={{ background: ACCENT }}>✓</div>
            <h3 className="mt-5 font-display text-2xl font-bold text-[color:var(--fg)]">Message sent!</h3>
            <p className="mt-2 text-[color:var(--fg-muted)]">Thanks {form.name || 'there'} — we’ll reply to {form.email || 'your inbox'} soon.</p>
            <button onClick={() => { setSent(false); setForm({ name: '', email: '', msg: '' }); }} className="mt-6 rounded-full border border-[color:var(--line)] px-5 py-2 text-sm font-bold text-[color:var(--fg)] hover:bg-[color:var(--surface)]">Send another</button>
          </motion.div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--fg)] outline-none transition-colors placeholder:text-[color:var(--fg-dim)] focus:border-[var(--a)]" style={{ ['--a' as any]: ACCENT }} />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--fg)] outline-none transition-colors placeholder:text-[color:var(--fg-dim)] focus:border-[var(--a)]" style={{ ['--a' as any]: ACCENT }} />
            <textarea required rows={4} value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} placeholder="How can we help?" className="w-full rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-3 text-[color:var(--fg)] outline-none transition-colors placeholder:text-[color:var(--fg-dim)] focus:border-[var(--a)]" style={{ ['--a' as any]: ACCENT }} />
            <button type="submit" className="w-full rounded-xl py-3.5 font-bold text-black transition-transform hover:scale-[1.02]" style={{ background: ACCENT }}>Send message</button>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─────────────────── FAQ ─────────────────── */
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-6 pb-28">
      <div className="mx-auto max-w-3xl">
        <Reveal><div className="mb-10 text-center"><span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Good to know</span><h2 className="mt-3 font-display text-4xl font-extrabold text-[color:var(--fg)] sm:text-5xl">Questions, answered.</h2></div></Reveal>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const on = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--surface)]">
                <button onClick={() => setOpen(on ? null : i)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"><span className="font-display text-lg font-bold text-[color:var(--fg)]">{item.q}</span><span className="text-2xl transition-transform duration-300" style={{ color: ACCENT, transform: on ? 'rotate(45deg)' : 'none' }}>+</span></button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}><div className="overflow-hidden"><p className="px-6 pb-5 text-[color:var(--fg-muted)]">{item.a}</p></div></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Marketing() {
  return (
    <div className="bg-[color:var(--bg)]">
      <Marquee />
      <ScrubVideo src="/videos/soccer.mp4" eyebrow="In motion" title="Scrub the play, frame by frame." line="Scroll down to play it forward — scroll up to rewind. The footage follows your wheel." accent="#A3E635" id="motion" />
      <AppShowcase />
      <Venues />
      <HorizontalFeatures />
      <Events />
      <Community />
      <ScrubVideo src="/videos/basketball.mp4" eyebrow="Match day" title="Every game, in your hands." line="From tip-off to final whistle — scrub the action, then book your own." accent="#FB923C" />
      <Stats />
      <Testimonials />
      <About />
      <Download />
      <Contact />
      <Faq />
    </div>
  );
}
