import assert from 'node:assert/strict'
import test from 'node:test'
import { pages, warmRoute } from '../src/lib/routes.js'

test('pages exports loader functions for all core routes', () => {
  const expected = [
    'Home',
    'Quests',
    'QuestDetail',
    'Places',
    'PlaceDetail',
    'Locations',
    'LocationDetail',
    'Categories',
    'CategoryDetail',
    'Search',
    'NotFound',
  ]

  assert.deepEqual(Object.keys(pages).sort(), expected.sort())
  for (const [name, loader] of Object.entries(pages)) {
    assert.equal(typeof loader, 'function', `Loader for ${name} should be a function`)
  }
})

test('warmRoute handles root, index, detail, and unknown paths safely', () => {
  assert.doesNotThrow(() => {
    warmRoute('/')
    warmRoute('/quests')
    warmRoute('/quests/karura')
    warmRoute('/places')
    warmRoute('/places/karen-blixen-museum')
    warmRoute('/locations')
    warmRoute('/locations/karen')
    warmRoute('/categories')
    warmRoute('/categories/Nature')
    warmRoute('/search')
    warmRoute('/unknown-path')
    warmRoute('')
  })
})
