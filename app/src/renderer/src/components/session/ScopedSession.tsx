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
import { WhatYouReported } from './WhatYouReported'
import { useBoard } from '../../store/board'

const PULSE: Record<FeedStatus, { label: string; dot: string }> = {
  idle: { label: 'STARTING', dot: 'bg-soft' },
  active: { label: 'WORKING', dot: 'bg-lime' },
  paused_for_decision: { label: 'NEEDS YOU', dot: 'bg-pink' },
  done: { label: 'DONE', dot: 'bg-mint' },
  stopped: { label: 'STOPPED', dot: 'bg-soft' },
  error: { label: 'FAILED', dot: 'bg-orange' },
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
  const projectName = useBoard((s) => s.projectName)
  const open = useFeed((s) => s.open)
  const appendEvent = useFeed((s) => s.appendEvent)
  const upsertQuestion = useFeed((s) => s.upsertQuestion)
  const answer = useFeed((s) => s.answer)
  const reopen = useFeed((s) => s.reopen)
  const steer = useFeed((s) => s.steer)
  const approveCheckpoint = useFeed((s) => s.approveCheckpoint)
  const retry = useFeed((s) => s.retry)
  const startBuild = useFeed((s) => s.startBuild)
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
      <div className="relative mx-auto flex h-full w-full max-w-[1640px] gap-6 p-6">
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
              {status === 'idle' ? (
                <div className="grid flex-1 place-items-center text-center">
                  <div>
                    <div className="font-display text-2xl font-black text-ink">Ready when you are</div>
                    <div className="mt-1.5 max-w-sm text-soft">
                      I’ll build “{title}” and narrate every step in plain English. Steer me any time.
                    </div>
                    <button
                      onClick={() => void startBuild()}
                      className="mt-5 rounded-full brut bg-lime px-6 py-3 text-sm font-bold text-ink"
                    >
                      Start building this
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {events.length === 0 && status === 'active' && (
                    <div className="text-sm text-soft">Getting started…</div>
                  )}
                  {events.map((ev) => (
                    <FeedEventRow key={ev.id} event={ev} />
                  ))}
                  {status === 'active' && (
                    <div className="flex items-center gap-1.5 pl-[76px] pt-1" aria-label="Agent is working">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime" />
                    </div>
                  )}
                </div>
              )}

              {status === 'done' && card && (
                <div className="mt-5">
                  <CheckpointBlock
                    card={card}
                    onApprove={() => void approveCheckpoint('approved').then(onBack)}
                    onFlag={(note) => void approveCheckpoint('flagged', note)}
                  />
                </div>
              )}

              {status === 'stopped' && (
                <div className="mt-5 rounded-[18px] brut bg-cream p-5">
                  <div className="font-display text-xl font-black text-ink">You stopped this build</div>
                  <div className="mt-1 text-sm text-soft">
                    Your place is saved — pick it back up whenever you’re ready.
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => void retry()}
                      className="rounded-full brut-2 bg-lime px-4 py-2 text-sm font-bold text-ink"
                    >
                      Resume building
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
              {card?.type === 'fix_comment' && (
                <WhatYouReported card={card} projectName={projectName || 'your app'} />
              )}
              <QuestionQueue
                questions={questions}
                onAnswer={(qid, a) => void answer(qid, a)}
                onReopen={(qid) => void reopen(qid)}
              />
              <SteeringInput
                disabled={
                  status === 'idle' || status === 'done' || status === 'error' || status === 'stopped'
                }
                onSteer={(mode, text) => void steer(mode, text)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
