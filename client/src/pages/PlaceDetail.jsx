import { useParams } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useApi } from '../lib/api.js'
import { imageSet, imageUrl } from '../lib/images.js'
import QuestMap from '../components/QuestMap.jsx'
import { DealCard, QuestCard } from '../components/cards.jsx'
import { Breadcrumbs, ErrorState, Loading, SectionTitle } from '../components/ui.jsx'
import { Parallax, Reveal } from '../motion/effects.jsx'
import { Lines, Words } from '../motion/text.jsx'
import NotFound from './NotFound.jsx'

export default function PlaceDetail() {
  const { id } = useParams()
  const { data: place, error, loading, retry } = useApi(`/places/${id}`)

  if (loading) return <Loading label="Loading place" />
  if (error?.status === 404) return <NotFound />
  if (error) return <ErrorState error={error} onRetry={retry} />

  return (
    <article className="detail">
      <header className="detail-hero detail-hero-short">
        <Parallax
          className="detail-hero-media"
          src={imageUrl(place.image, 1600)}
          srcSet={imageSet(place.image, [800, 1200, 1600, 2000])}
          sizes="100vw"
          amount={0.1}
          eager
        />
        <div className="detail-hero-copy">
          <Breadcrumbs
            items={[
              ['Places', '/places'],
              [place.locationName, `/locations/${place.location}`],
            ]}
          />
          <Lines lines={[place.name]} className="detail-title" delay={0.2} />
          <p className="detail-kicker">{place.type}</p>
        </div>
      </header>

      <div className="page detail-body">
        <Reveal as="dl" className="facts">
          {[
            ['Area', place.locationName],
            ['Price', place.price],
            ['Hours', place.openingInfo ?? 'Not listed'],
            ['Type', place.type],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </Reveal>

        <div className="detail-grid">
          <section>
            <Words text={place.description} className="detail-lede" />
            <div className="detail-actions">
              <a
                className="button button-ink"
                href={place.mapsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in Maps <ArrowUpRight size={16} />
              </a>
              {place.website && (
                <a
                  className="button button-outline"
                  href={place.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  Website <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </section>
          <aside className="detail-aside">
            <div className="map-frame">
              <QuestMap
                points={[{ id: place.id, lat: place.lat, lng: place.lng, title: place.name }]}
                activeId={place.id}
                className="map-canvas"
              />
            </div>
          </aside>
        </div>

        {place.quests.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="Quests" title="Quests that stop here." />
            <div className="card-grid">
              {place.quests.map((quest, index) => (
                <QuestCard key={quest.id} quest={quest} index={index} />
              ))}
            </div>
          </section>
        )}

        {place.deals.length > 0 && (
          <section className="section-tight">
            <SectionTitle eyebrow="Offers" title="Sample offers here." />
            <div className="deal-grid">
              {place.deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
