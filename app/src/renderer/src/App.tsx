import { useEffect } from 'react'
import { useProjects } from './store/projects'
import { helm } from './bridge'
import { FrontDoor } from './components/FrontDoor'
import { ProjectSwitcher } from './components/ProjectSwitcher'
import { ProjectBoard } from './components/board/ProjectBoard'
import { ScopedSession } from './components/session/ScopedSession'

export default function App(): React.JSX.Element {
  const view = useProjects((s) => s.view)
  const init = useProjects((s) => s.init)
  const backToBoard = useProjects((s) => s.backToBoard)
  const applyBackgroundStatus = useProjects((s) => s.applyBackgroundStatus)

  useEffect(() => {
    void init()
    return helm.events.onBackgroundStatus((p) =>
      applyBackgroundStatus(p.projectId, p.backgroundStatus),
    )
  }, [init, applyBackgroundStatus])

  if (view.name === 'front-door') return <FrontDoor />
  if (view.name === 'switcher') return <ProjectSwitcher />
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
