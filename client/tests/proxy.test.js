import assert from 'node:assert/strict'
import test from 'node:test'
import worker from '../worker/index.js'

test('API paths reach the API service, preserving query and status', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/search?q=forest'), {
    API: {
      fetch: (request) => {
        assert.equal(new URL(request.url).search, '?q=forest')
        return Response.json({ query: 'forest' }, { status: 200 })
      },
    },
    ASSETS: {
      fetch: () => {
        throw Error('API must not fall through to the SPA')
      },
    },
  })
  assert.deepEqual(await response.json(), { query: 'forest' })
})
test('SPA routes reach assets and upstream failures return JSON', async () => {
  const response = await worker.fetch(new Request('https://example.com/quests/forest'), {
    ASSETS: { fetch: () => new Response('app') },
  })
  assert.equal(await response.text(), 'app')
  const failed = await worker.fetch(new Request('https://example.com/api/quests'), {
    API: {
      fetch() {
        throw Error('offline')
      },
    },
  })
  assert.equal(failed.status, 503)
  assert.match(failed.headers.get('content-type'), /json/)
})
