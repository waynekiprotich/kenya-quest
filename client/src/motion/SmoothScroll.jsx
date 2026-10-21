import { createContext, useContext, useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'

const LenisContext = createContext(null)

// Inertial scrolling for wheel and trackpad. Touch keeps native scrolling, and
// reduced-motion users get the browser default. Lenis runs on GSAP's ticker, so
// ScrollTrigger and the WebGL stage read the same scroll position in each frame.
//
// Lenis and GSAP are pure enhancement, so they load after the first paint rather
// than in the shell's critical chunk; until then the page scrolls natively.
export function SmoothScroll({ children }) {
  const reduced = useReducedMotion()
  const [lenis, setLenis] = useState(null)
  useEffect(() => {
    if (reduced) return
    let cancelled = false
    let teardown
    const start = async () => {
      // Wait for the critical work (first paint, the page's own data) to settle.
      await new Promise((resolve) =>
        (window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200)))(resolve),
      )
      if (cancelled) return
      const [{ default: Lenis }, libs] = await Promise.all([
        import('lenis'),
        import('./gsap.js'),
        import('lenis/dist/lenis.css'),
      ])
      if (cancelled) return
      const { gsap, ScrollTrigger } = libs
      const instance = new Lenis({ autoRaf: false, lerp: 0.11, anchors: { offset: -72 } })
      const raf = (time) => instance.raf(time * 1000)
      instance.on('scroll', ScrollTrigger.update)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
      setLenis(instance)
      teardown = () => {
        gsap.ticker.remove(raf)
        instance.destroy()
        setLenis(null)
      }
    }
    start().catch(() => {})
    return () => {
      cancelled = true
      teardown?.()
    }
  }, [reduced])

  return <LenisContext value={lenis}>{children}</LenisContext>
}

export function useLenis() {
  return useContext(LenisContext)
}

export function scrollToTop(lenis) {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo({ top: 0, behavior: 'instant' })
}

export function scrollToElement(lenis, element) {
  if (!element) return
  if (lenis) lenis.scrollTo(element, { offset: -72, duration: 1.4 })
  else element.scrollIntoView({ behavior: 'instant' })
}
