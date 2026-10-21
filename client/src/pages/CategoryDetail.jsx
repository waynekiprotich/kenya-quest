import { Link, useParams } from 'react-router-dom'
import { useApi } from '../lib/api.js'
import { QuestCard } from '../components/cards.jsx'
import { Breadcrumbs, Empty, ErrorState, Loading, PageHeader } from '../components/ui.jsx'

export default function CategoryDetail() {
  const { category } = useParams()
  const { data, error, loading, retry } = useApi('/quests', { category })
  const title = category ? category[0].toUpperCase() + category.slice(1) : ''
  if (error) return <ErrorState error={error} onRetry={retry} />
  return (
    <div className="page">
      <Breadcrumbs items={[['Moods', '/categories'], [title]]} />
      <PageHeader eyebrow="Mood" lines={[<em key="title">{title}.</em>]} />
      {loading ? (
        <Loading label="Loading quests" />
      ) : data.length ? (
        <div className="card-grid">
          {data.map((quest, index) => (
            <QuestCard key={quest.id} quest={quest} index={index} />
          ))}
        </div>
      ) : (
        <Empty>
          Nothing tagged {title.toLowerCase()} yet. <Link to="/quests">See every quest</Link>.
        </Empty>
      )}
    </div>
  )
}
