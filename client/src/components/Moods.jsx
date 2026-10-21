import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { useStage, useStageView } from './stage-context.js'
import { prefetch } from '../lib/api.js'
import { gsap, ScrollTrigger, useScrollMotion } from '../motion/gsap.js'
import { EASE } from '../motion/ease.js'

const pad = (n) => String(n).padStart(2, '0')

// Order matches the stage's formations: rings, canopy, spiral, grid, ridges.
const MOODS = [
  { name: 'Culture', line: 'Towers, museums, markets and the stories between them.' },
  { name: 'Nature', line: 'A forest, a waterfall and caves, inside the city limits.' },
  { name: 'Food', line: 'Morning coffee to nyama choma, one plate at a time.' },
  { name: 'Nightlife', line: 'Rooftops and late tables when the lights come on.' },
  { name: 'Adventure', line: 'Longer walks, bigger views, a little mud on the shoes.' },
]

// Hovering or focusing a mood reshapes the particle field, restyles the list and
// fills the preview. On touch screens the mood nearest the middle of the screen leads.
export default function Moods({ data }) {
  const ref = useRef(null)
  const visual = useRef(null)
  const { stage, status } = useStage()
  const [active, setActive] = useState(null)
  useStageView('moods', visual)

  useEffect(() => stage?.setMood(active), [stage, active])

  // Without hover, the scroll picks the mood. On narrow screens the preview sticks to
  // the top, so the mood just below it leads and rows fade as they slide beneath it.
  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 899px)').matches
    const touch = window.matchMedia('(hover: none)').matches
    if (!narrow && !touch) return
    const preview = ref.current.querySelector('.moods-preview')
    // Where the stuck preview ends, measured from the top of the viewport.
    const line = () => {
      if (!narrow) return window.innerHeight * 0.6
      const nav = parseFloat(getComputedStyle(preview).top) || 0
      return nav + preview.offsetHeight
    }
    const triggers = gsap.utils.toArray('.mood-row', ref.current).flatMap((row, index) => {
      const link = row.querySelector('.mood-link')
      const lead = ScrollTrigger.create({
        trigger: row,
        start: () => `top ${line() + 90}px`,
        end: () => `bottom ${line() + 90}px`,
        onToggle: (self) => self.isActive && setActive(index),
      })
      if (!narrow) return [lead]
      const under = ScrollTrigger.create({
        trigger: row,
        start: () => `top ${line() - 8}px`,
        onToggle: (self) => {
          if (self.isActive) link.dataset.under = 'true'
          else delete link.dataset.under
        },
      })
      return [lead, under]
    })
    return () => triggers.forEach((trigger) => trigger.kill())
  }, [])

  useScrollMotion(ref, ({ motion }) => {
    gsap.from('.mood-row', {
      opacity: 0,
      y: motion ? 40 : 0,
      duration: motion ? 0.9 : 0.35,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.mood-list', start: 'top 75%' },
    })
  })

  const counts = Object.fromEntries((data?.categories ?? []).map((c) => [c.name, c.questCount]))
  const current = active === null ? null : MOODS[active]
  const matches = current
    ? (data?.quests ?? []).filter((quest) => quest.category.includes(current.name))
    : []

  return (
    <section ref={ref} className="moods" aria-labelledby="moods-title">
      <header className="moods-head">
        <p className="eyebrow">(03) Moods</p>
        <h2 id="moods-title">
          Different moods. <em>One living city.</em>
        </h2>
      </header>
      <div className="moods-grid">
        <ol
          className="mood-list"
          onPointerLeave={(event) => event.pointerType === 'mouse' && setActive(null)}
        >
          {MOODS.map((mood, index) => {
            const path = `/categories/${mood.name.toLowerCase()}`
            const count = counts[mood.name]
            return (
              <li key={mood.name} className="mood-row" data-active={active === index}>
                <Link
                  to={path}
                  className="mood-link"
                  data-dimmed={active !== null && active !== index}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setActive(index)
                    prefetch(path)
                  }}
                  onFocus={() => setActive(index)}
                  data-cursor="Open"
                >
                  <span className="mood-index">{pad(index + 1)}</span>
                  <span className="mood-name">
                    <span className="mood-name-sans">{mood.name}</span>
                    <em className="mood-name-serif" aria-hidden="true">
                      {mood.name}
                    </em>
                  </span>
                  <span className="mood-line">{mood.line}</span>
                  <span className="mood-count">
                    {count != null ? `${count} ${count === 1 ? 'quest' : 'quests'}` : ''}
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
        <div className="moods-preview">
          <div ref={visual} className="moods-visual" data-status={status}>
            <span className="work-corner" data-corner="tl" />
            <span className="work-corner" data-corner="tr" />
            <span className="work-corner" data-corner="bl" />
            <span className="work-corner" data-corner="br" />
          </div>
          <div className="moods-caption">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current?.name ?? 'all'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {current ? (
                  <>
                    <p className="moods-caption-title">
                      <em>{current.name}</em>
                    </p>
                    {matches.length > 0 && (
                      <ul className="moods-caption-list">
                        {matches.map((quest) => (
                          <li key={quest.id}>
                            <Link to={`/quests/${quest.id}`}>{quest.title}</Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <p className="moods-caption-hint">
                    Point at a mood, or tab to one, and the field takes its shape.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
