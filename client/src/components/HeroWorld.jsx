import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, ArrowUpRight, Move, Pause, Play } from 'lucide-react'
import { LANDMARKS, questsInOrder } from '../lib/landmarks.js'
import { prefetch } from '../lib/api.js'
import { countCompletedTasks, useAllProgress } from '../lib/progress.js'
import { useStage, useStageView } from './stage-context.js'
import { EASE } from '../motion/ease.js'
import { Magnetic } from '../motion/effects.jsx'

const pad = (n) => String(n).padStart(2, '0')
const COUNT = LANDMARKS.length
const TOUR_DELAY = 7000
const IDLE_AFTER_INPUT = 12000
// Marker spots, in percent of the stage, for when WebGL is unavailable.
const STATIC_SPOTS = [
  [58, 30],
  [28, 46],
  [38, 72],
  [70, 70],
  [80, 44],
]

function FallbackArt() {
  const route = [...STATIC_SPOTS, STATIC_SPOTS[0]].map(([x, y]) => `${x},${y}`).join(' ')
  return (
    <svg className="world-fallback" viewBox="0 0 100 100" preserveAspectRatio="none">
      {[46, 38, 30, 22, 14].map((r, i) => (
        <ellipse key={r} cx="54" cy="52" rx={r} ry={r * 0.62} data-major={i % 2 === 0} />
      ))}
      <polyline points={route} />
    </svg>
  )
}

// The right half of the hero: an interactive particle city with five numbered quests,
// plus the floating panel that describes the selected one.
export default function HeroWorld({ quests }) {
  const area = useRef(null)
  const markers = useRef([])
  const tabs = useRef([])
  const lastInput = useRef(0)
  const focusScene = useRef(false)
  const { stage, status, handlers } = useStage()
  const reduced = Boolean(useReducedMotion())
  const progress = useAllProgress()
  const inView = useInView(area, { amount: 0.35 })
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [announce, setAnnounce] = useState(false)
  const [dragged, setDragged] = useState(false)
  const items = questsInOrder(quests)

  useStageView('hero', area)
  useEffect(() => stage?.setMarkers(markers.current), [stage])
  useEffect(() => stage?.setPaused(paused), [stage, paused])
  useEffect(() => {
    stage?.select(active, { focus: focusScene.current })
  }, [stage, active])

  function choose(index, { user = true } = {}) {
    focusScene.current = true
    setAnnounce(user)
    if (user) lastInput.current = Date.now()
    setActive(((index % COUNT) + COUNT) % COUNT)
  }

  useEffect(() => {
    handlers.current.pick = (index) => choose(index)
    handlers.current.interact = () => {
      lastInput.current = Date.now()
      setDragged(true)
    }
  })

  // A slow guided tour. Any input holds it; the pause control stops it outright.
  useEffect(() => {
    if (paused || reduced || !inView) return
    const timer = setInterval(() => {
      if (document.hidden || Date.now() - lastInput.current < IDLE_AFTER_INPUT) return
      focusScene.current = true
      setAnnounce(false)
      setActive((current) => (current + 1) % COUNT)
    }, TOUR_DELAY)
    return () => clearInterval(timer)
  }, [paused, reduced, inView])

  function onTabKey(event) {
    const moves = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = null
    if (event.key in moves) next = active + moves[event.key]
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = COUNT - 1
    if (next === null) return
    event.preventDefault()
    const index = (next + COUNT) % COUNT
    choose(index)
    tabs.current[index]?.focus()
  }

  function onStageKey(event) {
    if (event.target !== area.current) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      lastInput.current = Date.now()
      stage?.rotate(event.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  const item = items[active]
  const quest = item.quest
  const done = quest ? countCompletedTasks(quest, progress[quest.id]) : 0
  const path = `/quests/${item.id}`

  return (
    <>
      <div
        ref={area}
        className="world"
        data-status={status}
        tabIndex={status === 'ready' ? 0 : -1}
        role="group"
        aria-roledescription="3D map"
        aria-label="Particle map of Nairobi. Drag to turn it, or use the left and right arrow keys."
        onKeyDown={onStageKey}
        data-cursor={status === 'ready' ? 'Drag' : undefined}
      >
        {status === 'fallback' && <FallbackArt />}
        <div className="world-markers" aria-hidden="true">
          {LANDMARKS.map((landmark, index) => (
            <button
              key={landmark.id}
              type="button"
              tabIndex={-1}
              ref={(element) => {
                markers.current[index] = element
              }}
              className="world-marker"
              data-active={index === active}
              style={
                status === 'ready'
                  ? undefined
                  : { left: `${STATIC_SPOTS[index][0]}%`, top: `${STATIC_SPOTS[index][1]}%` }
              }
              onClick={() => choose(index)}
            >
              <span className="world-marker-dot">{pad(index + 1)}</span>
              <span className="world-marker-name">{landmark.name}</span>
            </button>
          ))}
        </div>
        {status === 'loading' && (
          <p className="world-loading" role="status">
            <span className="loading-bar" />
            Gathering the city
          </p>
        )}
        {status === 'ready' && (
          <p className="world-hint" data-hidden={dragged} aria-hidden="true">
            <Move size={14} /> Drag to explore
          </p>
        )}
      </div>

      <motion.aside
        id="world-panel"
        tabIndex={-1}
        className="world-panel"
        aria-label="Quests on the map"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.9, ease: EASE }}
      >
        <div className="world-panel-top">
          <p className="world-count" aria-hidden="true">
            <span className="world-count-mask">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={active}
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  exit={{ y: '-100%' }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  {pad(active + 1)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="world-count-total">/ {pad(COUNT)}</span>
          </p>
          <div className="world-controls">
            <button type="button" aria-label="Previous quest" onClick={() => choose(active - 1)}>
              <ArrowLeft size={16} />
            </button>
            {!reduced && (
              <button
                type="button"
                aria-label="Pause tour and animation"
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={15} /> : <Pause size={15} />}
              </button>
            )}
            <button type="button" aria-label="Next quest" onClick={() => choose(active + 1)}>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="world-tabs" role="toolbar" aria-label="Choose a quest" onKeyDown={onTabKey}>
          {items.map((entry, index) => (
            <button
              key={entry.id}
              ref={(element) => {
                tabs.current[index] = element
              }}
              type="button"
              tabIndex={index === active ? 0 : -1}
              aria-pressed={index === active}
              aria-label={`${pad(index + 1)}, ${entry.title}`}
              onClick={() => choose(index)}
            >
              <span>{pad(index + 1)}</span>
              <small>{entry.name}</small>
            </button>
          ))}
        </div>

        <div className="world-panel-live" aria-live={announce ? 'polite' : 'off'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={item.id}
              className="world-panel-body"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: reduced ? 0.15 : 0.4, ease: EASE }}
            >
              <p className="world-kicker">
                <span>{item.categories.join(' / ')}</span>
                <span>{item.area}</span>
              </p>
              <h2>{item.title}</h2>
              <p className="world-text">{item.description}</p>
              {quest && (
                <dl className="world-meta">
                  <div>
                    <dt>Time</dt>
                    <dd>{quest.duration}</dd>
                  </div>
                  <div>
                    <dt>Budget</dt>
                    <dd>{quest.budget}</dd>
                  </div>
                  <div>
                    <dt>Tasks</dt>
                    <dd>{done ? `${done}/${quest.taskCount}` : quest.taskCount}</dd>
                  </div>
                </dl>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <Magnetic strength={0.2}>
          <Link
            to={path}
            className="button button-lime"
            aria-label={`${done ? 'Continue quest' : 'View quest'}: ${item.title}`}
            onPointerEnter={() => prefetch(path)}
            onFocus={() => prefetch(path)}
          >
            {done ? 'Continue quest' : 'View quest'} <ArrowUpRight size={17} />
          </Link>
        </Magnetic>
      </motion.aside>
    </>
  )
}
