import { FORMATIONS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function FormationBuilder() {
  const formation = FORMATIONS['4-3-3'];

  return (
    <section className="py-24">
      <div className="mx-auto grid max-w-wide items-center gap-10 px-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-b from-green to-lime p-5 shadow-2xl shadow-green/20">
          <div className="absolute inset-5 rounded-[1.5rem] border-2 border-white/70" />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
          {formation.map((player) => (
            <div
              key={`${player.role}-${player.x}-${player.y}`}
              className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xs font-extrabold text-ink shadow-lg"
              style={{ left: `${player.x}%`, top: `${player.y}%` }}
            >
              {player.role}
            </div>
          ))}
        </div>
        <Reveal>
          <p className="chip">Tactics</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Set the lineup before kickoff.</h2>
          <p className="mt-5 text-slate2">Formation templates make every casual match feel organized, fast and ready.</p>
        </Reveal>
      </div>
    </section>
  );
}
