import type { Metadata } from 'next'
import Link from 'next/link'
import { WaitlistForm } from '@/components/landing/WaitlistForm'

export const metadata: Metadata = {
  title: 'Fain — Your AI financial controller',
  description: 'Fain connects to your bank and books, then answers in plain language — cash, burn, runway, a vendor, a what-if. Real answers from your real numbers.',
}

const CONNECTORS = ['Bank of Georgia', 'TBC Bank', 'NBG Open Banking', 'QuickBooks', 'Xero']

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
      </svg>
    ),
    title: 'Read-only by design',
    body:  'Fain connects with view-only access and never stores your banking credentials. It can see balances — never touch them.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    title: 'Bank-grade security',
    body:  'Encrypted in transit and at rest, with audited connections to every institution. The same standards your bank holds itself to.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
      </svg>
    ),
    title: 'You stay in control',
    body:  'Every answer shows the figures behind it, so you can trust the math. Disconnect any source in one click, anytime.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav" id="nav">
        <div className="wrap nav-inner">
          <a className="brand" href="#top">
            <span className="word">fain<span className="fstop">.</span></span>
          </a>
          <div className="nav-links">
            <a className="lnk" href="#answer">How it works</a>
            <a className="lnk" href="#trust">Security</a>
            <a className="lnk" href="#trust">Connections</a>
          </div>
          <div className="nav-cta">
            <Link className="btn btn-ghost btn-sm" href="/login">Log in</Link>
            <Link className="btn btn-primary btn-sm" href="/register">Connect your bank</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="top">
        <div className="wrap">
          <span className="pill rise d1"><span className="spark" /> Your AI financial controller · in private beta</span>
          <h1 className="serif rise d2">What do you want to know about your <span className="em">money</span>?</h1>
          <p className="lead rise d3">
            Fain connects to your bank and books, then answers in plain language —
            cash, burn, runway, a vendor, a what-if. Real answers from your real numbers.
          </p>

          {/* waitlist form in hero */}
          <div className="ask rise d4" style={{ maxWidth: 600, margin: '34px auto 0' }}>
            <WaitlistForm />
          </div>

          {/* starter chips */}
          <div className="starters rise d5">
            {[
              { icon: '⚡', label: 'How long is my runway?' },
              { icon: '🔍', label: 'What did we spend on AWS in Q3?' },
              { icon: '→', label: 'Forecast if I hire 3 engineers' },
              { icon: '✓', label: 'Am I profitable yet?' },
            ].map(q => (
              <Link key={q.label} href="/register" className="chip">{q.label}</Link>
            ))}
          </div>

          {/* trust row */}
          <div className="trust rise d6" id="trustline">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
              </svg>
            </span>
            Read-only · never stores bank logins
            <span className="sep" />
            {['BOG', 'TBC', 'NBG', 'QuickBooks', 'Xero'].map((logo, i) => (
              <span key={logo} className="flex items-center gap-[inherit]">
                <span className="logo">{logo}</span>
                {i < 4 && <span className="sep" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROOF: a real answer ── */}
      <section className="proof" id="answer">
        <div className="wrap-narrow">
          <div className="crule" style={{ marginBottom: 38 }}><i /></div>
          <div className="proof-head">
            <span className="eyebrow">See it think</span>
            <h2 className="serif" style={{ margin: '14px 0 0' }}>
              A real answer, from your <span className="em">real numbers</span>.
            </h2>
            <p className="lead" style={{ margin: '24px auto 0', maxWidth: '48ch' }}>
              No dashboards to hunt through. Ask the question you'd ask a CFO —
              Fain shows the figures behind every answer.
            </p>
          </div>

          <div className="convo">
            <div className="msg-me">How long is my runway if I hire 3 engineers?</div>

            <div className="answer">
              <span className="mark" aria-hidden="true" style={{ marginTop: 2 }}>f</span>
              <div className="body">
                <p className="prose" style={{ margin: 0 }}>
                  With 3 engineers at <b><span className="lari">₾</span>8,500/mo</b> each, your burn rises to{' '}
                  <b><span className="lari">₾</span>86.5k/mo</b>. Runway drops from <b>14 months</b> to{' '}
                  <b className="neg">10 months</b> — you'd reach zero around <b>April 2027</b>.
                </p>

                <div className="metrics">
                  <div className="metric"><span className="k">Runway</span><span className="v neg">10 mo</span><span className="d neg">−4 vs now</span></div>
                  <div className="metric"><span className="k">New burn</span><span className="v"><span className="lari">₾</span>86.5k</span><span className="d">+<span className="lari">₾</span>25.5k/mo</span></div>
                  <div className="metric"><span className="k">Cash at lowest</span><span className="v"><span className="lari">₾</span>41k</span><span className="d">Mar 2027</span></div>
                </div>

                <div className="chartcard">
                  <div className="ch-head">
                    <span className="k" style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-low)' }}>Projected cash balance</span>
                    <div className="legend">
                      <span className="it"><span className="ln" /> now</span>
                      <span className="it"><span className="ln proj" /> with hires</span>
                    </div>
                  </div>
                  <svg viewBox="0 0 640 160" width="100%" height="150" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                    <line x1="12" y1="46" x2="628" y2="46" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 6"/>
                    <line x1="12" y1="80" x2="628" y2="80" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 6"/>
                    <line x1="12" y1="114" x2="628" y2="114" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="2 6"/>
                    <line x1="12" y1="148" x2="628" y2="148" stroke="var(--border-loud)" strokeWidth="1.5"/>
                    <polyline points="12,63.7 166,71.8 320,81.4 474,90.9 628,99" fill="none" stroke="var(--stone-7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="12,63.7 166,80 320,99 474,120.8 628,139.8" fill="none" stroke="var(--neg)" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="628" cy="139.8" r="4.5" fill="var(--surface-primary)" stroke="var(--neg)" strokeWidth="2.5"/>
                    <text x="628" y="127" textAnchor="end" fontFamily="'Geist Mono',monospace" fontSize="11" fontWeight="500" fill="var(--neg)">Apr 27 · zero</text>
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--text-low)' }}>
                    <span>today</span><span>+4mo</span><span>+8mo</span><span>+12mo</span>
                  </div>
                </div>

                <div className="followups">
                  <span className="lbl">Try next:</span>
                  <Link href="/register" className="fu">Hire 2 instead of 3</Link>
                  <Link href="/register" className="fu">Pair with a $2M raise</Link>
                  <Link href="/register" className="fu">Show the math</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONNECTIONS + TRUST ── */}
      <section className="band" id="trust">
        <div className="wrap band-inner">
          <div style={{ textAlign: 'center', maxWidth: '60ch', margin: '0 auto' }}>
            <span className="eyebrow">Connect once</span>
            <h2 className="serif" style={{ margin: '14px 0 0' }}>
              Plugs into the tools you <span className="em">already run on</span>.
            </h2>
            <p className="lead" style={{ margin: '24px auto 0', maxWidth: '46ch' }}>
              Georgian banks and your accounting stack, linked through read-only connections.
              Fain reads your numbers — it can never move your money.
            </p>
          </div>

          <div className="conn-grid">
            {CONNECTORS.map(name => (
              <div key={name} className="conn">
                <span className="dot" />
                <span className="nm">{name}</span>
              </div>
            ))}
          </div>

          <div className="features">
            {FEATURES.map(f => (
              <div key={f.title} className="feat">
                <span className="fi">{f.icon}</span>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="closing">
        <div className="wrap closing-inner">
          <span className="eyebrow" style={{ color: 'var(--stone-7)' }}>For founders</span>
          <h2 className="serif" style={{ margin: '16px auto 0', maxWidth: '18ch' }}>
            Know your money like you <span className="em">finally</span> have a CFO.
          </h2>
          <p className="lead">
            Connect your bank in two minutes and ask your first question.
            No spreadsheets, no setup calls.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary btn-lg" href="/register">Connect your bank</Link>
            <a className="btn btn-dark btn-lg" href="#answer">See a sample answer</a>
          </div>
          <div className="note">Read-only access · ₾ / $ multi-currency · cancel anytime</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="wrap footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span className="word" style={{ fontFamily: 'var(--font-logo)', fontWeight: 700, fontSize: 23, letterSpacing: '-0.03em', color: 'var(--text-inverted)' }}>
              fain<span className="fstop">.</span>
            </span>
            <span className="copy">Financial clarity for founders — Tbilisi & beyond.</span>
          </div>
          <div className="footer-links">
            <a href="#answer">How it works</a>
            <a href="#trust">Security</a>
            <a href="#trust">Connections</a>
            <Link href="/login">Log in</Link>
          </div>
          <div className="copy">© 2026 Fain</div>
        </div>
      </footer>

      {/* scroll-aware nav */}
      <script dangerouslySetInnerHTML={{ __html: `
        var nav = document.querySelector('.nav');
        var fn = function(){ nav && nav.classList.toggle('scrolled', window.scrollY > 12); };
        window.addEventListener('scroll', fn, { passive: true });
        fn();
      `}} />
    </>
  )
}
