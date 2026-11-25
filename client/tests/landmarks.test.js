import assert from 'node:assert/strict'
import test from 'node:test'
import { KINDS, LANDMARKS, questsInOrder } from '../src/lib/landmarks.js'

test('LANDMARKS defines 5 Nairobi hotspot landmarks with unique IDs', () => {
  assert.equal(LANDMARKS.length, 5)
  const ids = new Set(LANDMARKS.map((item) => item.id))
  assert.equal(ids.size, 5)
  for (const landmark of LANDMARKS) {
    assert.ok(landmark.id)
    assert.ok(landmark.kind)
    assert.ok(landmark.name)
    assert.ok(landmark.title)
    assert.ok(landmark.area)
    assert.ok(landmark.mood)
    assert.ok(landmark.line)
    assert.ok(landmark.detail)
  }
})

test('KINDS reflects unique particle geometry identifiers', () => {
  assert.deepEqual(KINDS, ['kicc', 'museum', 'forest', 'westlands', 'karen'])
  assert.equal(new Set(KINDS).size, 5)
})

test('questsInOrder uses fallback copy when live quest list is missing', () => {
  const merged = questsInOrder(null)
  assert.equal(merged.length, 5)
  assert.equal(merged[0].id, 'kicc-city-quest')
  assert.equal(merged[0].title, 'KICC City Quest')
  assert.equal(merged[0].description, LANDMARKS[0].detail)
  assert.deepEqual(merged[0].categories, ['Culture'])
  assert.equal(merged[0].area, 'Nairobi CBD')
})

test('questsInOrder merges live API records over static landmark fallbacks', () => {
  const liveApiData = [
    {
      id: 'karura-nature-quest',
      title: 'Karura Forest Canopy Walk',
      description: 'Custom description from API',
      category: ['Nature', 'Adventure'],
      locationName: 'Gigiri / Limuru Rd',
    },
  ]

  const merged = questsInOrder(liveApiData)
  const karura = merged.find((item) => item.id === 'karura-nature-quest')
  assert.ok(karura)
  assert.equal(karura.title, 'Karura Forest Canopy Walk')
  assert.equal(karura.description, 'Custom description from API')
  assert.deepEqual(karura.categories, ['Nature', 'Adventure'])
  assert.equal(karura.area, 'Gigiri / Limuru Rd')

  // Non-matching landmarks keep their defaults
  const kicc = merged.find((item) => item.id === 'kicc-city-quest')
  assert.equal(kicc.title, 'KICC City Quest')
})
