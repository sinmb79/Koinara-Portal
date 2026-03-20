import assert from "node:assert/strict"
import fs from "node:fs"

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8")
const navbarSource = fs.readFileSync(new URL("../src/components/Navbar.jsx", import.meta.url), "utf8")
const footerSource = fs.readFileSync(new URL("../src/components/Footer.jsx", import.meta.url), "utf8")
const externalLinksSource = fs.readFileSync(new URL("../src/lib/externalLinks.js", import.meta.url), "utf8")
const ecosystemPath = new URL("../src/pages/EcosystemHome.jsx", import.meta.url)
const ecosystemSource = fs.existsSync(ecosystemPath) ? fs.readFileSync(ecosystemPath, "utf8") : ""
const shellPath = new URL("../src/components/EcosystemShell.jsx", import.meta.url)
const shellSource = fs.existsSync(shellPath) ? fs.readFileSync(shellPath, "utf8") : ""
const projectRailPath = new URL("../src/components/Ecosystem/ProjectRail.jsx", import.meta.url)
const projectRailSource = fs.existsSync(projectRailPath) ? fs.readFileSync(projectRailPath, "utf8") : ""
const userSnapshotPath = new URL("../src/components/Ecosystem/UserSnapshot.jsx", import.meta.url)
const userSnapshotSource = fs.existsSync(userSnapshotPath) ? fs.readFileSync(userSnapshotPath, "utf8") : ""
const indexCssSource = fs.readFileSync(new URL("../src/index.css", import.meta.url), "utf8")

assert.equal(appSource.includes('const EcosystemHome = lazy(() => import("./pages/EcosystemHome.jsx"))'), true)
assert.equal(appSource.includes('<Route path="/ecosystem" element={<EcosystemHome />} />'), true)
assert.equal(appSource.includes('import EcosystemShell from "./components/EcosystemShell.jsx"'), true)
assert.equal(appSource.includes("<EcosystemShell>"), true)

assert.equal(navbarSource.includes('["/ecosystem", "Ecosystem"]'), true)

assert.equal(ecosystemSource.includes("OpenClaw Agent Marketplace"), true)
assert.equal(ecosystemSource.includes("Koinara Ecosystem"), true)
assert.equal(ecosystemSource.includes("usePolling("), false)
assert.equal(ecosystemSource.includes("ecosystem-project-rail"), false)
assert.equal(ecosystemSource.includes("user-status-rail"), false)
assert.equal(ecosystemSource.includes("style={{ width:"), false)

assert.equal(shellSource.includes("ecosystem-grid"), true)
assert.equal(shellSource.includes("<ProjectRail />"), true)
assert.equal(shellSource.includes("<UserSnapshot />"), true)
assert.equal(projectRailSource.includes("useLocation"), true)
assert.equal(projectRailSource.includes("export const PROJECTS"), true)
assert.equal(projectRailSource.includes("export function ActionLink"), true)
assert.equal(projectRailSource.includes("border-primary/30 bg-primary/[0.08]"), true)
assert.equal(userSnapshotSource.includes("Agent ID CARD"), true)
assert.equal(userSnapshotSource.includes("KOIN balance"), true)
assert.equal(userSnapshotSource.includes("Completed missions"), true)
assert.equal(userSnapshotSource.includes("usePolling(refreshDashboard, 15000, true)"), true)
assert.equal(indexCssSource.includes(".ecosystem-grid"), true)
assert.equal(indexCssSource.includes(".ecosystem-center"), true)
assert.equal(indexCssSource.includes("@media (max-width: 1279px)"), true)
assert.equal(indexCssSource.includes("@media (max-width: 1023px)"), true)
assert.equal(externalLinksSource.includes('discord: "https://discord.gg/r76T47r2pE"'), true)
assert.equal(footerSource.includes("EXTERNAL_LINKS.discord"), true)
assert.equal(footerSource.includes("Koinara Discord"), true)
