import { useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'motion/react'
import { EASE } from '../motion/ease.js'
import { PlaceCard } from './cards.jsx'

const pad = (n) => String(n).padStart(2, '0')

export function ProgressRing({ done, total }) {
  const ratio = total ? done / total : 0
  return (
    <div className="progress-ring" role="img" aria-label={`${done} of ${total} tasks complete`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" className="progress-ring-track" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          className="progress-ring-value"
          initial={false}
          animate={{ pathLength: ratio }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <span>
        <strong>{done}</strong>/{total}
      </span>
    </div>
  )
}

export function TaskList({ tasks, done, onToggle }) {
  return (
    <ol className="tasks">
      {tasks.map((task, index) => {
        const checked = done.includes(task.id)
        return (
          <li key={task.id}>
            <button
              type="button"
              className="task"
              aria-pressed={checked}
              onClick={() => onToggle(task.id)}
            >
              <span className="task-index">{pad(index + 1)}</span>
              <span className="task-label">
                {task.label}
                <motion.span
                  className="task-strike"
                  aria-hidden="true"
                  initial={false}
                  animate={{ scaleX: checked ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                />
              </span>
              <span className="task-check" data-checked={checked} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <motion.path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    initial={false}
                    animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                    transition={{ duration: 0.35, ease: EASE, delay: checked ? 0.1 : 0 }}
                  />
                </svg>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// A passport-style stamp that thumps down when the last task is ticked.
export function Stamp({ show, title }) {
  const reduced = useReducedMotion()
  const date = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(new Date())
    .toUpperCase()
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="stamp"
          role="status"
          aria-label={`${title} complete`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 2.6, rotate: -28 }}
          animate={{ opacity: 1, scale: 1, rotate: -9 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 520, damping: 20 }}
        >
          <svg viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <path id="stamp-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
            </defs>
            <circle cx="100" cy="100" r="94" className="stamp-ring" />
            <circle cx="100" cy="100" r="58" className="stamp-ring thin" />
            <text className="stamp-circle-text">
              <textPath href="#stamp-circle">QUEST COMPLETE ✺ KENYA QUEST ✺ NAIROBI ✺</textPath>
            </text>
            <path d="M78 101l14 14 30-32" className="stamp-check" />
            <text x="100" y="140" className="stamp-date">
              {date}
            </text>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// The quest's stops in order, joined by a line that draws as you scroll.
export function Route({ places }) {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.6'] })
  const draw = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <div ref={ref} className="route">
      <span className="route-rail" aria-hidden="true">
        <motion.span style={{ scaleY: reduced ? 1 : draw }} />
      </span>
      <ol className="route-list">
        {places.map((place, index) => (
          <motion.li
            key={place.id}
            className="route-stop"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <span className="route-dot" aria-hidden="true" />
            <PlaceCard place={place} step={index + 1} />
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
