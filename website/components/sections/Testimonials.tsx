import { TESTIMONIALS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function Testimonials() {
  return (
    <section className="bg-white/55 py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Players</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">What the community says.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {TESTIMONIALS.map((item) => (
            <article key={item.name} className="rounded-3xl bg-white p-6 shadow-xl shadow-ink/5">
              <div className="text-3xl">{item.emoji}</div>
              <p className="mt-5 text-sm text-slate2">"{item.quote}"</p>
              <p className="mt-5 font-bold">{item.name}</p>
              <p className="text-sm text-slate2">{item.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
