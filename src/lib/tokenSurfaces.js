export const WORLDLAND_KOIN_SURFACES = [
  {
    id: "legacy-node-v2",
    label: "Legacy node reward KOIN (v2)",
    address: "0x7749473E36a8d6E741d9E581106E81CacAb7832a",
    note: "Used by the documented v2 node runtime and legacy node reward flow.",
  },
  {
    id: "portal-v3",
    label: "Portal KOIN reference (v3)",
    address: "0x029F7EfE08F37d987c2eDeD3de4Ba4a2b9BA422B",
    note: "Referenced by the current public v3 portal ABI surface.",
  },
  {
    id: "mission-market",
    label: "Mission / swap KOIN surface",
    address: "0x1d22f43A5105C9dc540DbC9F9d94E0CA4bF0Ec08",
    note: "Used by the mission-board settlement surface and the gated swap draft.",
  },
]

export function getWorldlandKoinSurfaces() {
  return WORLDLAND_KOIN_SURFACES.map((entry) => ({ ...entry }))
}

export function findWorldlandKoinSurface(address) {
  if (!address) return null
  const normalized = String(address).toLowerCase()
  const match = WORLDLAND_KOIN_SURFACES.find((entry) => entry.address.toLowerCase() === normalized)
  return match ? { ...match } : null
}
