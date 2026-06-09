import { useEffect } from 'react'
import { useProjects } from './store/projects'
import { usePreview } from './store/preview'
import { usePointFix } from './store/pins'
import { helm } from './bridge'
import { FrontDoor } from './components/FrontDoor'
import { ProjectSwitcher } from './components/ProjectSwitcher'
import { ProjectBoard } from './components/board/ProjectBoard'
import { ScopedSession } from './components/session/ScopedSession'
import { WizardScreen } from './components/wizard/WizardScreen'
import { JourneyView } from './components/journey/JourneyView'
import { Celebration } from './components/journey/Celebration'

export default function App(): React.JSX.Element {
  const view = useProjects((s) => s.view)
  const celebration = useProjects((s) => s.celebration)
  const init = useProjects((s) => s.init)
  const backToBoard = useProjects((s) => s.backToBoard)
  const applyBackgroundStatus = useProjects((s) => s.applyBackgroundStatus)
  const subscribePreview = usePreview((s) => s.subscribe)
  const subscribePointFix = usePointFix((s) => s.subscribe)

  useEffect(() => {
    void init()
    const offBg = helm.events.onBackgroundStatus((p) =>
      applyBackgroundStatus(p.projectId, p.backgroundStatus),
    )
    const offPreview = subscribePreview()
    const offPointFix = subscribePointFix()
    return () => {
      offBg()
      offPreview()
      offPointFix()
    }
  }, [init, applyBackgroundStatus, subscribePreview, subscribePointFix])

  const screen = ((): React.JSX.Element => {
    if (view.name === 'front-door') return <FrontDoor />
    if (view.name === 'switcher') return <ProjectSwitcher />
    if (view.name === 'wizard') return <WizardScreen projectId={view.projectId} />
    if (view.name === 'journey') return <JourneyView projectId={view.projectId} />
    if (view.name === 'session') {
      return (
        <ScopedSession
          projectId={view.projectId}
          cardId={view.cardId}
          onBack={() => backToBoard(view.projectId)}
        />
      )
    }
    return <ProjectBoard projectId={view.projectId} />
  })()

  return (
    <>
      {screen}
      {celebration && <Celebration projectId={celebration.projectId} />}
    </>
  )
}
