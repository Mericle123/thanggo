import { BRAND } from '@/lib/theme';

export default function Download() {
  return (
    <section id="download" className="py-24">
      <div className="mx-auto max-w-wide px-6">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo via-purple to-pink p-8 text-white shadow-2xl shadow-purple/25 sm:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="chip !bg-white/15 !text-white">Download</p>
              <h2 className="mt-5 font-display text-4xl font-extrabold sm:text-6xl">Ready when you are.</h2>
              <p className="mt-5 max-w-xl text-white/75">{BRAND.sub}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={BRAND.appStoreUrl} className="btn-glass !bg-white !text-ink">App Store</a>
                <a href={BRAND.playStoreUrl} className="btn-glass !bg-white !text-ink">Google Play</a>
              </div>
            </div>
            <div className="grid h-40 w-40 place-items-center rounded-3xl bg-white text-center text-sm font-bold text-ink">
              QR
              <span className="block text-xs font-medium text-slate2">placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
