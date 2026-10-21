import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Check } from 'lucide-react'
import { Img } from './ui.jsx'
import { prefetch } from '../lib/api.js'
import { warmRoute } from '../lib/routes.js'
import { countCompletedTasks, useAllProgress } from '../lib/progress.js'
import { LANDMARKS } from '../lib/landmarks.js'

const pad = (n) => String(n).padStart(2, '0')
// Hovering a card fetches both halves of the next page: its chunk and its data.
const warmBoth = (path) => {
  warmRoute(path)
  prefetch(path)
}
const warm = (path) => ({ onPointerEnter: () => warmBoth(path), onFocus: () => warmBoth(path) })

function ProgressTag({ quest }) {
  const progress = useAllProgress()
  const done = countCompletedTasks(quest, progress[quest.id])
  if (!done) return null
  const complete = done === quest.taskCount
  return (
    <span className="card-progress" data-complete={complete}>
      {complete ? (
        <>
          <Check size={12} strokeWidth={3} /> Completed
        </>
      ) : (
        `${done}/${quest.taskCount} done`
      )}
    </span>
  )
}

export function QuestCard({ quest, index, style, ref }) {
  const path = `/quests/${quest.id}`
  // Quests on the home map keep their hotspot number everywhere they appear.
  const spot = LANDMARKS.findIndex((landmark) => landmark.id === quest.id)
  const number = spot >= 0 ? spot : index
  return (
    <motion.article ref={ref} className="quest-card" style={style} layout="position">
      <Link to={path} className="quest-card-link" data-cursor="View" {...warm(path)}>
        <div className="quest-card-media">
          <Img src={quest.image} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" />
          <span className="card-tag">{quest.category[0]}</span>
          <ProgressTag quest={quest} />
          <span className="card-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="quest-card-body">
          <p className="card-kicker">
            {number != null && <span>{pad(number + 1)}</span>}
            {quest.locationName}
          </p>
          <h3>{quest.title}</h3>
          <p className="card-text">{quest.description}</p>
          <p className="card-meta">
            <span>{quest.duration}</span>
            <span>{quest.budget}</span>
          </p>
        </div>
      </Link>
    </motion.article>
  )
}

export function PlaceCard({ place, step, ref }) {
  const path = `/places/${place.id}`
  return (
    <motion.article ref={ref} className="place-card" layout="position">
      <Link to={path} className="place-card-link" data-cursor="View" {...warm(path)}>
        <div className="place-card-media">
          <Img src={place.image} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw" />
          {step != null && <span className="place-step">{pad(step)}</span>}
        </div>
        <p className="card-kicker">
          {place.type} <span aria-hidden="true">·</span> {place.locationName}
        </p>
        <h3>{place.name}</h3>
        <p className="card-meta">
          <span>{place.price}</span>
        </p>
      </Link>
    </motion.article>
  )
}

export function DealCard({ deal }) {
  return (
    <article className="deal-card">
      <p className="eyebrow">Sample offer</p>
      <h3>{deal.title}</h3>
      <p className="deal-place">{deal.placeName}</p>
      <p className="deal-text">{deal.description}</p>
      <div className="deal-foot">
        <span>{deal.priceRange}</span>
        {deal.placeId && (
          <Link
            to={`/places/${deal.placeId}`}
            className="text-link"
            {...warm(`/places/${deal.placeId}`)}
          >
            View place <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    </article>
  )
}

export function LocationTile({ location }) {
  const path = `/locations/${location.id}`
  return (
    <Link to={path} className="location-tile" data-cursor="Explore" {...warm(path)}>
      <Img src={location.image} sizes="(min-width: 1024px) 33vw, 90vw" />
      <div className="location-tile-body">
        <h3>{location.name}</h3>
        <p>{location.tagline}</p>
      </div>
    </Link>
  )
}
