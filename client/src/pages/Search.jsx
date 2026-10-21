import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Search as SearchIcon, X } from 'lucide-react'
import { useApi } from '../lib/api.js'
import { PlaceCard, QuestCard } from '../components/cards.jsx'
import { Empty, ErrorState, Loading, SectionTitle } from '../components/ui.jsx'
import { Lines } from '../motion/text.jsx'
import { EASE } from '../motion/ease.js'

const SUGGESTIONS = ['forest', 'giraffe', 'nyama choma', 'museum', 'Karen', 'coffee', 'budget']

export default function Search() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const [term, setTerm] = useState(query)
  const input = useRef(null)
  const { data, error, loading, retry } = useApi('/search', { q: query })

  useEffect(() => setTerm(query), [query])
  // Search as you type, after a short pause.
  useEffect(() => {
    const next = term.trim()
    if (next === query) return
    const timer = setTimeout(() => setParams(next ? { q: next } : {}, { replace: true }), 280)
    return () => clearTimeout(timer)
  }, [term, query, setParams])

  const total = data
    ? data.quests.length + data.places.length + data.locations.length + data.categories.length
    : 0

  return (
    <div className="page search-page">
      <Lines
        lines={['Find your', <em key="next">next adventure.</em>]}
        className="page-title"
        delay={0.1}
      />
      <motion.form
        role="search"
        className="search-box"
        onSubmit={(event) => {
          event.preventDefault()
          setParams(term.trim() ? { q: term.trim() } : {})
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: EASE }}
      >
        <SearchIcon size={26} aria-hidden="true" />
        <input
          ref={input}
          type="search"
          maxLength={200}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="A place, a mood, a craving…"
          aria-label="Search quests, places and neighbourhoods"
          autoFocus
        />
        {term && (
          <button
            type="button"
            className="icon-button"
            aria-label="Clear search"
            onClick={() => {
              setTerm('')
              input.current?.focus()
            }}
          >
            <X size={18} />
          </button>
        )}
      </motion.form>
      <div className="suggestions">
        <span>Try</span>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="text-link"
            onClick={() => setTerm(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : !query ? null : loading ? (
        <Loading label="Searching" />
      ) : total === 0 ? (
        <Empty>
          Nothing matched “{query}”. <Link to="/quests">Browse every quest</Link>.
        </Empty>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={query}
            className="search-results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <p className="result-count" aria-live="polite">
              {total} {total === 1 ? 'result' : 'results'} for “{query}”
            </p>
            {data.quests.length > 0 && (
              <section className="section-tight">
                <SectionTitle eyebrow="Quests" title="Quests." />
                <div className="card-grid">
                  {data.quests.map((quest, index) => (
                    <QuestCard key={quest.id} quest={quest} index={index} />
                  ))}
                </div>
              </section>
            )}
            {data.places.length > 0 && (
              <section className="section-tight">
                <SectionTitle eyebrow="Places" title="Places." />
                <div className="place-grid">
                  {data.places.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </section>
            )}
            {(data.locations.length > 0 || data.categories.length > 0) && (
              <section className="section-tight">
                <SectionTitle eyebrow="Also" title="Areas and moods." />
                <ul className="link-list">
                  {data.locations.map((location) => (
                    <li key={location.id}>
                      <Link to={`/locations/${location.id}`}>{location.name}</Link>
                    </li>
                  ))}
                  {data.categories.map((category) => (
                    <li key={category}>
                      <Link to={`/categories/${category.toLowerCase()}`}>{category}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
