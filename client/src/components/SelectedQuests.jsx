import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Check } from 'lucide-react'
import { questsInOrder } from '../lib/landmarks.js'
import { prefetch } from '../lib/api.js'
import { countCompletedTasks, useAllProgress } from '../lib/progress.js'
import { useStage, useStageView } from './stage-context.js'
import { gsap, useScrollMotion } from '../motion/gsap.js'
import { useLenis } from '../motion/SmoothScroll.jsx'

const pad = (n) => String(n).padStart(2, '0')

function coordinates(quest) {
  if (quest?.lat == null) return null
  const lat = `${Math.abs(quest.lat).toFixed(3)}°${quest.lat < 0 ? 'S' : 'N'}`
  const lng = `${Math.abs(quest.lng).toFixed(3)}°${quest.lng < 0 ? 'W' : 'E'}`
  return `${lat} ${lng}`
}

function WorkItem({ item, index }) {
  const visual = useRef(null)
  const navigate = useNavigate()
  const lenis = useLenis()
  const { status, handlers } = useStage()
  const progress = useAllProgress()
  useStageView(`work:${index}`, visual)
  const path = `/quests/${item.id}`
  const quest = item.quest
  const done = quest ? countCompletedTasks(quest, progress[quest.id]) : 0
  const complete = quest && done === quest.taskCount

  function showOnMap() {
    handlers.current.pick?.(index)
    if (lenis) lenis.scrollTo(0, { duration: 1.4 })
    else window.scrollTo({ top: 0 })
    document.getElementById('world-panel')?.focus({ preventScroll: true })
  }

  return (
    <article className="work-item" data-side={index % 2 ? 'right' : 'left'}>
      <div className="work-media">
        <div
          ref={visual}
          className="work-visual"
          data-status={status}
          data-cursor="View"
          aria-hidden="true"
          onClick={() => navigate(path)}
          onPointerEnter={() => prefetch(path)}
        >
          <span className="work-corner" data-corner="tl" />
          <span className="work-corner" data-corner="tr" />
          <span className="work-corner" data-corner="bl" />
          <span className="work-corner" data-corner="br" />
          <span className="work-tag">Particle study {pad(index + 1)}</span>
          {coordinates(quest) && <span className="work-coords">{coordinates(quest)}</span>}
          {status === 'fallback' && <span className="work-fallback">{pad(index + 1)}</span>}
        </div>
      </div>
      <div className="work-copy">
        <p className="work-number work-reveal" aria-hidden="true">
          {pad(index + 1)}
        </p>
        <p className="work-kicker work-reveal">
          <span>{item.categories.join(' / ')}</span>
          <span>{item.area}</span>
        </p>
        <h3 className="work-title work-reveal">
          <Link to={path} onPointerEnter={() => prefetch(path)} onFocus={() => prefetch(path)}>
            {item.title}
          </Link>
        </h3>
        <p className="work-text work-reveal">{item.description}</p>
        {quest && (
          <dl className="work-meta work-reveal">
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
              <dd>
                {complete ? (
                  <span className="work-done">
                    <Check size={14} strokeWidth={3} /> Done
                  </span>
                ) : done ? (
                  `${done}/${quest.taskCount}`
                ) : (
                  quest.taskCount
                )}
              </dd>
            </div>
          </dl>
        )}
        <div className="work-actions work-reveal">
          <Link to={path} className="button button-line" aria-label={`View quest: ${item.title}`}>
            View quest <ArrowUpRight size={17} />
          </Link>
          <button type="button" className="text-link" onClick={showOnMap}>
            <ArrowUp size={15} /> Find {pad(index + 1)} on the map
          </button>
        </div>
      </div>
    </article>
  )
}

// Editorial list of the five quests. Numbers match the hero's hotspots, and each one
// has its own particle sculpture drawn by the shared stage.
export default function SelectedQuests({ quests, error, onRetry }) {
  const ref = useRef(null)
  const items = questsInOrder(quests)

  useScrollMotion(
    ref,
    ({ motion }) => {
      const rows = gsap.utils.toArray('.work-item')
      for (const row of rows) {
        const parts = row.querySelectorAll('.work-reveal')
        if (!motion) {
          gsap.from(parts, {
            opacity: 0,
            duration: 0.35,
            scrollTrigger: { trigger: row, start: 'top 80%' },
          })
          continue
        }
        gsap.from(parts, {
          y: 44,
          opacity: 0,
          duration: 1.1,
          stagger: 0.07,
          ease: 'expo.out',
          scrollTrigger: { trigger: row, start: 'top 75%' },
        })
        gsap.fromTo(
          row.querySelector('.work-visual'),
          { scale: 0.86 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: row, start: 'top bottom', end: 'top 30%', scrub: true },
          },
        )
        gsap.fromTo(
          row.querySelector('.work-number'),
          { yPercent: 25 },
          {
            yPercent: -25,
            ease: 'none',
            scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      }
      if (motion)
        gsap.fromTo(
          '.work-route span',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.work-list',
              start: 'top 65%',
              end: 'bottom 65%',
              scrub: true,
            },
          },
        )
    },
    [Boolean(quests)],
  )

  return (
    <section ref={ref} className="work" id="quests" aria-labelledby="work-title">
      <header className="work-head">
        <p className="eyebrow">(02) Selected quests</p>
        <h2 id="work-title">
          Five ways <em>to spend a day.</em>
        </h2>
        <div className="work-head-aside">
          <p>Numbers match the hotspots on the map. Hover a study to stir the particles.</p>
          <Link to="/quests" className="text-link">
            All quests <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      {error && (
        <p className="work-error" role="alert">
          Live quest details did not load.{' '}
          <button type="button" className="text-link" onClick={onRetry}>
            Try again
          </button>
        </p>
      )}
      <div className="work-list">
        <span className="work-route" aria-hidden="true">
          <span />
        </span>
        {items.map((item, index) => (
          <WorkItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  )
}
