import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'

const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

function pinIcon(active) {
  return L.divIcon({
    className: 'map-pin-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span class="map-pin${active ? ' is-active' : ''}"><i></i></span>`,
  })
}

export default function QuestMap({
  points = [],
  center = [-1.2864, 36.8172],
  zoom = 12,
  className = '',
  activeId = null,
}) {
  const container = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const navigate = useNavigate()
  const pointKey = JSON.stringify(points)

  useEffect(() => {
    if (map.current || !container.current) return
    map.current = L.map(container.current, {
      center,
      zoom,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
      inertia: false,
    })
    L.control.zoom({ position: 'bottomright' }).addTo(map.current)
    L.tileLayer(TILES, {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current)
    layer.current = L.layerGroup().addTo(map.current)

    const observer = new ResizeObserver(() => map.current?.invalidateSize())
    observer.observe(container.current)

    return () => {
      observer.disconnect()
      map.current?.remove()
      map.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!map.current || !layer.current) return
    layer.current.clearLayers()
    const valid = JSON.parse(pointKey).filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number',
    )

    valid.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: pinIcon(point.id === activeId),
        title: point.title,
      })
      const label = document.createElement('span')
      label.textContent = point.title
      marker.bindTooltip(label, {
        direction: 'top',
        offset: [0, -16],
        opacity: 1,
        className: 'map-tooltip',
      })
      if (point.href) marker.on('click', () => navigate(point.href))
      marker.addTo(layer.current)
    })

    if (valid.length > 1) {
      map.current.fitBounds(L.latLngBounds(valid.map((p) => [p.lat, p.lng])).pad(0.25), {
        animate: false,
      })
    } else if (valid.length === 1) {
      map.current.setView([valid[0].lat, valid[0].lng], 14, { animate: false })
    }

    const frame = requestAnimationFrame(() => map.current?.invalidateSize())
    return () => cancelAnimationFrame(frame)
  }, [pointKey, activeId, navigate])

  return <div ref={container} className={className} role="application" aria-label="Map" />
}
