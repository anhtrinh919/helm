import { BrandMark } from './BrandMark'
import { useProjects } from '../store/projects'
import type { Project } from '@shared/ipc-schemas'

const SUBTITLE: Record<string, string> = {
  active: 'Building now',
  needs_you: 'Needs your call',
  failed: 'Off-track',
  idle: 'Paused',
}

function subtitle(p: Project): string {
  if (p.status === 'done') return 'Done'
  if (p.status === 'planning') return 'Just started'
  return SUBTITLE[p.backgroundStatus] ?? 'Ready'
}

const DOT: Record<string, string> = {
  active: 'bg-lime',
  needs_you: 'bg-pink',
  failed: 'bg-orange',
  idle: 'bg-canvas/35',
}

/** The dark left rail: brand, your builds, new-build CTA, agent presence. Shared across switcher + board. */
export function Rail({ activeProjectId }: { activeProjectId?: string }): React.JSX.Element {
  const projects = useProjects((s) => s.projects)
  const open = useProjects((s) => s.open)
  const newBuild = useProjects((s) => s.newBuild)

  return (
    <aside className="flex w-[260px] shrink-0 flex-col gap-5 rounded-[24px] bg-ink px-[18px] pb-[18px] pt-[22px]">
      <BrandMark onDark />
      <div className="text-[11px] font-bold tracking-[0.18em] text-canvas/45">YOUR BUILDS</div>

      <div className="flex flex-col gap-2.5">
        {projects.map((p) => {
          const isActive =
            p.id === activeProjectId || (!activeProjectId && p.backgroundStatus === 'active')
          return (
            <button
              key={p.id}
              onClick={() => open(p.id)}
              className={`flex flex-col gap-1.5 rounded-[14px] px-3.5 py-3 text-left transition ${
                isActive
                  ? 'brut bg-lime text-ink'
                  : 'border-2 border-transparent bg-railcard text-canvas hover:border-canvas/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isActive ? 'bg-ink' : DOT[p.backgroundStatus]}`} />
                <span className="flex-1 truncate text-sm font-semibold">{p.name}</span>
                {p.backgroundStatus === 'active' && (
                  <span className="rounded-full brut-2 bg-canvas px-1.5 text-[9px] font-black text-ink">
                    LIVE
                  </span>
                )}
              </div>
              <span className={`text-xs ${isActive ? 'text-ink/70' : 'text-canvas/50'}`}>
                {subtitle(p)}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={newBuild}
        className="flex items-center justify-center gap-2 rounded-[14px] brut bg-pink px-4 py-3 text-sm font-bold text-ink"
      >
        <span aria-hidden>＋</span> Start a new build
      </button>

      <div className="flex-1" />

      <div className="rounded-[14px] bg-violet p-3.5 text-canvas">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="text-[10px] font-bold tracking-[0.18em]">AGENT ONLINE</span>
        </div>
        <div className="mt-1.5 text-sm font-semibold">Ready to build</div>
      </div>
    </aside>
  )
}
