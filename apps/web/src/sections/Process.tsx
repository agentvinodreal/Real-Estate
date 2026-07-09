import Photo from '../components/Photo'
import { PROCESS } from '../lib/data'
import Reveal from '../components/motion/Reveal'

export default function Process() {
  return (
    <section id="process" className="border-y border-ink/10 bg-bone-dim">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <span className="kicker">Construction services</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Design to execution, under one roof.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
              We don’t just draw plans or lay bricks — we own the whole journey.
              One team, one point of accountability, from the first sketch to the
              day you get your keys.
            </p>
            <Photo seed="process-site" label="On-site construction" className="mt-8 aspect-[16/10] w-full" />
          </Reveal>

          <ol className="flex flex-col">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} as="li" delay={i * 0.08} y={16}>
                <div className={`flex gap-6 py-6 ${i !== PROCESS.length - 1 ? 'border-b border-ink/10' : ''}`}>
                  <span className="font-mono text-sm text-ochre-dark">{p.step}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
