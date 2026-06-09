import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../ui/Icon'
import { isIpcError, type Card, type CardStatus } from '@shared/ipc-schemas'
import { helm } from '../../bridge'
import { useBoard } from '../../store/board'
import { useProjects } from '../../store/projects'
import { Confetti } from '../Confetti'
import { Rail } from '../Rail'
import { TopBar } from './TopBar'
import { LivePreviewPane } from './LivePreviewPane'
import { SectionHeader } from './SectionHeader'
import { SpineItem } from './SpineItem'
import { NeedsYouHeadline } from './NeedsYouHeadline'
import { AddItemModal } from './AddItemModal'
import { PointModeToggle } from './PointModeOverlay'
import { FixCommentCard } from './FixCommentCard'
import { usePointFix, NO_QUEUED } from '../../store/pins'
import { DecisionsPanel } from './DecisionsPanel'
import { ProgressPanel } from './ProgressPanel'
import { DocsPanel } from './DocsPanel'
import { JourneyStrip } from '../journey/JourneyStrip'

type PanelTab = 'board' | 'decisions' | 'progress' | 'docs'

/** The DOT-MATRIX Cockpit A board: card spine + live preview, with
 *  the collapsed journey strip pinned at top in Build mode. */
export function ProjectBoard({ projectId }: { projectId: string }): React.JSX.Element {
  const { projectName, cards, loading, loadBoard, addCard, applyUpdate } = useBoard()
  const openSession = useProjects((s) => s.openSession)
  const backToSwitcher = useProjects((s) => s.backToSwitcher)
  const projects = useProjects((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const [panelTab, setPanelTab] = useState<PanelTab>('board')
  const [adding, setAdding] = useState(false)

  const queuedIds = usePointFix((s) => s.queued[projectId]) ?? NO_QUEUED
  const loadPins = usePointFix((s) => s.loadPins)

  useEffect(() => {
    void loadBoard(projectId)
    void loadPins(projectId)
    return helm.events.onBoardUpdate((p) => {
      if (p.projectId === projectId) applyUpdate(p.card)
    })
  }, [projectId, loadBoard, loadPins, applyUpdate])

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
    if (!res.queued) openSession(projectId, cardId)
  }

  const onAnswer = (cardId: string, answer: string): void => {
    const card = cards.find((c) => c.id === cardId)
    if (!card) return
    applyUpdate({
      ...card,
      status: 'building',
      decisionPrompt: card.decisionPrompt ? { ...card.decisionPrompt, answer } : null,
    })
  }

  const building = groups.building[0] ?? null
  const needsYou = groups.needs_you[0] ?? null
  const openCount = cards.filter((c) => c.type !== 'fix_comment' && c.status !== 'done').length

  const isBuildMode = project?.mode === 'build'
  const isRailComplete = project?.railComplete ?? false
  const showJourneyStrip = isBuildMode && isRailComplete

  // In iterate mode show an add-card affordance
  const isIterateMode = project?.mode === 'iterate'

  // Active spine cards (not done, not fix_comment)
  const activeCards = useMemo(() => {
    const order: CardStatus[] = ['building', 'needs_you', 'failed', 'up_next', 'planned']
    const result: Card[] = []
    for (const status of order) {
      result.push(...groups[status])
    }
    return result
  }, [groups])

  const doneCards = groups.done

  // Panel nav items for the right-side tabs
  const panelItems: { key: PanelTab; icon: string; label: string }[] = [
    { key: 'decisions', icon: 'git-branch', label: 'Decisions' },
    { key: 'progress', icon: 'chart-line-up', label: 'Progress' },
    { key: 'docs', icon: 'book-open', label: 'Docs' },
  ]

  return (
    <div className="hm">
      <Confetti />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Side rail */}
        <Rail activeProjectId={projectId} />

        {/* Main column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Top bar */}
          <TopBar
            projectName={projectName}
            building={building}
            onBack={backToSwitcher}
          />

          {/* Journey strip — only in Build mode, after journey is complete */}
          {showJourneyStrip && project && (
            <JourneyStrip project={project} />
          )}

          {/* Panel tab strip (Decisions / Progress / Docs) — shown above the split */}
          {panelTab !== 'board' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '0 20px',
                borderBottom: '1.5px solid var(--frame)',
                background: 'var(--surface)',
                height: 42,
                flexShrink: 0,
              }}
            >
              <button
                className="hm-btn hm-btn--sm hm-btn--ghost"
                onClick={() => setPanelTab('board')}
              >
                <Icon n="arrow-left" />Back to board
              </button>
              {panelItems.map((it) => (
                <button
                  key={it.key}
                  className={`hm-btn hm-btn--sm${panelTab === it.key ? '' : ' hm-btn--ghost'}`}
                  onClick={() => setPanelTab(it.key)}
                >
                  <Icon n={it.icon} />{it.label}
                </button>
              ))}
            </div>
          )}

          {/* Shell — card spine + live preview (or panel) */}
          <div className="hm-shell" style={{ background: 'var(--surface-2)' }}>
            {panelTab === 'decisions' ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <DecisionsPanel projectId={projectId} />
              </div>
            ) : panelTab === 'progress' ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <ProgressPanel projectId={projectId} />
              </div>
            ) : panelTab === 'docs' ? (
              <div style={{ flex: 1, minWidth: 0 }}>
                <DocsPanel projectId={projectId} />
              </div>
            ) : (
              <>
                {/* Card spine */}
                <section
                  style={{
                    width: 392,
                    flex: '0 0 392px',
                    borderRight: '1.5px solid var(--frame)',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  {/* Spine header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '18px 20px 12px',
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700 }}>Work</span>
                    {openCount > 0 && (
                      <span className="hm-chip">{openCount} open</span>
                    )}
                    {/* Panel shortcuts in the spine header */}
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                      {panelItems.map((it) => (
                        <button
                          key={it.key}
                          className="hm-btn hm-btn--sm hm-btn--quiet"
                          title={it.label}
                          onClick={() => setPanelTab(it.key)}
                        >
                          <Icon n={it.icon} />
                        </button>
                      ))}
                      <PointModeToggle projectId={projectId} />
                    </span>
                    {isIterateMode && (
                      <button
                        className="hm-btn hm-btn--sm"
                        onClick={() => setAdding(true)}
                        style={{ marginLeft: 4 }}
                      >
                        <Icon n="plus" />Add
                      </button>
                    )}
                  </div>

                  {/* Needs-you callout */}
                  {needsYou && (
                    <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
                      <NeedsYouHeadline card={needsYou} onAnswer={onAnswer} />
                    </div>
                  )}

                  {/* Scrollable card list */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '4px 20px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                    className="hm-scroll-fade"
                  >
                    {loading && (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
                        <div className="hm-thinking">
                          <i /><i /><i />
                        </div>
                      </div>
                    )}

                    {!loading && cards.length === 0 && (
                      <div
                        style={{
                          marginTop: 24,
                          border: '1.5px dashed var(--line-2)',
                          padding: '32px 20px',
                          textAlign: 'center',
                          color: 'var(--ink-3)',
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)', marginBottom: 6 }}>
                          {isIterateMode
                            ? 'Add your first feature to get started'
                            : 'Your build plan will appear here'}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-4)' }}>
                          {isIterateMode
                            ? 'Describe anything you want built and Helm will take it from here.'
                            : 'Once you complete the guided journey setup, your cards will appear.'}
                        </div>
                        {isIterateMode && (
                          <button
                            className="hm-btn hm-btn--sm hm-btn--primary"
                            style={{ marginTop: 16 }}
                            onClick={() => setAdding(true)}
                          >
                            <Icon n="plus" />Add first request
                          </button>
                        )}
                      </div>
                    )}

                    {!loading && activeCards.length > 0 && (
                      <>
                        {activeCards.map((c) => (
                          <SpineItem
                            key={c.id}
                            card={c}
                            mode={c.status === 'building' ? 'spotlight' : 'row'}
                            onOpen={(id) => openSession(projectId, id)}
                            onRetry={(id) => openSession(projectId, id)}
                          />
                        ))}
                      </>
                    )}

                    {/* Reported / fix-comment shelf */}
                    {reported.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <SectionHeader label="Reported" count={reported.length} icon="cursor-click" />
                        {reported.map((c) => (
                          <FixCommentCard
                            key={c.id}
                            card={c}
                            queued={queuedIds.includes(c.id)}
                            onStartFix={(id) => void startFix(id)}
                            onOpen={(id) => openSession(projectId, id)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Done history — condensed rows */}
                    {doneCards.length > 0 && (
                      <div style={{ marginTop: doneCards.length > 0 ? 6 : 0 }}>
                        <SectionHeader label="Done" count={doneCards.length} icon="check-circle" />
                        <div
                          style={{
                            background: 'var(--surface-3)',
                            border: '1.5px solid var(--frame)',
                          }}
                        >
                          {doneCards.map((c) => (
                            <SpineItem
                              key={c.id}
                              card={c}
                              mode="condensed"
                              onOpen={(id) => openSession(projectId, id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Iterate mode: add-card tile at bottom */}
                    {isIterateMode && cards.length > 0 && (
                      <div
                        style={{
                          border: '1.5px dashed var(--line-2)',
                          display: 'grid',
                          placeItems: 'center',
                          minHeight: 88,
                          color: 'var(--ink-3)',
                          cursor: 'pointer',
                          gap: 6,
                          background: 'rgba(255,255,255,.4)',
                        }}
                        onClick={() => setAdding(true)}
                      >
                        <Icon n="plus-circle" size={22} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Add a request</span>
                      </div>
                    )}
                  </div>
                </section>

                {/* Live preview */}
                <main style={{ flex: 1, minWidth: 0, display: 'flex' }}>
                  <LivePreviewPane projectId={projectId} />
                </main>
              </>
            )}
          </div>
        </div>
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
