// Dark footer (reference): brand left, copyright center, legal + social icons right.
import { BRAND, SOCIALS, ACCENT } from '@/lib/theme';

function Social({ name }: { name: string }) {
  const p: Record<string, string> = {
    facebook: 'M13 22v-8h2.5l.5-3H13V9.2c0-.9.3-1.5 1.6-1.5H16V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.3-3.8 3.9V11H7.5v3H10v8z',
    instagram: 'M12 7.2A4.8 4.8 0 1 0 16.8 12 4.8 4.8 0 0 0 12 7.2zm0 7.9A3.1 3.1 0 1 1 15.1 12 3.1 3.1 0 0 1 12 15.1zM17 6a1.1 1.1 0 1 0 1.1 1.1A1.1 1.1 0 0 0 17 6zM7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 1.8A2.2 2.2 0 0 0 4.8 7v10A2.2 2.2 0 0 0 7 19.2h10A2.2 2.2 0 0 0 19.2 17V7A2.2 2.2 0 0 0 17 4.8z',
    tiktok: 'M16 3c.3 2 1.5 3.6 3.5 3.9V10c-1.4 0-2.7-.4-3.8-1.1V15a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3a2.6 2.6 0 1 0 1.8 2.5V3z',
    x: 'M17.5 3h2.7l-5.9 6.7L21 21h-5.4l-4.2-5.5L6.6 21H3.9l6.3-7.2L3.3 3h5.5l3.8 5.1zM16.6 19.4h1.5L7.5 4.5H5.9z',
    youtube: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5 3z',
  };
  return (
    <a href="#" aria-label={name} className="grid h-9 w-9 place-items-center rounded-full border border-[color:var(--line)] text-[color:var(--fg-muted)] transition-colors hover:border-white/30 hover:text-[color:var(--fg)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d={p[name]} />
      </svg>
    </a>
  );
}

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-[color:var(--line)] bg-[color:var(--bg)]">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-6 px-5 py-8 sm:px-8 md:flex-row md:justify-between">
        <a href="#home" className="flex items-center gap-2 text-xl font-extrabold italic text-[color:var(--fg)]">
          <span className="grid h-6 w-6 place-items-center rounded" style={{ background: ACCENT }}>
            <span className="text-xs font-black text-black">T</span>
          </span>
          {BRAND.name}
        </a>

        <p className="text-sm text-[color:var(--fg-dim)]">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>

        <div className="flex items-center gap-5">
          <a href="#" className="text-sm text-[color:var(--fg-muted)] transition-colors hover:text-[color:var(--fg)]">Privacy Policy</a>
          <a href="#" className="text-sm text-[color:var(--fg-muted)] transition-colors hover:text-[color:var(--fg)]">Terms of Use</a>
          <div className="flex gap-2">
            {SOCIALS.map((s) => <Social key={s} name={s} />)}
          </div>
        </div>
      </div>
    </footer>
  );
}
