import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import { useApi } from '../lib/api.js'
import { imageSet, imageUrl } from '../lib/images.js'
import { useQuestProgress } from '../lib/progress.js'
import QuestMap from '../components/QuestMap.jsx'
import { DealCard } from '../components/cards.jsx'
import { ProgressRing, Route, Stamp, TaskList } from '../components/QuestProgress.jsx'
import { Breadcrumbs, ErrorState, Loading, SectionTitle } from '../components/ui.jsx'
import { Parallax, Reveal } from '../motion/effects.jsx'
import { Lines } from '../motion/text.jsx'
import { EASE } from '../motion/ease.js'
import NotFound from './NotFound.jsx'

export default function QuestDetail() {
  const { id } = useParams()
  const { data: quest, error, loading, retry } = useApi(`/quests/${id}`)
  const { done, toggle, reset } = useQuestProgress(id)

  if (loading) return <Loading label="Loading quest" />
  if (error?.status === 404) return <NotFound />
  if (error) return <ErrorState error={error} onRetry={retry} />

  const ids = new Set(quest.tasks.map((task) => task.id))
  const count = done.filter((taskId) => ids.has(taskId)).length
  const total = quest.tasks.length
  const complete = count === total
  const points = [
    { id: quest.id, lat: quest.lat, lng: quest.lng, title: quest.title },
    ...quest.nearby.map((place) => ({
      id: place.id,
      lat: place.lat,
      lng: place.lng,
      title: place.name,
      href: `/places/${place.id}`,
    })),
  ]

  return (
    <article className="detail">
      <header className="detail-hero">
        <Parallax
          className="detail-hero-media"
          src={imageUrl(quest.image, 1600)}
          srcSet={imageSet(quest.image, [800, 1200, 1600, 2000])}
          sizes="100vw"
          amount={0.1}
          eager
        />
        <div className="detail-hero-copy">
          <Breadcrumbs
            items={[
              ['Quests', '/quests'],
              [quest.locationName, `/locations/${quest.location}`],
            ]}
          />
          <Lines lines={[quest.title]} className="detail-title" delay={0.2} />
          <motion.ul
            className="detail-tags"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          >
            {quest.category.map((category) => (
              <li key={category}>
                <Link to={`/quests?mood=${category}`}>{category}</Link>
              </li>
            ))}
          </motion.ul>
        </div>
      </header>

      <div className="page detail-body">
        <Reveal as="dl" className="facts">
          {[
            ['Area', quest.locationName],
            ['Time', quest.duration],
            ['Budget', quest.budget],
            ['Effort', quest.difficulty],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Reveal>

        <div className="detail-grid">
          <section className="quest-panel" aria-labelledby="tasks-title">
            <p className="detail-lede">{quest.description}</p>
            <div className="quest-panel-head">
              <div>
                <p className="eyebrow">Your quest</p>
                <h2 id="tasks-title">Five things to do.</h2>
              </div>
              <ProgressRing done={count} total={total} />
            </div>
            <TaskList tasks={quest.tasks} done={done} onToggle={toggle} />
            <div className="quest-panel-foot">
              {complete ? (
                <p className="quest-done">You were there. That’s the whole point.</p>
              ) : (
                <p>Tap a task when you’ve done it.</p>
              )}
              {count > 0 && (
                <button type="button" className="text-link" onClick={reset}>
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
            <Stamp show={complete} title={quest.title} />
          </section>

          <aside className="detail-aside">
            <div className="map-frame">
              <QuestMap points={points} activeId={quest.id} className="map-canvas" />
            </div>
            <a className="button button-ink" href={quest.mapUrl} target="_blank" rel="noreferrer">
              Open in Google Maps <ArrowUpRight size={16} />
            </a>
          </aside>
        </div>

        {quest.nearby.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="The route" title={['Stop by stop.']} />
            <Route places={quest.nearby} />
          </section>
        )}

        {quest.deals.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="Along the way" title="Sample offers." />
            <div className="deal-grid">
              {quest.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
