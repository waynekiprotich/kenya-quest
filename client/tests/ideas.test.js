import assert from 'node:assert/strict'
import test from 'node:test'
import { BUDGETS, IDEAS_KEY, saveIdea, validateIdea } from '../src/lib/ideas.js'

const valid = {
  name: 'Wanjiru',
  email: 'wanjiru@example.com',
  idea: 'A sunrise walk up Ngong Hills with chai at the top.',
  budget: BUDGETS[1],
}

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value)
    },
    data,
  }
}

test('a complete idea has no errors', () => {
  assert.deepEqual(validateIdea(valid), {})
})

test('each field reports its own problem', () => {
  const errors = validateIdea({ name: ' W ', email: 'not-an-email', idea: 'Too short', budget: '' })
  assert.deepEqual(Object.keys(errors).sort(), ['budget', 'email', 'idea', 'name'])
})

test('ideas over the limit are rejected', () => {
  assert.ok(validateIdea({ ...valid, idea: 'x'.repeat(1300) }).idea)
})

test('saved ideas are trimmed and appended', () => {
  const storage = memoryStorage({ [IDEAS_KEY]: JSON.stringify([{ name: 'Earlier' }]) })
  const saved = saveIdea(
    storage,
    { ...valid, name: '  Wanjiru  ' },
    new Date('2026-09-28T08:00:00Z'),
  )
  assert.equal(saved, true)
  const list = JSON.parse(storage.data[IDEAS_KEY])
  assert.equal(list.length, 2)
  assert.equal(list[1].name, 'Wanjiru')
  assert.equal(list[1].savedAt, '2026-09-28T08:00:00.000Z')
})

test('a damaged list is replaced; blocked storage reports failure', () => {
  const damaged = memoryStorage({ [IDEAS_KEY]: '{oops' })
  assert.equal(saveIdea(damaged, valid), true)
  assert.equal(JSON.parse(damaged.data[IDEAS_KEY]).length, 1)
  const blocked = {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
  assert.equal(saveIdea(blocked, valid), false)
  assert.equal(saveIdea(null, valid), false)
})
