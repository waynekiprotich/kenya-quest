import assert from 'node:assert/strict'
import test from 'node:test'
import { CATEGORY_IMAGES, FOREST_PATH, imageSet, imageUrl } from '../src/lib/images.js'

test('imageUrl returns null for falsy sources', () => {
  assert.equal(imageUrl(null), null)
  assert.equal(imageUrl(undefined), null)
  assert.equal(imageUrl(''), null)
})

test('imageUrl returns untouched URLs for non-Unsplash hosts', () => {
  const wikiUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/example.jpg'
  assert.equal(imageUrl(wikiUrl), wikiUrl)
  assert.equal(imageUrl(wikiUrl, 400), wikiUrl)
})

test('imageUrl formats Unsplash URLs with default and custom widths', () => {
  const unsplash = 'https://images.unsplash.com/photo-1504674900247'
  assert.equal(imageUrl(unsplash), `${unsplash}?auto=format&fit=crop&w=800&q=72`)
  assert.equal(imageUrl(unsplash, 1200), `${unsplash}?auto=format&fit=crop&w=1200&q=72`)
  assert.equal(imageUrl(unsplash, 320), `${unsplash}?auto=format&fit=crop&w=320&q=72`)
})

test('imageSet returns undefined for falsy or non-Unsplash inputs', () => {
  assert.equal(imageSet(null), undefined)
  assert.equal(imageSet(''), undefined)
  assert.equal(imageSet('https://example.com/photo.jpg'), undefined)
})

test('imageSet formats responsive srcset descriptors', () => {
  const unsplash = 'https://images.unsplash.com/photo-1504674900247'
  const set = imageSet(unsplash)
  assert.ok(set.includes('240w'))
  assert.ok(set.includes('320w'))
  assert.ok(set.includes('480w'))
  assert.ok(set.includes('800w'))
  assert.ok(set.includes('1200w'))

  const customSet = imageSet(unsplash, [320, 640])
  assert.equal(
    customSet,
    `${unsplash}?auto=format&fit=crop&w=320&q=72 320w, ${unsplash}?auto=format&fit=crop&w=640&q=72 640w`,
  )
})

test('CATEGORY_IMAGES and FOREST_PATH provide valid Unsplash asset paths', () => {
  assert.ok(FOREST_PATH.startsWith('https://images.unsplash.com/photo-'))
  const expectedCategories = [
    'Food',
    'Adventure',
    'Culture',
    'Nature',
    'Nightlife',
    'Date',
    'Family',
    'Budget',
  ]
  for (const cat of expectedCategories) {
    assert.ok(CATEGORY_IMAGES[cat], `Missing image for category ${cat}`)
    assert.ok(CATEGORY_IMAGES[cat].startsWith('https://images.unsplash.com/photo-'))
  }
})
