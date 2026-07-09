import { STATS } from '../lib/data'

export default function Stats() {
  return (
    <section id="stats" className="bg-steel text-bone">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="border-l border-bone/20 pl-5">
              <div className="font-display text-4xl font-semibold text-bone sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bone/55">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
