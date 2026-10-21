import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Lines, Words } from '../motion/text.jsx'

export default function NotFound() {
  return (
    <div className="page not-found">
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <Lines lines={['Off the map.']} className="page-title" delay={0.1} />
      <Words
        className="page-description"
        inView={false}
        delay={0.3}
        text="This page doesn’t exist, but Nairobi still does."
      />
      <div className="detail-actions">
        <Link to="/" className="button button-ink">
          Back home
        </Link>
        <Link to="/quests" className="button button-outline">
          Browse quests <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  )
}
