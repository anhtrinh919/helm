import { useEffect } from 'react'
import { useProjects } from './store/projects'
import { usePreview } from './store/preview'
import { helm } from './bridge'
import { FrontDoor } from './components/FrontDoor'
import { ProjectSwitcher } from './components/ProjectSwitcher'
import { ProjectBoard } from './components/board/ProjectBoard'
import { ScopedSession } from './components/session/ScopedSession'
import { WizardScreen } from './components/wizard/WizardScreen'

export default function App(): React.JSX.Element {
  const view = useProjects((s) => s.view)
  const init = useProjects((s) => s.init)
  const backToBoard = useProjects((s) => s.backToBoard)
  const applyBackgroundStatus = useProjects((s) => s.applyBackgroundStatus)
  const subscribePreview = usePreview((s) => s.subscribe)

  useEffect(() => {
    void init()
    const offBg = helm.events.onBackgroundStatus((p) =>
      applyBackgroundStatus(p.projectId, p.backgroundStatus),
    )
    const offPreview = subscribePreview()
    return () => {
      offBg()
      offPreview()
    }
  }, [init, applyBackgroundStatus, subscribePreview])

  if (view.name === 'front-door') return <FrontDoor />
  if (view.name === 'switcher') return <ProjectSwitcher />
  if (view.name === 'wizard') return <WizardScreen projectId={view.projectId} />
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
}
