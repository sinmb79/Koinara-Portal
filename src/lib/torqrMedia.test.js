import test from "node:test"
import assert from "node:assert/strict"

import { getTorqrTokenVisual } from "./torqrMedia.js"

test("getTorqrTokenVisual prefers image URI when present", () => {
  assert.deepEqual(
    getTorqrTokenVisual({
      imageUri: "https://example.com/token.png",
      badge: "22",
      symbol: "22B",
      name: "22b",
    }),
    {
      kind: "image",
      src: "https://example.com/token.png",
      alt: "22b image",
    },
  )
})

test("getTorqrTokenVisual falls back to badge text when image is absent", () => {
  assert.deepEqual(
    getTorqrTokenVisual({
      imageUri: "",
      badge: "22",
      symbol: "22B",
      name: "22b",
    }),
    {
      kind: "badge",
      label: "22",
    },
  )
})
