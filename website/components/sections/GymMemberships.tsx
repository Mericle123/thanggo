import { GYM_PLANS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function GymMemberships() {
  return (
    <section className="bg-white/55 py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Gym</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Memberships made simple.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {GYM_PLANS.map((plan) => (
            <article key={plan.name} className={`rounded-3xl p-6 shadow-xl shadow-ink/5 ${plan.featured ? 'bg-ink text-white' : 'bg-white'}`}>
              <p className="font-display text-2xl font-bold">{plan.name}</p>
              <p className="mt-5 text-4xl font-extrabold">Nu. {plan.price}<span className="text-base font-medium opacity-70"> / {plan.period}</span></p>
              <ul className="mt-6 space-y-3">
                {plan.perks.map((perk) => (
                  <li key={perk} className="text-sm opacity-80">✓ {perk}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
