import { auth } from '@/lib/auth/config'
import { toNextJsHandler } from 'better-auth/next-js'

export const dynamic = "force-dynamic"

const handlers = toNextJsHandler(auth)

export async function GET(req: Request) {
  const url = new URL(req.url)
  const isCallback = url.pathname.includes('/callback/')

  if (isCallback) {
    const params = Object.fromEntries(url.searchParams)
    console.log('[auth-debug] CALLBACK RECEIVED', JSON.stringify({
      path: url.pathname,
      code: params.code ? params.code.slice(0, 12) + '...' : 'MISSING',
      state: params.state ? params.state.slice(0, 12) + '...' : 'MISSING',
      error: params.error ?? null,
      cookies: req.headers.get('cookie')
        ? req.headers.get('cookie')!.replace(/=[^;]*/g, '=...')
        : 'NO COOKIES SENT',
    }))
  }

  try {
    const res = await handlers.GET(req)
    if (isCallback) {
      console.log('[auth-debug] CALLBACK RESPONSE', JSON.stringify({
        status: res.status,
        location: res.headers.get('location'),
      }))
    }
    return res
  } catch (err) {
    console.error('[auth-debug] CALLBACK THREW', String(err))
    throw err
  }
}

export async function POST(req: Request) {
  return handlers.POST(req)
}
