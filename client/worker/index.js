export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      try {
        return await env.API.fetch(request)
      } catch {
        return Response.json(
          { detail: 'The adventure service is temporarily unavailable' },
          { status: 503, headers: { 'cache-control': 'no-store' } },
        )
      }
    }
    return env.ASSETS.fetch(request)
  },
}
