import { Reveal } from '@/components/ui/Reveal';

const ROLES = ['Captain', 'Keeper', 'Striker', 'Coach', 'Sub'];

export default function SquadManagement() {
  return (
    <section id="squads" className="bg-white/55 py-24">
      <div className="mx-auto grid max-w-wide items-center gap-10 px-6 lg:grid-cols-2">
        <Reveal>
          <p className="chip">Squads</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Run the team from your phone.</h2>
          <p className="mt-5 text-slate2">Invite players, assign roles, confirm attendance and keep the whole squad moving.</p>
        </Reveal>
        <div className="rounded-[2rem] bg-ink p-6 text-white shadow-2xl shadow-ink/20">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl font-bold">Dragon FC</h3>
            <span className="chip !bg-green !text-white">11 confirmed</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ROLES.map((role, index) => (
              <div key={role} className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/60">#{index + 1}</p>
                <p className="font-bold">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
