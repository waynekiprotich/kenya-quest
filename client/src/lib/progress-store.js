export const PROGRESS_KEY = 'kenya-quest:progress'

export function sanitizeProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, tasks]) => Array.isArray(tasks))
      .map(([id, tasks]) => [id, [...new Set(tasks.filter((task) => typeof task === 'string'))]]),
  )
}

export function countCompletedTasks(quest, done = []) {
  const ids = new Set(Array.isArray(done) ? done : [])
  return quest.tasks.filter((task) => ids.has(task.id)).length
}

export function createProgressStore(storage, eventTarget) {
  let snapshot = {}
  let available = Boolean(storage)
  const listeners = new Set()
  function read() {
    if (!available) return
    try {
      snapshot = sanitizeProgress(JSON.parse(storage?.getItem(PROGRESS_KEY) ?? '{}'))
    } catch {
      available = false
    }
  }
  read()
  function notify() {
    listeners.forEach((listener) => listener())
  }
  function sync(event) {
    if (event.key !== PROGRESS_KEY && event.key !== null) return
    read()
    notify()
  }
  function write(next) {
    snapshot = sanitizeProgress(next)
    try {
      storage?.setItem(PROGRESS_KEY, JSON.stringify(snapshot))
    } catch {
      available = false
    }
    notify()
  }
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (!listeners.size) {
        eventTarget?.addEventListener('storage', sync)
        read()
      }
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
        if (!listeners.size) eventTarget?.removeEventListener('storage', sync)
      }
    },
    toggle(questId, taskId) {
      const done = snapshot[questId] ?? []
      write({
        ...snapshot,
        [questId]: done.includes(taskId) ? done.filter((id) => id !== taskId) : [...done, taskId],
      })
    },
    reset(questId) {
      const next = { ...snapshot }
      delete next[questId]
      write(next)
    },
  }
}
