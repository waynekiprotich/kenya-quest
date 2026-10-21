import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { QuestCard } from './cards.jsx'

// On wide screens the section pins and vertical scrolling drives the cards sideways;
// cards lean into the motion. Elsewhere it is a native swipeable row.
export default function QuestRail({ quests, children }) {
  const section = useRef(null)
  const track = useRef(null)
  const reduced = Boolean(useReducedMotion())
  const [pinned, setPinned] = useState(false)
  const [height, setHeight] = useState(null)
  const distance = useMotionValue(0)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform([scrollYProgress, distance], ([progress, total]) => -progress * total)
  const velocity = useVelocity(scrollYProgress)
  const tilt = useSpring(useTransform(velocity, [-0.5, 0, 0.5], [16, 0, -16]), {
    stiffness: 180,
    damping: 28,
  })
  const bar = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })

  useEffect(() => {
    const query = window.matchMedia('(min-width: 900px)')
    const update = () => setPinned(query.matches && !reduced)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [reduced])

  useLayoutEffect(() => {
    if (!pinned) {
      setHeight(null)
      return
    }
    const element = track.current
    const measure = () => {
      const total = Math.max(0, element.scrollWidth - element.parentElement.clientWidth)
      distance.set(total)
      setHeight(`calc(100svh + ${total}px)`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observer.observe(element.parentElement)
    return () => observer.disconnect()
  }, [pinned, quests, distance])

  return (
    <section
      ref={section}
      className="rail"
      data-pinned={pinned}
      style={{ height: height ?? undefined }}
    >
      <div className="rail-sticky">
        <div className="rail-head">{children}</div>
        <div className="rail-viewport">
          <motion.div ref={track} className="rail-track" style={pinned ? { x } : undefined}>
            <AnimatePresence mode="popLayout" initial={false}>
              {quests.map((quest, index) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  index={index}
                  style={pinned ? { rotateY: tilt, transformPerspective: 1100 } : undefined}
                />
              ))}
            </AnimatePresence>
            <Link to="/quests" className="rail-end" data-cursor="All">
              <span>See every quest</span>
              <ArrowUpRight size={28} />
            </Link>
          </motion.div>
        </div>
        {pinned && (
          <div className="rail-progress" aria-hidden="true">
            <motion.span style={{ scaleX: bar }} />
          </div>
        )}
      </div>
    </section>
  )
}
