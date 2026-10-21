import { useCallback, useEffect, useState } from 'react'

// VITE_API_URL is the backend origin (no /api). Unset = same-origin /api (Vite dev proxy or Worker binding).
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '')
const BASE = `${API_URL}/api`
const FRESH_FOR = 60_000
const MAX_ENTRIES = 100
// key -> { data, at } for settled responses, { promise } while in flight.
const cache = new Map()

function keyOf(path, params) {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, value]) => value != null && value !== ''),
  )
  query.sort()
  const search = query.toString()
  return `${path}${search ? `?${search}` : ''}`
}

async function request(key, signal) {
  const response = await fetch(`${BASE}${key}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) {
    const error = new Error(`Request failed: ${response.status}`)
    error.status = response.status
    throw error
  }
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw new Error('The API returned an unexpected response.')
  return response.json()
}

// Concurrent callers share one request; it is not tied to any single component.
function load(key) {
  const entry = cache.get(key)
  if (entry?.promise) return entry.promise
  const promise = request(key)
    .then((data) => {
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value)
      cache.set(key, { data, at: Date.now() })
      return data
    })
    .catch((error) => {
      if (cache.get(key)?.promise === promise) cache.delete(key)
      throw error
    })
  cache.set(key, { ...entry, promise })
  return promise
}

export function get(path, params) {
  return load(keyOf(path, params))
}

// Warm the cache before navigation, e.g. when a card is hovered or focused.
export function prefetch(path, params) {
  const key = keyOf(path, params)
  const entry = cache.get(key)
  if (entry?.promise || (entry && Date.now() - entry.at < FRESH_FOR)) return
  load(key).catch(() => {})
}

export function useApi(path, params) {
  const key = keyOf(path, params)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState(() => {
    const entry = cache.get(key)
    return { key, data: entry?.data ?? null, error: null, loading: !entry?.data }
  })
  const retry = useCallback(() => {
    cache.delete(key)
    setAttempt((n) => n + 1)
  }, [key])

  useEffect(() => {
    let active = true
    const entry = cache.get(key)
    // Stale data renders immediately while a fresh copy loads in the background.
    if (entry?.data) {
      setState({ key, data: entry.data, error: null, loading: false })
      if (Date.now() - entry.at < FRESH_FOR) return
    } else setState({ key, data: null, error: null, loading: true })
    load(key).then(
      (data) => active && setState({ key, data, error: null, loading: false }),
      (error) =>
        active &&
        setState((current) =>
          current.data ? current : { key, data: null, error, loading: false },
        ),
    )
    return () => {
      active = false
    }
  }, [key, attempt])

  const current = state.key === key ? state : { data: null, error: null, loading: true }
  return { ...current, retry }
}
