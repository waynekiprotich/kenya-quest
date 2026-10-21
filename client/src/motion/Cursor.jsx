import { useEffect, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'

// A label that trails the pointer over elements marked with data-cursor.
// The native cursor stays visible; touch and reduced-motion users never see it.
export default function Cursor() {
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [label, setLabel] = useState(null)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 })

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setEnabled(query.matches && !reduced)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [reduced])

  useEffect(() => {
    if (!enabled) return
    function labelFor(element) {
      const target = element instanceof Element ? element.closest('[data-cursor]') : null
      setLabel(target?.getAttribute('data-cursor') || null)
    }
    function move(event) {
      x.set(event.clientX)
      y.set(event.clientY)
      labelFor(event.target)
    }
    // Scrolling moves content under a still pointer, so look again.
    function scroll() {
      labelFor(document.elementFromPoint(x.get(), y.get()))
    }
    function leave() {
      setLabel(null)
    }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('scroll', scroll, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('scroll', scroll)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [enabled, x, y])

  if (!enabled) return null
  return (
    <motion.div className="cursor" style={{ x: springX, y: springY }} aria-hidden="true">
      <motion.span
        className="cursor-bubble"
        initial={false}
        animate={{ scale: label ? 1 : 0, opacity: label ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        {label}
      </motion.span>
    </motion.div>
  )
}
