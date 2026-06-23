import { FAQ as FAQ_ITEMS } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <p className="chip">FAQ</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Quick answers.</h2>
        </Reveal>
        <div className="mt-10 divide-y divide-ink/10 rounded-3xl bg-white shadow-xl shadow-ink/5">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="group p-6">
              <summary className="cursor-pointer list-none font-display text-xl font-bold">{item.q}</summary>
              <p className="mt-3 text-slate2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
