import { Link } from 'react-router-dom'
import Placeholder from './Placeholder'
import type { ConstructionProject } from '@carry/shared'

export default function ConstructionCard({ project }: { project: ConstructionProject }) {
  return (
    <Link to={`/construction/${project.slug}`} className="group flex flex-col">
      <div className="relative">
        <Placeholder label={project.title} className="aspect-[4/3] w-full" />
        <span className="absolute left-3 top-3 bg-ochre px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-bone">
          {project.category}
        </span>
      </div>

      <h3 className="mt-4 font-display text-xl font-semibold text-ink group-hover:text-ochre-dark">
        {project.title}
      </h3>
      <p className="mt-1 text-sm text-concrete">{project.location}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/10 pt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-ink-soft">
        {project.areaSqft ? <span>{project.areaSqft.toLocaleString('en-IN')} sq ft</span> : null}
        {project.durationMonths ? <span>{project.durationMonths} months</span> : null}
        {project.packageTier ? <span>{project.packageTier}</span> : null}
      </div>
    </Link>
  )
}
