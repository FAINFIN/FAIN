import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Log in' }

// Next.js 16: searchParams is a Promise — must be awaited in async server components.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>
}) {
  const params = await searchParams

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-top">
          <Link className="brand" href="/">
            <span className="word">fain<span className="fstop">.</span></span>
          </Link>
          <span className="alt">No account? <Link href="/register">Get started</Link></span>
        </div>

        <div className="auth-main">
          <h2 className="serif">Welcome <span className="em">back</span>.</h2>
          <p className="lead">Sign in to your Fain account.</p>
          {/* oauthError: better-auth sets ?error= on OAuth failure (access_denied, account_not_linked, …) */}
          {/* from: proxy middleware sets ?from=<path> when redirecting unauthenticated users */}
          <LoginForm oauthError={params.error} from={params.from} />
        </div>

        <div className="auth-foot">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
          </svg>
          Read-only access · never stores bank logins · cancel anytime
        </div>
      </div>

      <div className="auth-right" aria-hidden="true">
        <div className="brandside">
          <span className="eyebrow">Your numbers, instantly</span>
          <h3 className="serif">Everything you need to <span className="em">know</span>, without the spreadsheet.</h3>
          <div className="side-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            No password to remember. Ever.
          </div>
        </div>
      </div>
    </div>
  )
}
