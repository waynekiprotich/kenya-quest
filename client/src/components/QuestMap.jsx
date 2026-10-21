import { lazy, Suspense, useEffect, useRef, useState } from 'react'
const LeafletMap = lazy(() => import('./LeafletMap.jsx'))
export default function QuestMap(props) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  const fallback = (
    <div className={`map-placeholder ${props.className ?? ''}`} role="status">
      Unfolding the map…
    </div>
  )
  return (
    <div ref={ref} className="map-host">
      <Suspense fallback={fallback}>{visible ? <LeafletMap {...props} /> : fallback}</Suspense>
    </div>
  )
}
