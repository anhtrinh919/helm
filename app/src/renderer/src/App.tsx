import { useEffect } from 'react'
import { useProjects } from './store/projects'
import { helm } from './bridge'
import { FrontDoor } from './components/FrontDoor'
import { ProjectSwitcher } from './components/ProjectSwitcher'
import { ProjectBoardStub } from './components/ProjectBoardStub'

export default function App(): React.JSX.Element {
  const view = useProjects((s) => s.view)
  const init = useProjects((s) => s.init)
  const applyBackgroundStatus = useProjects((s) => s.applyBackgroundStatus)

  useEffect(() => {
    void init()
    return helm.events.onBackgroundStatus((p) =>
      applyBackgroundStatus(p.projectId, p.backgroundStatus),
    )
  }, [init, applyBackgroundStatus])

  if (view.name === 'front-door') return <FrontDoor />
  if (view.name === 'switcher') return <ProjectSwitcher />
  return <ProjectBoardStub projectId={view.projectId} />
}
