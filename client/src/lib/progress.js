import { useSyncExternalStore } from 'react'
import { createProgressStore } from './progress-store.js'
export { countCompletedTasks } from './progress-store.js'

let storage
try {
  storage = window.localStorage
} catch {
  /* Use the session fallback. */
}
const store = createProgressStore(storage, window)
const EMPTY = []

export function useAllProgress() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
export function useQuestProgress(questId) {
  const all = useAllProgress()
  return {
    done: all[questId] ?? EMPTY,
    toggle: (taskId) => store.toggle(questId, taskId),
    reset: () => store.reset(questId),
  }
}
