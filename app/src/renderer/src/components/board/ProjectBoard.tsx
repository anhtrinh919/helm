import { useEffect, useMemo, useState } from 'react'
import { isIpcError, type Card, type CardStatus } from '@shared/ipc-schemas'
import { helm } from '../../bridge'
import { useBoard } from '../../store/board'
import { useProjects } from '../../store/projects'
import { Confetti } from '../Confetti'
import { Rail } from '../Rail'
import { TopBar } from './TopBar'
import { TabStrip, StubPanel, type BoardTab } from './TabStrip'
import { LivePreviewPane } from './LivePreviewPane'
import { SectionHeader } from './SectionHeader'
import { SpineItem } from './SpineItem'
import { NeedsYouHeadline } from './NeedsYouHeadline'
import { AddItemModal } from './AddItemModal'
import { PointModeToggle } from './PointModeOverlay'
import { FixCommentCard } from './FixCommentCard'
import { usePointFix, NO_QUEUED } from '../../store/pins'

/** Pull "N of M" out of a "Step N of M: ..." label for the in-flight eyebrow. */
function stepOfM(card: Card | null, total: number, doneCount: number): string {
  if (card?.stepLabel) {
    const m = card.stepLabel.match(/Step\s+(\d+)\s+of\s+(\d+)/i)
    if (m) return `STEP ${m[1]} OF ${m[2]} · IN FLIGHT`
  }
  if (doneCount >= total && total > 0) return 'ALL STEPS DONE'
  return `${doneCount} OF ${total} DONE · READY`
}

// Board order (F50): BUILDING NOW → OFF-TRACK → NEEDS YOU → REPORTED → UP NEXT → PLANNED → DONE.
const ORDER_TOP: CardStatus[] = ['building', 'failed']
const ORDER_BOTTOM: CardStatus[] = ['up_next', 'planned', 'done']

/** The hero screen: the build-spine board for one project. */
export function ProjectBoard({ projectId }: { projectId: string }): React.JSX.Element {
  const { projectName, cards, loadBoard, addCard, applyUpdate } = useBoard()
  const openSession = useProjects((s) => s.openSession)
  const [tab, setTab] = useState<BoardTab>('board')
  const [adding, setAdding] = useState(false)
  // Cards queued behind the running fix — pushed by main, never tracked locally.
  const queuedIds = usePointFix((s) => s.queued[projectId]) ?? NO_QUEUED
  const loadPins = usePointFix((s) => s.loadPins)

  useEffect(() => {
    void loadBoard(projectId)
    void loadPins(projectId) // queue membership survives a board remount
    return helm.events.onBoardUpdate((p) => {
      if (p.projectId === projectId) applyUpdate(p.card)
    })
  }, [projectId, loadBoard, loadPins, applyUpdate])

  // Fix-comment cards live on their own REPORTED shelf (all statuses, F50–F55);
  // they never mix into the build-spine sections.
  const reported = useMemo(() => cards.filter((c) => c.type === 'fix_comment'), [cards])

  const groups = useMemo(() => {
    const by: Record<CardStatus, Card[]> = {
      planned: [],
      up_next: [],
      building: [],
      needs_you: [],
      failed: [],
      done: [],
      waiting: [],
    }
    for (const c of cards) {
      if (c.type === 'fix_comment') continue
      by[c.status].push(c)
    }
    return by
  }, [cards])

  const startFix = async (cardId: string): Promise<void> => {
    const res = await helm.fixSessions.start(projectId, cardId)
    if (isIpcError(res)) return
    // Queued: main pushes the new queue membership — nothing to track here.
    if (!res.queued) openSession(projectId, cardId)
  }

  const titleOf = useMemo(() => {
    const m = new Map<string, string>()
    for (const c of cards) m.set(c.id, c.title)
    return m
  }, [cards])

  const depLabel = (c: Card): string | undefined => {
    const first = c.dependsOn.find((id) => titleOf.has(id))
    return first ? titleOf.get(first) : undefined
  }

  const building = groups.building[0] ?? null
  const needsYou = groups.needs_you[0] ?? null
  const doneCount = groups.done.length
  const left = cards.length - doneCount

  const onAnswer = (cardId: string, answer: string): void => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    // Optimistic: answering unblocks the card. The real resume arrives via board:update.
    applyUpdate({
      ...card,
      status: 'building',
      decisionPrompt: card.decisionPrompt ? { ...card.decisionPrompt, answer } : null,
    })
  }

  const SECTION_META: Partial<Record<CardStatus, { label: string; pill: string }>> = {
    building: { label: 'BUILDING NOW', pill: 'bg-lime' },
    failed: { label: 'OFF-TRACK', pill: 'bg-orange' },
    up_next: { label: 'UP NEXT', pill: 'bg-bluesoft' },
    planned: { label: 'PLANNED', pill: 'bg-cream' },
    done: { label: 'DONE', pill: 'bg-mint' },
  }

  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative mx-auto flex h-full w-full max-w-[1640px] gap-6 p-6">
        <Rail activeProjectId={projectId} />

        <main className="flex min-w-0 flex-1 flex-col gap-5 overflow-hidden">
          <TopBar projectName={projectName} building={building} />
          <TabStrip
            active={tab}
            onSelect={setTab}
            trailing={tab === 'preview' ? <PointModeToggle projectId={projectId} /> : undefined}
          />

          {tab === 'preview' ? (
            <LivePreviewPane projectId={projectId} />
          ) : tab !== 'board' ? (
            <StubPanel tab={tab} />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
              {needsYou && <NeedsYouHeadline card={needsYou} onAnswer={onAnswer} />}

              {/* Board header — eyebrow, headline, live counts, add. */}
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-black tracking-[0.16em] text-soft">
                    {stepOfM(building, cards.length, doneCount)}
                  </div>
                  <div className="font-display text-2xl font-black text-ink">The build</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-soft">
                    <b className="text-ink">{groups.building.length}</b> building ·{' '}
                    <b className="text-ink">{doneCount}</b> done ·{' '}
                    <b className="text-ink">{left}</b> left
                  </span>
                  <button
                    onClick={() => setAdding(true)}
                    className="rounded-full brut-2 bg-pink px-4 py-2 text-sm font-bold text-ink"
                  >
                    ＋ Add a card
                  </button>
                </div>
              </div>

              {cards.length === 0 && (
                <div className="grid flex-1 place-items-center">
                  <div className="rounded-[18px] brut border-dashed bg-cream/60 px-10 py-8 text-center">
                    <div className="font-display text-xl font-black text-ink">Nothing on the board yet</div>
                    <div className="mt-1.5 text-soft">Add the first thing you want built.</div>
                  </div>
                </div>
              )}

              {(() => {
                const renderSection = (status: CardStatus): React.JSX.Element | null => {
                  const items = groups[status]
                  if (items.length === 0) return null
                  const meta = SECTION_META[status]
                  if (!meta) return null
                  return (
                    <section key={status} className="flex flex-col gap-2.5">
                      <SectionHeader label={meta.label} count={items.length} pill={meta.pill} />
                      {items.map((c) => (
                        <SpineItem
                          key={c.id}
                          card={c}
                          mode={
                            status === 'building'
                              ? 'spotlight'
                              : status === 'done'
                                ? 'condensed'
                                : 'row'
                          }
                          depLabel={status === 'up_next' || status === 'planned' ? depLabel(c) : undefined}
                          onOpen={(id) => openSession(projectId, id)}
                          onRetry={(id) => openSession(projectId, id)}
                        />
                      ))}
                    </section>
                  )
                }
                return (
                  <>
                    {ORDER_TOP.map(renderSection)}

                    {/* REPORTED shelf (F50–F55) — collapses entirely when empty. */}
                    {reported.length > 0 && (
                      <section className="flex flex-col gap-2.5 rounded-[16px] brut-2 bg-pinksoft/60 p-3.5">
                        <div className="flex items-baseline gap-2.5">
                          <SectionHeader
                            label="REPORTED"
                            count={reported.length}
                            pill="bg-pinksoft"
                          />
                          <span className="text-[11px] text-soft">
                            things you pointed at in the live app
                          </span>
                        </div>
                        {reported.map((c) => (
                          <FixCommentCard
                            key={c.id}
                            card={c}
                            queued={queuedIds.includes(c.id)}
                            onStartFix={(id) => void startFix(id)}
                            onOpen={(id) => openSession(projectId, id)}
                          />
                        ))}
                      </section>
                    )}

                    {ORDER_BOTTOM.map(renderSection)}
                  </>
                )
              })()}
            </div>
          )}
        </main>
      </div>

      {adding && (
        <AddItemModal
          onClose={() => setAdding(false)}
          onAdd={(type, title) => void addCard(type, title)}
        />
      )}
    </div>
  )
}
