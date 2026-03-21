export function isStandaloneRoute(pathname) {
  return String(pathname || "").startsWith("/torqr")
}
