import { STATS } from '../lib/data'
import Reveal from '../components/motion/Reveal'
import CountUp from '../components/motion/CountUp'

export default function Stats() {
  return (
    <section id="stats" className="bg-steel text-bone">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="border-l border-bone/20 pl-5">
              <CountUp value={s.value} className="font-display text-4xl font-semibold text-bone sm:text-5xl" />
              <div className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-bone/55">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
