import { APP_FEATURES } from '@/lib/theme';

export default function AppFeatures() {
  return (
    <section id="app" className="bg-ink py-24 text-white">
      <div className="mx-auto grid max-w-wide items-center gap-10 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="chip !bg-white/10 !text-white">App</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">A sports app built for repeat play.</h2>
          <p className="mt-5 text-white/65">Everything important is one tap away: booking, teams, challenges and events.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {APP_FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-3xl bg-white/10 p-5">
              <div className="text-3xl">{feature.icon}</div>
              <h3 className="mt-4 font-display text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-white/65">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
