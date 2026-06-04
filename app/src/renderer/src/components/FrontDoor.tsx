import { useState } from 'react'
import { Confetti } from './Confetti'
import { BrandMark } from './BrandMark'
import { useProjects } from '../store/projects'
import { useWizard } from '../store/wizard'

/** F1/F3 — the front door: one plain-language sentence kicks off the scoping wizard. */
export function FrontDoor(): React.JSX.Element {
  const begin = useWizard((s) => s.begin)
  const hasProjects = useProjects((s) => s.projects.length > 0)
  const backToSwitcher = useProjects((s) => s.backToSwitcher)
  const [idea, setIdea] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (): Promise<void> => {
    if (!idea.trim() || busy) return
    setBusy(true)
    await begin(idea)
  }

  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative flex h-full flex-col px-12 py-9">
        <div className="flex items-center justify-between">
          <BrandMark />
          {hasProjects && (
            <button
              onClick={backToSwitcher}
              className="rounded-full brut-2 bg-cream px-4 py-1.5 text-sm font-semibold text-ink"
            >
              Your builds
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="-rotate-2 rounded-full brut-2 bg-pink px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] text-ink">
            WELCOME TO HELM
          </span>
          <h1 className="mt-6 font-display text-[64px] font-black leading-none text-ink">
            What do you want to build?
          </h1>
          <p className="mt-4 text-lg text-soft">
            Tell me your idea in a sentence — I’ll take it from there.
          </p>

          <div className="mt-9 flex w-[760px] max-w-full items-center gap-3 rounded-[22px] brut bg-cream px-5 py-4">
            <span className="text-xl text-violet">✦</span>
            <input
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void submit()
              }}
              placeholder="I want to build a customer feedback portal for our SaaS…"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-soft/55"
              autoFocus
            />
            <button
              onClick={() => void submit()}
              disabled={busy}
              className="flex shrink-0 items-center gap-1.5 rounded-full brut-2 bg-pink px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-60"
            >
              {busy ? 'Starting…' : 'Start'} <span aria-hidden>→</span>
            </button>
          </div>

          <p className="mt-4 text-sm text-soft/80">
            <kbd className="rounded-md brut-2 bg-cream px-1.5 py-0.5 font-mono text-xs">⏎</kbd> to send ·
            take your time, no character limits
          </p>
        </div>
      </div>
    </div>
  )
}
