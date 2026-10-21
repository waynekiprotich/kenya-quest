import { useRef } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'motion/react'
import QuestMap from './QuestMap.jsx'

// A map whose frame opens from a narrow window to full width as it scrolls in.
export default function MapReveal({ points, activeId, className = '', children }) {
  const ref = useRef(null)
  const reduced = Boolean(useReducedMotion())
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const inset = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 12, 0])
  const radius = useTransform(scrollYProgress, [0, 1], [reduced ? 20 : 56, 20])
  const clipPath = useMotionTemplate`inset(0% ${inset}% round ${radius}px)`
  return (
    <motion.div ref={ref} className={`map-reveal ${className}`} style={{ clipPath }}>
      <QuestMap points={points} activeId={activeId} className="map-canvas" />
      {children}
    </motion.div>
  )
}
