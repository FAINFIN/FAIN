import type { Metadata } from 'next'
import Link from 'next/link'
import { ConnectBankClient } from './ConnectBankClient'

export const metadata: Metadata = { title: 'Connect your bank' }

export default function ConnectBankPage() {
  return (
    <div className="auth-shell">
      <div className="auth-left" id="left">
        <div className="auth-top">
          <Link className="brand" href="/">
            <span className="word">fain<span className="fstop">.</span></span>
          </Link>
          <span className="alt"><Link href="/register">Back</Link></span>
        </div>

        <div className="auth-main">
          <ConnectBankClient />
        </div>

        <div className="auth-foot">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
          </svg>
          Read-only access · never stores bank logins · disconnect anytime
        </div>
      </div>

      <div className="auth-right" aria-hidden="true">
        <div className="brandside">
          <span className="eyebrow">Connect once</span>
          <h3 className="serif">Read-only, <span className="em">by design</span>.</h3>

          <div className="perm-card">
            <span className="ph">Fain can</span>
            {['View account balances', 'Read 24 months of transactions', 'Read invoices from your books'].map(p => (
              <span key={p} className="perm">
                <span className="pi ok">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
                </span>
                {p}
              </span>
            ))}
          </div>

          <div className="perm-card">
            <span className="ph">Fain can never</span>
            {['Move or send money', 'See your bank password', 'Change anything in your accounts'].map(p => (
              <span key={p} className="perm dim">
                <span className="pi no">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </span>
                {p}
              </span>
            ))}
          </div>

          <div className="side-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/>
            </svg>
            Consent expires after 90 days. Revoke any source in one click.
          </div>
        </div>
      </div>
    </div>
  )
}
