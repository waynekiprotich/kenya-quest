import { useSyncExternalStore } from 'react'

const KEY = 'kenya-quest:theme'
const listeners = new Set()

function stored() {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

let choice = stored()

// Night is the default look; "paper" (light) is an explicit choice that persists.
// One shared store, so the nav control, the WebGL stage and the maps stay in step.
export function resolvedTheme() {
  return choice ?? 'dark'
}

function emit() {
  const root = document.documentElement
  if (choice) root.setAttribute('data-theme', choice)
  else root.removeAttribute('data-theme')
  listeners.forEach((listener) => listener())
}

window.addEventListener('storage', (event) => {
  if (event.key !== KEY) return
  choice = stored()
  emit()
})

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setTheme(theme) {
  choice = theme
  try {
    if (theme) localStorage.setItem(KEY, theme)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage is unavailable; the theme still applies for this page session.
  }
  emit()
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, resolvedTheme)
  return {
    theme,
    isDark: theme === 'dark',
    toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  }
}
