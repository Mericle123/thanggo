import { SPORTS } from '@/lib/theme';
import { Reveal, Stagger, StaggerItem } from '@/components/ui/Reveal';

export default function SportsCategories() {
  return (
    <section id="sport-grid" className="py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Sports</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold text-ink sm:text-6xl">Pick your game.</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SPORTS.map((sport) => (
            <StaggerItem key={sport.name}>
              <article className="group overflow-hidden rounded-3xl bg-white shadow-xl shadow-ink/5">
                <div className="relative h-44 overflow-hidden">
                  <img src={sport.img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-4xl">{sport.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold">{sport.name}</h3>
                  <p className="mt-2 text-sm text-slate2">Book, join, challenge or organize.</p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
