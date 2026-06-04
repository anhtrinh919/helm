import { Confetti } from './Confetti'
import { Rail } from './Rail'

/** F2 — populated project switcher: the rail of builds + a calm main area. */
export function ProjectSwitcher(): React.JSX.Element {
  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative mx-auto flex h-full w-full max-w-[1640px] gap-6 p-6">
        <Rail />
        <main className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="-rotate-2 rounded-full brut-2 bg-lime px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-ink">
            YOUR WORKSHOP
          </span>
          <h2 className="mt-6 font-display text-5xl font-black text-ink">Pick up where you left off</h2>
          <p className="mt-4 text-lg text-soft">
            Open a build from the rail — or start a new one.
          </p>
        </main>
      </div>
    </div>
  )
}
