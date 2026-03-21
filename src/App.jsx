import { lazy, Suspense, useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar.jsx"
import EcosystemShell from "./components/EcosystemShell.jsx"
import Footer from "./components/Footer.jsx"
import useStore from "./lib/store.js"
import { captureReferral } from "./lib/feeConfig.js"
import { LoadingState } from "./components/ui.jsx"
import { isStandaloneRoute } from "./lib/routeLayout.js"

const Home = lazy(() => import("./pages/Home.jsx"))
const EcosystemHome = lazy(() => import("./pages/EcosystemHome.jsx"))
const Guide = lazy(() => import("./pages/Guide.jsx"))
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"))
const JobExplorer = lazy(() => import("./pages/JobExplorer.jsx"))
const CreateJob = lazy(() => import("./pages/CreateJob.jsx"))
const JobDetail = lazy(() => import("./pages/JobDetail.jsx"))
const Providers = lazy(() => import("./pages/Providers.jsx"))
const NodeBond = lazy(() => import("./pages/NodeBond.jsx"))
const NodeRegister = lazy(() => import("./pages/NodeRegister.jsx"))
const Rewards = lazy(() => import("./pages/Rewards.jsx"))
const Admin = lazy(() => import("./pages/Admin.jsx"))
const AgentCatalog = lazy(() => import("./pages/AgentCatalog.jsx"))
const AgentProfile = lazy(() => import("./pages/AgentProfile.jsx"))
const AgentServiceRegister = lazy(() => import("./pages/AgentServiceRegister.jsx"))
const MissionBoard = lazy(() => import("./pages/MissionBoard.jsx"))
const MissionDetail = lazy(() => import("./pages/MissionDetail.jsx"))
const Tokenomics = lazy(() => import("./pages/Tokenomics.jsx"))
const TorqrHub = lazy(() => import("./pages/TorqrHub.jsx"))
const Swap = lazy(() => import("./pages/Swap.jsx"))

export default function App() {
  const location = useLocation()
  const { initReadOnly, refreshDashboard, loadJobs, loadRewards } = useStore()
  const standalone = isStandaloneRoute(location.pathname)

  useEffect(() => {
    const boot = async () => {
      await initReadOnly()
      await Promise.allSettled([refreshDashboard(), loadJobs(), loadRewards()])
    }
    boot()
  }, [initReadOnly, refreshDashboard, loadJobs, loadRewards])

  useEffect(() => {
    captureReferral()
  }, [])

  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  const routes = (
    <Suspense fallback={(
      <div className="page-shell py-16">
        <LoadingState label="Loading portal view..." />
      </div>
    )}>
      <Routes>
        <Route path="/ecosystem" element={<EcosystemHome />} />
        <Route path="/" element={<Home />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/agents" element={<AgentCatalog />} />
        <Route path="/agent/:address" element={<AgentProfile />} />
        <Route path="/jobs" element={<JobExplorer />} />
        <Route path="/submit" element={<CreateJob />} />
        <Route path="/job/:id" element={<JobDetail />} />
        <Route path="/providers" element={<Providers />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/agent-service" element={<AgentServiceRegister />} />
        <Route path="/dashboard/bond" element={<NodeBond />} />
        <Route path="/dashboard/register" element={<NodeRegister />} />
        <Route path="/dashboard/rewards" element={<Rewards />} />
        <Route path="/missions" element={<MissionBoard />} />
        <Route path="/tokenomics" element={<Tokenomics />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/torqr/*" element={<TorqrHub />} />
        <Route path="/missions/:id" element={<MissionDetail />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  )

  if (standalone) {
    return <div className="app-shell">{routes}</div>
  }

  return (
    <div className="app-shell">
      <Navbar />
      <main className="flex-1">
        <EcosystemShell>{routes}</EcosystemShell>
      </main>
      <Footer />
    </div>
  )
}
