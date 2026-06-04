import { useEffect, useRef } from 'react'
import { helm } from '../../bridge'
import { useFeed, type FeedStatus } from '../../store/feed'
import { Confetti } from '../Confetti'
import { Rail } from '../Rail'
import { TopBar } from '../board/TopBar'
import { TabStrip } from '../board/TabStrip'
import { FeedEventRow } from './FeedEventRow'
import { SteeringInput } from './SteeringInput'
import { QuestionQueue } from './QuestionQueue'
import { CheckpointBlock } from './CheckpointBlock'

const PULSE: Record<FeedStatus, { label: string; dot: string }> = {
  idle: { label: 'STARTING', dot: 'bg-soft' },
  active: { label: 'WORKING', dot: 'bg-lime' },
  paused_for_decision: { label: 'NEEDS YOU', dot: 'bg-pink' },
  done: { label: 'DONE', dot: 'bg-mint' },
  error: { label: 'STOPPED', dot: 'bg-orange' },
}

/** The scoped session screen (F16–F21): live feed, steering, question queue, checkpoint. */
export function ScopedSession({
  projectId,
  cardId,
  onBack,
}: {
  projectId: string
  cardId: string
  onBack: () => void
}): React.JSX.Element {
  const { card, session, status, events, questions } = useFeed()
  const open = useFeed((s) => s.open)
  const appendEvent = useFeed((s) => s.appendEvent)
  const upsertQuestion = useFeed((s) => s.upsertQuestion)
  const answer = useFeed((s) => s.answer)
  const reopen = useFeed((s) => s.reopen)
  const steer = useFeed((s) => s.steer)
  const approveCheckpoint = useFeed((s) => s.approveCheckpoint)
  const retry = useFeed((s) => s.retry)
  const syncFeed = useFeed((s) => s.syncFeed)
  const feedEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void open(projectId, cardId)
  }, [projectId, cardId, open])

  // Subscribe to live pushes for whichever session is currently attached, and
  // backfill once on (re)subscribe so any push missed during the gap self-heals.
  const sessionId = session?.id
  useEffect(() => {
    if (!sessionId) return
    const offFeed = helm.events.onFeedEvent((p) => {
      if (p.sessionId === sessionId) appendEvent(p.event)
    })
    const offQ = helm.events.onQuestionUpdate((p) => {
      if (p.sessionId === sessionId) upsertQuestion(p.question)
    })
    void syncFeed(sessionId)
    return () => {
      offFeed()
      offQ()
    }
  }, [sessionId, appendEvent, upsertQuestion, syncFeed])

  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events.length])

  const title = card?.title ?? 'Building'
  const pulse = PULSE[status]
  const banner = status === 'active' || status === 'paused_for_decision' ? card : null

  return (
    <div className="relative h-full w-full bg-canvas">
      <Confetti />
      <div className="relative flex h-full gap-6 p-6">
        <Rail activeProjectId={projectId} />

        <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
          <TopBar projectName={card ? title : 'Building'} building={banner} />
          <TabStrip active="board" onSelect={(t) => t === 'board' && onBack()} />

          {/* Sub-header breadcrumb */}
          <button onClick={onBack} className="flex items-center gap-2 self-start text-sm font-semibold text-soft hover:text-ink">
            <span aria-hidden>←</span> Board / {title}
          </button>

          {/* Session title row */}
          <div className="flex items-center gap-3">
            <div className="font-display text-2xl font-black text-ink">{title}</div>
            {card?.stepLabel && (
              <span className="rounded-full brut-2 bg-cream px-3 py-1 text-xs font-bold text-ink">
                {card.stepLabel}
              </span>
            )}
            <span className="ml-auto flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 text-[11px] font-black text-cream">
              <span className={`h-2 w-2 animate-pulse rounded-full ${pulse.dot}`} /> {pulse.label}
            </span>
          </div>

          {/* Body split */}
          <div className="flex min-h-0 flex-1 gap-5">
            {/* Feed column */}
            <div className="flex min-w-0 flex-1 flex-col overflow-y-auto rounded-[18px] brut bg-cream/50 p-5">
              <div className="flex flex-col gap-3">
                {events.length === 0 && status === 'active' && (
                  <div className="text-sm text-soft">Getting started…</div>
                )}
                {events.map((ev) => (
                  <FeedEventRow key={ev.id} event={ev} />
                ))}
              </div>

              {status === 'done' && card && (
                <div className="mt-5">
                  <CheckpointBlock
                    card={card}
                    onApprove={() => void approveCheckpoint('approved')}
                    onFlag={(note) => void approveCheckpoint('flagged', note)}
                  />
                </div>
              )}

              {status === 'error' && (
                <div className="mt-5 rounded-[18px] brut bg-orangesoft p-5">
                  <div className="font-display text-xl font-black text-ink">
                    Something went wrong building this
                  </div>
                  <div className="mt-1 text-sm text-soft">
                    Let’s try again — your place is saved.
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => void retry()}
                      className="rounded-full brut-2 bg-ink px-4 py-2 text-sm font-bold text-cream"
                    >
                      Try again
                    </button>
                    <button
                      onClick={onBack}
                      className="rounded-full brut-2 bg-cream px-4 py-2 text-sm font-bold text-ink"
                    >
                      Back to board
                    </button>
                  </div>
                </div>
              )}

              <div ref={feedEnd} />
            </div>

            {/* Side panel */}
            <div className="flex w-[360px] shrink-0 flex-col gap-4 overflow-y-auto">
              <QuestionQueue
                questions={questions}
                onAnswer={(qid, a) => void answer(qid, a)}
                onReopen={(qid) => void reopen(qid)}
              />
              <SteeringInput
                disabled={status === 'done' || status === 'error'}
                onSteer={(mode, text) => void steer(mode, text)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
