import ProjectRail from "./Ecosystem/ProjectRail.jsx"
import UserSnapshot from "./Ecosystem/UserSnapshot.jsx"

export default function EcosystemShell({ children }) {
  return (
    <div className="ecosystem-grid">
      <ProjectRail />
      <div className="ecosystem-center">{children}</div>
      <UserSnapshot />
    </div>
  )
}
