export default function Home() {
  return (
    <main className="mx-auto flex min-h-[82vh] w-full max-w-6xl items-center px-6 py-16">
      <div className="grid w-full gap-8 rounded-3xl border border-white/60 bg-white/55 p-8 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.7)] backdrop-blur-xl md:grid-cols-[1.15fr_0.85fr] md:p-12 dark:border-slate-800/60 dark:bg-slate-900/45">
        <section>
          <div className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
            Real-time blood ecosystem
          </div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">Blood-chain</h1>
          <p className="mt-4 max-w-xl text-slate-600 dark:text-slate-300">
            Donor, Hospital va Blood Center jarayonlarini bitta professional platformada jamlaydi: real-time zaxira, tez buyurtma va xavfsiz hamkorlik.
          </p>
          <div className="mt-8 grid gap-3 sm:max-w-md sm:grid-cols-2">
            <a
              href="/login"
              className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-rose-600 to-red-500 text-sm font-semibold text-white shadow-[0_16px_34px_-18px_rgba(190,24,54,0.95)] transition hover:brightness-105"
            >
              Tizimga kirish
            </a>
            <a
              href="/register"
              className="flex h-12 items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Ro&apos;yxatdan o&apos;tish
            </a>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/70 bg-white/75 p-5 dark:border-slate-700 dark:bg-slate-900/65">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Platform imkoniyatlari</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              Donor booking, monitoring va gamification
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              Hospital uchun tezkor digital order va tracking
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              Blood center inventory, expiry va analytics paneli
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/80 dark:text-slate-200">
            <p className="font-semibold text-slate-800 dark:text-slate-100">Eslatma</p>
            <p className="mt-1">Demo barqaror ishlashi uchun Supabase (auth + RLS + realtime) ulanishi faol bo&apos;lishi kerak.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
