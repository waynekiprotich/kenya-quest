import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApi } from '../lib/api.js'
import { LANDMARKS } from '../lib/landmarks.js'
import MapReveal from '../components/MapReveal.jsx'
import QuestRail from '../components/QuestRail.jsx'
import { Chips, Empty, ErrorState, Loading, PageHeader, SectionTitle } from '../components/ui.jsx'

export default function Quests() {
  const { data, error, loading, retry } = useApi('/discover')
  const [params, setParams] = useSearchParams()
  const active = params.get('mood') ?? ''
  const quests = useMemo(() => {
    // Map order, so the rail reads 01 to 05 like the hotspots on the home page.
    const order = (quest) => {
      const spot = LANDMARKS.findIndex((landmark) => landmark.id === quest.id)
      return spot < 0 ? LANDMARKS.length : spot
    }
    return (data?.quests ?? [])
      .filter((quest) => !active || quest.category.includes(active))
      .sort((a, b) => order(a) - order(b))
  }, [data, active])
  if (error) return <ErrorState error={error} onRetry={retry} />
  const options = [
    { value: '', label: 'All', count: data?.quests.length },
    ...(data?.categories ?? [])
      .filter((item) => item.questCount)
      .map((item) => ({ value: item.name, label: item.name, count: item.questCount })),
  ]
  const chips = (
    <Chips
      id="quests"
      label="Filter quests by mood"
      options={options}
      value={active}
      onChange={(value) => setParams(value ? { mood: value } : {}, { replace: true })}
    />
  )
  return (
    <>
      <div className="page">
        <PageHeader
          eyebrow="Quests"
          lines={['Every quest,', <em key="day">one good day.</em>]}
          description="Pick one, head out, tick off five things. Your progress is saved on this device."
        />
      </div>
      {loading ? (
        <div className="page-section">
          <Loading label="Loading quests" />
        </div>
      ) : quests.length ? (
        <QuestRail quests={quests}>{chips}</QuestRail>
      ) : (
        <div className="page-section">
          {chips}
          <Empty>No quests for that mood yet.</Empty>
        </div>
      )}
      <div className="page-section">
        <section className="section-tight">
          <SectionTitle eyebrow="Where they start" title="On the map." />
          <MapReveal
            points={quests.map((quest) => ({
              id: quest.id,
              lat: quest.lat,
              lng: quest.lng,
              title: quest.title,
              href: `/quests/${quest.id}`,
            }))}
          />
        </section>
      </div>
    </>
  )
}
