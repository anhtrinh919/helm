import { Confetti } from './Confetti'
import { Rail } from './Rail'
import { useProjects } from '../store/projects'

/** Placeholder board — replaced by the real build-spine in Group 4. */
export function ProjectBoardStub({ projectId }: { projectId: string }): React.JSX.Element {
  const project = useProjects((s) => s.projects.find((p) => p.id === projectId))
  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative flex h-full gap-6 p-6">
        <Rail activeProjectId={projectId} />
        <main className="flex flex-1 items-center justify-center">
          <div className="rounded-[18px] brut bg-cream px-10 py-8 text-center">
            <div className="font-display text-3xl font-black text-ink">
              {project?.name ?? 'Project'}
            </div>
            <div className="mt-3 text-soft">Your build-spine board lands in the next step.</div>
          </div>
        </main>
      </div>
    </div>
  )
}
