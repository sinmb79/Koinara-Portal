import assert from "node:assert/strict"
import fs from "node:fs"

const appSource = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8")
const navbarSource = fs.readFileSync(new URL("../src/components/Navbar.jsx", import.meta.url), "utf8")
const ecosystemPath = new URL("../src/pages/EcosystemHome.jsx", import.meta.url)
const ecosystemSource = fs.existsSync(ecosystemPath) ? fs.readFileSync(ecosystemPath, "utf8") : ""

assert.equal(appSource.includes('const EcosystemHome = lazy(() => import("./pages/EcosystemHome.jsx"))'), true)
assert.equal(appSource.includes('<Route path="/ecosystem" element={<EcosystemHome />} />'), true)

assert.equal(navbarSource.includes('["/ecosystem", "Ecosystem"]'), true)

assert.equal(ecosystemSource.includes("OpenClaw Agent Marketplace"), true)
assert.equal(ecosystemSource.includes("Koinara Ecosystem"), true)
assert.equal(ecosystemSource.includes("ecosystem-project-rail"), true)
assert.equal(ecosystemSource.includes("user-status-rail"), true)
assert.equal(ecosystemSource.includes("Agent ID CARD"), true)
assert.equal(ecosystemSource.includes("KOIN balance"), true)
assert.equal(ecosystemSource.includes("Completed missions"), true)
