import { EVENTS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function Events() {
  return (
    <section id="events" className="py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Events</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Tournaments and open play.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {EVENTS.map((event) => (
            <article key={event.title} className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-ink/5">
              <img src={event.img} alt="" className="h-52 w-full object-cover" />
              <div className="p-6">
                <p className="text-sm font-bold" style={{ color: event.accent }}>{event.date} · {event.tag}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{event.title}</h3>
                <p className="mt-3 text-slate2">{event.spots}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
