import { STATS } from '@/lib/theme';

export default function StatsBand() {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-wide gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-display text-5xl font-extrabold gradient-text">{stat.value.toLocaleString()}{stat.suffix}</p>
            <p className="mt-2 text-sm font-bold uppercase text-slate2">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
