'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export function WaitlistForm({ className }: { className?: string }) {
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className={cn('rounded-panel border border-border-subtle bg-[var(--surface-primary)] p-6 text-center shadow-lift', className)}>
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--pos)] text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10"/></svg>
        </div>
        <p className="font-semibold text-[var(--text-primary)]">You're on the list.</p>
        <p className="mt-1 text-sm text-[var(--text-mid)]">We'll be in touch soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="input flex-1"
        aria-label="Email address"
      />
      <Button type="submit" loading={status === 'loading'} size="lg">
        Get early access
      </Button>
      {status === 'error' && (
        <p className="absolute mt-12 text-sm text-[var(--neg)]">Something went wrong — try again.</p>
      )}
    </form>
  )
}
