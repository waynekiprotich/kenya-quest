import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { useApi } from '../lib/api.js'
import { PlaceCard } from '../components/cards.jsx'
import { Chips, Empty, ErrorState, Loading, PageHeader } from '../components/ui.jsx'

export default function Places() {
  const { data, error, loading, retry } = useApi('/places')
  const [params, setParams] = useSearchParams()
  const type = params.get('type') ?? ''
  const types = useMemo(() => {
    const counts = new Map()
    for (const place of data ?? []) counts.set(place.type, (counts.get(place.type) ?? 0) + 1)
    return [...counts].sort(([a], [b]) => a.localeCompare(b))
  }, [data])
  const places = (data ?? []).filter((place) => !type || place.type === type)

  if (error) return <ErrorState error={error} onRetry={retry} />
  return (
    <div className="page">
      <PageHeader
        eyebrow="Places"
        lines={['Forests, markets,', <em key="more">and long lunches.</em>]}
        description="Every stop on every quest, from rooftop decks to roadside grills."
      />
      <Chips
        id="places"
        label="Filter places by type"
        value={type}
        onChange={(value) => setParams(value ? { type: value } : {}, { replace: true })}
        options={[
          { value: '', label: 'All', count: data?.length },
          ...types.map(([name, count]) => ({ value: name, label: name, count })),
        ]}
      />
      {loading ? (
        <Loading label="Loading places" />
      ) : places.length ? (
        <div className="place-grid">
          <AnimatePresence mode="popLayout">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Empty>Nothing of that type yet.</Empty>
      )}
    </div>
  )
}
