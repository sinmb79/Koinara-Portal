import { useEffect, useRef, useCallback } from 'react'

export function usePolling(fn, ms = 10000, enabled = true) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!enabled) return
    ref.current()
    const id = setInterval(() => ref.current(), ms)
    return () => clearInterval(id)
  }, [ms, enabled])
}
