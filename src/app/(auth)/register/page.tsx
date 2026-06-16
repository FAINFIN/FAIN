import type { Metadata } from 'next'
import Link from 'next/link'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Create your account' }

export default function RegisterPage() {
  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-top">
          <Link className="brand" href="/">
            <span className="word">fain<span className="fstop">.</span></span>
          </Link>
          <span className="alt">
            Already have an account? <Link href="/login">Log in</Link>
          </span>
        </div>

        <div className="auth-main">
          <div className="steps" aria-label="Onboarding progress">
            <span className="step active"><span className="n">1</span><span className="lbl">Create account</span></span>
            <span className="sline" />
            <span className="step"><span className="n">2</span><span className="lbl">Connect your bank</span></span>
            <span className="sline" />
            <span className="step"><span className="n">3</span><span className="lbl">Ask away</span></span>
          </div>

          <h2 className="serif">First, create your <em>account</em>.</h2>
          <p className="lead">Two minutes from here to your first answer.</p>

          <RegisterForm />
        </div>

        <div className="auth-foot">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
          Read-only access · never stores bank logins · cancel anytime
        </div>
      </div>

      <div className="auth-right" aria-hidden="true">
        <div className="brandside">
          <span className="eyebrow">Why founders join</span>
          <h3 className="serif">Ask the question you'd ask a <span className="em">CFO</span>.</h3>
          <div className="mini-q">How long is my runway?</div>
          <div className="mini-a">
            <span className="mark">f</span>
            <div className="mini-card">
              <span><b>14 months</b> at your current burn of <b>₾61k/mo</b> — you'd reach zero around <b>August 2027</b>.</span>
              <div className="mini-metrics">
                <div className="mini-metric"><span className="k">Runway</span><span className="v">14 mo</span></div>
                <div className="mini-metric"><span className="k">Cash today</span><span className="v">₾854k</span></div>
              </div>
            </div>
          </div>
          <div className="side-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
            Every answer shows the figures behind it.
          </div>
        </div>
      </div>
    </div>
  )
}
