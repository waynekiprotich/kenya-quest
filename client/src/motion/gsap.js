import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Late content (API data, fonts) changes the page height; keep trigger positions
// true. This lives here so only pages that actually build timelines observe.
if (typeof ResizeObserver !== 'undefined') {
  let timer = 0
  new ResizeObserver(() => {
    clearTimeout(timer)
    timer = setTimeout(() => ScrollTrigger.refresh(), 160)
  }).observe(document.body)
}

export { gsap, ScrollTrigger }

// Builds scroll timelines scoped to one element and reverts them on unmount.
// `build` receives `{ motion }`: false when the visitor prefers reduced motion,
// so each section can swap large movement for a short fade.
export function useScrollMotion(scope, build, deps = []) {
  useLayoutEffect(() => {
    if (!scope.current) return
    const media = gsap.matchMedia(scope.current)
    media.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (context) => build({ motion: Boolean(context.conditions.motion) }),
    )
    return () => media.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
