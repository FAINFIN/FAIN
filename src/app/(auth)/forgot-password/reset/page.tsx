import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = { title: 'Set new password' }

export default function ResetPasswordPage() {
  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-top">
          <Link className="brand" href="/">
            <span className="word">fain<span className="fstop">.</span></span>
          </Link>
        </div>

        <div className="auth-main">
          <h2 className="serif">Set a new <span className="em">password</span>.</h2>
          <p className="lead">Choose something strong — you won't need to remember it often.</p>
          <ResetPasswordForm />
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
          <span className="eyebrow">Secure by design</span>
          <h3 className="serif">Your data stays <span className="em">yours</span>.</h3>
          <div className="side-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            End-to-end encrypted. We never see your password.
          </div>
        </div>
      </div>
    </div>
  )
}
