import { OPPONENTS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function FindOpponents() {
  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-wide gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="chip">Challenges</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Find opponents fast.</h2>
          <p className="mt-5 text-slate2">Post an open match, accept a challenge, and settle the venue before the group chat gets noisy.</p>
        </Reveal>
        <div className="space-y-4">
          {OPPONENTS.map((match) => (
            <article key={match.squad} className="glass rounded-3xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: match.accent }}>{match.sport} · {match.level}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold">{match.squad}</h3>
                  <p className="mt-2 text-sm text-slate2">{match.when} at {match.venue}</p>
                </div>
                <a href="#download" className="btn-grad !px-5 !py-2 text-sm">Challenge</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
