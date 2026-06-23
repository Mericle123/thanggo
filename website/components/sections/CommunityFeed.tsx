import { FEED } from '@/lib/theme';
import { Reveal } from '@/components/ui/Reveal';

export default function CommunityFeed() {
  return (
    <section className="bg-white/55 py-24">
      <div className="mx-auto max-w-wide px-6">
        <Reveal>
          <p className="chip">Community</p>
          <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">The local sports feed.</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {FEED.map((post) => (
            <article key={post.handle} className="rounded-3xl bg-white p-5 shadow-xl shadow-ink/5">
              <img src={post.img} alt="" className="h-44 w-full rounded-2xl object-cover" />
              <div className="mt-4 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-bg text-xl">{post.sport}</span>
                <div>
                  <p className="font-bold">{post.user}</p>
                  <p className="text-sm text-slate2">{post.handle}</p>
                </div>
              </div>
              <p className="mt-4 text-slate2">{post.text}</p>
              <p className="mt-4 text-sm font-bold">{post.likes} likes</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
