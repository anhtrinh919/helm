import { useState } from 'react'

/** "+ Add item" — create a feature request or a bug card. */
export function AddItemModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (type: 'feature' | 'bug', title: string) => void
}): React.JSX.Element {
  const [type, setType] = useState<'feature' | 'bug'>('feature')
  const [title, setTitle] = useState('')

  const submit = (): void => {
    if (!title.trim()) return
    onAdd(type, title.trim())
    onClose()
  }

  return (
    <div
      className="absolute inset-0 z-20 grid place-items-center bg-ink/30 p-6"
      onClick={onClose}
    >
      <div
        className="w-[460px] max-w-full rounded-[20px] brut bg-cream p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-display text-2xl font-black text-ink">Add to the board</div>

        <div className="mt-4 flex gap-2">
          {(['feature', 'bug'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`flex-1 rounded-[12px] brut-2 px-4 py-2.5 text-sm font-bold capitalize text-ink ${
                type === t ? (t === 'bug' ? 'bg-orange' : 'bg-lime') : 'bg-canvas'
              }`}
            >
              {t === 'feature' ? 'Feature' : 'Bug'}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder={type === 'bug' ? 'What’s broken?' : 'What should it do?'}
          autoFocus
          className="mt-3 w-full rounded-[12px] brut-2 bg-canvas px-4 py-3 text-ink outline-none placeholder:text-soft/55"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-soft">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="rounded-full brut-2 bg-pink px-5 py-2 text-sm font-bold text-ink disabled:opacity-50"
          >
            Add it
          </button>
        </div>
      </div>
    </div>
  )
}
