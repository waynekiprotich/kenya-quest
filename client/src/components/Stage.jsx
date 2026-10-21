import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { resolvedTheme, useTheme } from '../lib/theme.js'
import { StageContext } from './stage-context.js'

function supportsWebGL() {
  try {
    const context = document.createElement('canvas').getContext('webgl2')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch {
    return false
  }
}

// Owns the home page's single WebGL canvas. three.js loads on demand; if WebGL is
// missing or fails, `status` becomes 'fallback' and every section renders without it.
export function StageProvider({ kinds, children }) {
  const host = useRef(null)
  const handlers = useRef({})
  const reduced = Boolean(useReducedMotion())
  const { theme } = useTheme()
  const [state, setState] = useState({ stage: null, status: 'loading' })

  useEffect(() => {
    if (!supportsWebGL()) {
      setState({ stage: null, status: 'fallback' })
      return
    }
    let cancelled = false
    let instance
    import('../three/stage.js')
      .then(({ createStage }) => {
        if (cancelled) return
        try {
          instance = createStage(host.current, {
            kinds,
            theme: resolvedTheme(),
            reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            onPick: (index) => handlers.current.pick?.(index),
            onInteract: () => handlers.current.interact?.(),
            onStatus: (status) => setState((current) => ({ ...current, status })),
          })
          setState({ stage: instance, status: 'ready' })
        } catch {
          setState({ stage: null, status: 'fallback' })
        }
      })
      .catch(() => !cancelled && setState({ stage: null, status: 'fallback' }))
    return () => {
      cancelled = true
      instance?.dispose()
    }
    // The stage is built once; theme and motion changes are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => state.stage?.setTheme(theme), [state.stage, theme])
  useEffect(() => state.stage?.setReducedMotion(reduced), [state.stage, reduced])

  const value = useMemo(() => ({ ...state, handlers }), [state])
  return (
    <StageContext value={value}>
      <div ref={host} className="stage" data-status={state.status} aria-hidden="true" />
      {children}
    </StageContext>
  )
}
