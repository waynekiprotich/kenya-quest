import { useApi } from '../lib/api.js'
import AreaList from '../components/AreaList.jsx'
import MapReveal from '../components/MapReveal.jsx'
import { ErrorState, Loading, PageHeader, SectionTitle } from '../components/ui.jsx'

export default function Locations() {
  const { data, error, loading, retry } = useApi('/locations')
  if (error) return <ErrorState error={error} onRetry={retry} />
  return (
    <div className="page">
      <PageHeader
        eyebrow="Neighbourhoods"
        lines={['Five areas,', <em key="pace">five different paces.</em>]}
        description="From the loud grid of the CBD to Karen’s long lunches under old trees."
      />
      {loading ? <Loading label="Loading neighbourhoods" /> : <AreaList areas={data} />}
      <section className="section-tight">
        <SectionTitle eyebrow="The city" title="Where they sit." />
        <MapReveal
          points={(data ?? []).map((location) => ({
            id: location.id,
            lat: location.lat,
            lng: location.lng,
            title: location.name,
            href: `/locations/${location.id}`,
          }))}
        />
      </section>
    </div>
  )
}
