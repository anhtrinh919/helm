/** The Helm wordmark + logo block. `onDark` flips it for the dark rail. */
export function BrandMark({ onDark = false }: { onDark?: boolean }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`grid h-9 w-9 place-items-center rounded-[11px] brut ${onDark ? 'bg-lime' : 'bg-ink'}`}>
        <span className={`font-display text-lg font-black ${onDark ? 'text-ink' : 'text-canvas'}`}>H</span>
      </div>
      <span className={`font-display text-xl font-bold ${onDark ? 'text-canvas' : 'text-ink'}`}>Helm</span>
    </div>
  )
}
