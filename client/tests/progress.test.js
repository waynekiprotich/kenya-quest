import assert from 'node:assert/strict'
import test from 'node:test'
import {
  countCompletedTasks,
  createProgressStore,
  sanitizeProgress,
} from '../src/lib/progress-store.js'

test('invalid stored data is normalized and repeated task IDs are removed', () => {
  assert.deepEqual(sanitizeProgress({ a: ['one', 'one', 2], b: 'broken' }), { a: ['one'] })
  assert.deepEqual(sanitizeProgress(null), {})
  assert.deepEqual(sanitizeProgress([]), {})
})
test('completion counts only tasks that still belong to the quest', () => {
  assert.equal(countCompletedTasks({ tasks: [{ id: 'new' }] }, ['old', 'old']), 0)
  assert.equal(countCompletedTasks({ tasks: [{ id: 'new' }] }, ['new', 'new']), 1)
})
test('unavailable storage preserves progress across subscriptions', () => {
  const store = createProgressStore({
    getItem() {
      throw Error('denied')
    },
    setItem() {
      throw Error('denied')
    },
  })
  store.toggle('quest', 'task')
  const unsubscribe = store.subscribe(() => {})
  assert.deepEqual(store.getSnapshot(), { quest: ['task'] })
  unsubscribe()
  store.subscribe(() => {})()
  assert.deepEqual(store.getSnapshot(), { quest: ['task'] })
  store.toggle('quest', 'task')
  assert.deepEqual(store.getSnapshot(), { quest: [] })
})
test('writes, resets and cross-tab changes notify subscribers', () => {
  let saved = '{}'
  const target = new EventTarget()
  const store = createProgressStore(
    {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value
      },
    },
    target,
  )
  let changes = 0
  const unsubscribe = store.subscribe(() => changes++)
  store.toggle('quest', 'task')
  assert.equal(changes, 1)
  assert.deepEqual(JSON.parse(saved), { quest: ['task'] })
  saved = '{"quest":["other"]}'
  const event = new Event('storage')
  event.key = 'kenya-quest:progress'
  target.dispatchEvent(event)
  assert.deepEqual(store.getSnapshot(), { quest: ['other'] })
  store.reset('quest')
  assert.deepEqual(store.getSnapshot(), {})
  assert.equal(changes, 3)
  unsubscribe()
})
