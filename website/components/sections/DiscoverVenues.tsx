import { VENUES } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function DiscoverVenues() {
  return (
    <section id="venues" className="bg-white/55 py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Venues</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Find a place to play.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {VENUES.map((venue) => (
            <article key={venue.name} className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-ink/5">
              <img src={venue.img} alt="" className="h-40 w-full object-cover" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold">{venue.name}</h3>
                  <span className="chip !px-2 !py-1">★ {venue.rating}</span>
                </div>
                <p className="mt-2 text-sm text-slate2">{venue.area}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {venue.sports.map((sport) => (
                    <span key={sport} className="rounded-full bg-bg px-3 py-1 text-xs font-semibold">{sport}</span>
                  ))}
                </div>
                <p className="mt-5 font-bold">Nu. {venue.price}<span className="text-sm font-medium text-slate2"> / slot</span></p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
