import { useEffect, useRef } from 'react'

/**
 * The phone's back gesture/button closes the top-most full-screen layer
 * (lightbox, document, appointment, form) instead of leaving the app: each
 * layer pushes one history entry while open. Layers closed with their own
 * buttons remove their entry again.
 */
interface Layer { close: () => void; popped: boolean }
const stack: Layer[] = []
let skip = 0
let listening = false

function onPop() {
  if (skip > 0) { skip--; return }
  const top = stack.pop()
  if (top) { top.popped = true; top.close() }
}

export function useBackClose(close: () => void) {
  const ref = useRef(close)
  ref.current = close
  useEffect(() => {
    if (!listening) { window.addEventListener('popstate', onPop); listening = true }
    const layer: Layer = { close: () => ref.current(), popped: false }
    stack.push(layer)
    history.pushState({ layer: true }, '')
    return () => {
      const i = stack.indexOf(layer)
      if (i >= 0) stack.splice(i, 1)
      if (!layer.popped) { skip++; history.back() }
    }
  }, [])
}
