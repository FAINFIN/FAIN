// Simple sliding-window rate limiter using Upstash Redis.
// Returns { success: true } or { success: false, retryAfter: number }.

export async function rateLimit(identifier: string, limit = 20, windowSeconds = 60) {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return { success: true } // skip in local dev

  const key = `rl:${identifier}`
  const now  = Math.floor(Date.now() / 1000)

  // MULTI-EXEC pipeline: INCR + EXPIRE
  const res = await fetch(`${url}/pipeline`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds],
    ]),
  })

  const [[{ result: count }]] = await res.json() as any
  return count <= limit
    ? { success: true }
    : { success: false, retryAfter: windowSeconds }
}
