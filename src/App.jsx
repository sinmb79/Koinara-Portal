import { Routes, Route } from "react-router-dom"
import { useEffect } from "react"
import Navbar from "./components/Navbar.jsx"
import useStore from "./lib/store.js"
import Home from "./pages/Home.jsx"
import Guide from "./pages/Guide.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import JobExplorer from "./pages/JobExplorer.jsx"
import CreateJob from "./pages/CreateJob.jsx"
import JobDetail from "./pages/JobDetail.jsx"
import Providers from "./pages/Providers.jsx"
import NodeBond from "./pages/NodeBond.jsx"
import NodeRegister from "./pages/NodeRegister.jsx"
import Rewards from "./pages/Rewards.jsx"
import Admin from "./pages/Admin.jsx"
import { captureReferral } from "./lib/feeConfig.js"
import { useT } from "./lib/i18n.js"

export default function App() {
  const { initReadOnly, refreshDashboard, loadJobs, loadRewards, lang } = useStore()
  const t = useT(lang)

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

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/jobs" element={<JobExplorer />} />
          <Route path="/submit" element={<CreateJob />} />
          <Route path="/job/:id" element={<JobDetail />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/bond" element={<NodeBond />} />
          <Route path="/dashboard/register" element={<NodeRegister />} />
          <Route path="/dashboard/rewards" element={<Rewards />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>{t("footer_worldland_primary")}</span>
        </div>
      </footer>
    </div>
  )
}
