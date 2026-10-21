import { useParams } from 'react-router-dom'
import { useApi } from '../lib/api.js'
import { imageSet, imageUrl } from '../lib/images.js'
import MapReveal from '../components/MapReveal.jsx'
import { DealCard, PlaceCard, QuestCard } from '../components/cards.jsx'
import { Breadcrumbs, Empty, ErrorState, Loading, SectionTitle } from '../components/ui.jsx'
import { Counter, Parallax, Reveal } from '../motion/effects.jsx'
import { Lines } from '../motion/text.jsx'
import NotFound from './NotFound.jsx'

const FOOD = ['Restaurant', 'Cafe']

export default function LocationDetail() {
  const { id } = useParams()
  const { data: location, error, loading, retry } = useApi(`/locations/${id}`)

  if (loading) return <Loading label="Loading neighbourhood" />
  if (error?.status === 404) return <NotFound />
  if (error) return <ErrorState error={error} onRetry={retry} />

  const food = location.places.filter((place) => FOOD.includes(place.type))
  const todo = location.places.filter(
    (place) => !FOOD.includes(place.type) && place.type !== 'Hotel',
  )
  const points = [
    ...location.quests.map((quest) => ({
      id: quest.id,
      lat: quest.lat,
      lng: quest.lng,
      title: quest.title,
      href: `/quests/${quest.id}`,
    })),
    ...location.places.map((place) => ({
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
          src={imageUrl(location.image, 1600)}
          srcSet={imageSet(location.image, [800, 1200, 1600, 2000])}
          sizes="100vw"
          amount={0.1}
          eager
        />
        <div className="detail-hero-copy">
          <Breadcrumbs items={[['Neighbourhoods', '/locations'], [location.name]]} />
          <Lines lines={[location.name]} className="detail-title" delay={0.2} />
          <p className="detail-kicker">{location.tagline}</p>
        </div>
      </header>

      <div className="page detail-body">
        <div className="detail-grid">
          <Reveal as="p" className="detail-lede">
            {location.description}
          </Reveal>
          <Reveal as="dl" className="stats" delay={0.1}>
            {[
              ['Quests', location.quests.length],
              ['Places', location.places.length],
              ['Offers', location.deals.length],
            ].map(([label, value]) => (
              <div key={label}>
                <dd>
                  <Counter value={value} />
                </dd>
                <dt>{label}</dt>
              </div>
            ))}
          </Reveal>
        </div>

        <section className="section-tight">
          <SectionTitle eyebrow="Quests" title={`Quests in ${location.name}.`} />
          {location.quests.length ? (
            <div className="card-grid">
              {location.quests.map((quest, index) => (
                <QuestCard key={quest.id} quest={quest} index={index} />
              ))}
            </div>
          ) : (
            <Empty>No quests start here yet. The places below are still worth the trip.</Empty>
          )}
        </section>

        {todo.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="See and do" title="Things to do." />
            <div className="place-grid">
              {todo.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        )}

        {food.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="Eat and drink" title="Where to eat." />
            <div className="place-grid">
              {food.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </section>
        )}

        {location.deals.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="Offers" title="Sample offers." />
            <div className="deal-grid">
              {location.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}

        <section className="section-tight">
          <SectionTitle eyebrow="The map" title="Everything here." />
          <MapReveal points={points} />
        </section>
      </div>
    </article>
  )
}
