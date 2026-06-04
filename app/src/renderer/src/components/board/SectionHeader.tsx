/** A spine section divider: a labeled pill, a count, and a rule. */
export function SectionHeader({
  label,
  count,
  pill,
}: {
  label: string
  count: number
  pill: string
}): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className={`rounded-full brut-2 ${pill} px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-ink`}>
        {label}
      </span>
      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-cream">
        {count}
      </span>
      <span className="h-[2px] flex-1 rounded-full bg-ink/10" />
    </div>
  )
}
