import { useEffect, useRef } from 'react'
import { helm } from '../../bridge'
import { useFeed, type FeedStatus } from '../../store/feed'
import { Rail } from '../Rail'
import { TopBar } from '../board/TopBar'
import { TabStrip } from '../board/TabStrip'
import { FeedEventRow } from './FeedEventRow'
import { SteeringInput } from './SteeringInput'
import { QuestionQueue } from './QuestionQueue'
import { CheckpointBlock } from './CheckpointBlock'
import { WhatYouReported } from './WhatYouReported'
import { useBoard } from '../../store/board'
import { Icon } from '../ui/Icon'

const PULSE: Record<FeedStatus, { label: string; dotCls: string }> = {
  idle:                 { label: 'STARTING',  dotCls: 'hm-dot hm-dot--idle' },
  active:               { label: 'WORKING',   dotCls: 'hm-dot hm-dot--live' },
  paused_for_decision:  { label: 'NEEDS YOU', dotCls: 'hm-dot hm-dot--needs' },
  done:                 { label: 'DONE',      dotCls: 'hm-dot hm-dot--success' },
  stopped:              { label: 'STOPPED',   dotCls: 'hm-dot hm-dot--idle' },
  error:                { label: 'FAILED',    dotCls: 'hm-dot hm-dot--fail' },
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
    <div className="hm" style={{ flexDirection: 'row' }}>
      <Rail activeProjectId={projectId} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <TopBar projectName={card ? title : 'Building'} building={banner} />
        <TabStrip active="board" onSelect={(t) => t === 'board' && onBack()} />

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 14, overflow: 'hidden' }}>
          {/* Breadcrumb */}
          <button
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.04em', textTransform: 'uppercase' }}
          >
            <Icon n="arrow-left" size={13} /> Board / {title}
          </button>

          {/* Session title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
            {card?.stepLabel && (
              <span className="hm-chip">{card.stepLabel}</span>
            )}
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: '5px 11px', fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <span className={pulse.dotCls} /> {pulse.label}
            </span>
          </div>

          {/* Body split */}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 18 }}>
            {/* Feed column */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', border: '1.5px solid var(--frame)', background: 'var(--surface-3)', padding: 18 }}>
              {status === 'idle' ? (
                <div style={{ flex: 1, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>Ready when you are</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)', maxWidth: 380 }}>
                      I'll build &ldquo;{title}&rdquo; and narrate every step in plain English. Steer me any time.
                    </div>
                    <button
                      onClick={() => void startBuild()}
                      className="hm-btn hm-btn--accent hm-btn--lg"
                      style={{ marginTop: 20 }}
                    >
                      Start building this
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {events.length === 0 && status === 'active' && (
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Getting started…</div>
                  )}
                  {events.map((ev) => (
                    <FeedEventRow key={ev.id} event={ev} />
                  ))}
                  {status === 'active' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 4 }} aria-label="Agent is working">
                      <div className="hm-thinking"><i /><i /><i /></div>
                    </div>
                  )}
                </div>
              )}

              {status === 'done' && card && (
                <div style={{ marginTop: 18 }}>
                  <CheckpointBlock
                    card={card}
                    onApprove={() => void approveCheckpoint('approved').then(onBack)}
                    onFlag={(note) => void approveCheckpoint('flagged', note)}
                  />
                </div>
              )}

              {status === 'stopped' && (
                <div className="hm-callout" style={{ marginTop: 18, flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>You stopped this build</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    Your place is saved — pick it back up whenever you're ready.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => void retry()} className="hm-btn hm-btn--accent">
                      Resume building
                    </button>
                    <button onClick={onBack} className="hm-btn">
                      Back to board
                    </button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="hm-callout hm-callout--fail" style={{ marginTop: 18, flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>
                    Something went wrong building this
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    Let's try again — your place is saved.
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => void retry()} className="hm-btn hm-btn--primary">
                      Try again
                    </button>
                    <button onClick={onBack} className="hm-btn">
                      Back to board
                    </button>
                  </div>
                </div>
              )}

              <div ref={feedEnd} />
            </div>

            {/* Side panel */}
            <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
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
        </div>
      </div>
    </div>
  )
}
