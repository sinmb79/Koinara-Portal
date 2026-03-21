export function getTorqrTokenVisual(token) {
  const imageUri = String(token?.imageUri || "").trim()
  if (imageUri) {
    return {
      kind: "image",
      src: imageUri,
      alt: `${String(token?.name || token?.symbol || "Token").trim() || "Token"} image`,
    }
  }

  return {
    kind: "badge",
    label: String(token?.badge || token?.symbol || token?.name || "?").trim().slice(0, 2) || "??",
  }
}
