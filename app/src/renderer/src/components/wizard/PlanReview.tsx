import type { PlanBlock } from '@shared/ipc-schemas'

/** The proposed plan (F6): editable steps the user reviews before building starts. */
export function PlanReview({
  name,
  plan,
  onName,
  onPlan,
  onApprove,
  onBack,
}: {
  name: string
  plan: PlanBlock[]
  onName: (name: string) => void
  onPlan: (plan: PlanBlock[]) => void
  onApprove: () => void
  onBack: () => void
}): React.JSX.Element {
  const total = plan.length

  const edit = (id: string, patch: Partial<PlanBlock>): void =>
    onPlan(plan.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const remove = (id: string): void => onPlan(plan.filter((b) => b.id !== id))
  const add = (): void =>
    onPlan([...plan, { id: crypto.randomUUID(), title: 'New step', detail: '' }])

  return (
    <div className="mx-auto w-full max-w-[760px] py-8">
      <input
        value={name}
        onChange={(e) => onName(e.target.value)}
        className="w-full bg-transparent font-display text-4xl font-black text-ink outline-none"
        placeholder="Name your project"
      />
      <p className="mt-2 text-soft">
        Review and edit before we start building. You can change anything later.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {plan.map((b, i) => (
          <div key={b.id} className="rounded-[16px] brut bg-cream p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-ink px-2 text-xs font-black text-cream">
                {i + 1}
              </span>
              <span className="text-[11px] font-bold tracking-wide text-soft">
                STEP {i + 1} OF {total}
              </span>
              <button
                onClick={() => remove(b.id)}
                className="ml-auto text-xs font-semibold text-soft hover:text-orange"
              >
                Remove
              </button>
            </div>
            <input
              value={b.title}
              onChange={(e) => edit(b.id, { title: e.target.value })}
              className="mt-2 w-full bg-transparent font-display text-lg font-black text-ink outline-none"
            />
            <textarea
              value={b.detail ?? ''}
              onChange={(e) => edit(b.id, { detail: e.target.value })}
              placeholder="What this step does, in one sentence."
              rows={2}
              className="mt-1 w-full resize-none bg-transparent text-sm text-soft outline-none placeholder:text-soft/45"
            />
          </div>
        ))}
        <button
          onClick={add}
          className="self-start rounded-full brut-2 bg-canvas px-4 py-2 text-sm font-bold text-ink"
        >
          ＋ Add a step
        </button>
      </div>

      <div className="mt-7 flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-semibold text-soft hover:text-ink">
          ← Back to questions
        </button>
        <button
          onClick={onApprove}
          disabled={plan.length === 0}
          className="rounded-full brut bg-lime px-7 py-3 text-base font-bold text-ink disabled:opacity-50"
        >
          Approve plan
        </button>
      </div>
    </div>
  )
}
