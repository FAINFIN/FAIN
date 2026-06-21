'use client'

import type { ReactNode } from 'react'

// ─── Block types ─────────────────────────────────────────────────────────────
type Block =
  | { type: 'prose';     text: string }
  | { type: 'metrics';   rows: MetricRow[] }
  | { type: 'opts';      items: OptItem[] }
  | { type: 'hbars';     rows: HbarRow[] }
  | { type: 'verdict';   text: string }
  | { type: 'followups'; items: string[] }

interface MetricRow { label: string; value: string; detail: string }
interface OptItem   { rec: boolean; title: string; metric: string; note: string }
interface HbarRow   { label: string; amount: string; pct: string; pctNum: number }

// ─── Parser ──────────────────────────────────────────────────────────────────
// Handles :::type\n...\n::: blocks. Closing ::: is optional (tolerates EOF).
function parseBlocks(content: string): Block[] {
  const blocks: Block[] = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!.trim()

    // Opening marker: :::prose, :::metrics, etc.
    if (/^:::[a-z]+$/.test(line)) {
      const blockType = line.slice(3)
      const bodyLines: string[] = []
      i++

      // Collect until closing ::: or EOF
      while (i < lines.length && lines[i]!.trim() !== ':::') {
        bodyLines.push(lines[i]!)
        i++
      }
      i++ // skip closing :::

      const body = bodyLines.join('\n').trim()
      if (!body) continue

      switch (blockType) {
        case 'prose':
          blocks.push({ type: 'prose', text: body })
          break

        case 'metrics': {
          const rows = body.split('\n')
            .map(l => l.trim()).filter(Boolean)
            .map(l => {
              const [label = '', value = '', detail = ''] = l.split('|').map(p => p.trim())
              return { label, value, detail }
            })
          if (rows.length) blocks.push({ type: 'metrics', rows })
          break
        }

        case 'opts': {
          const items = body.split('\n')
            .map(l => l.trim()).filter(Boolean)
            .map(l => {
              const rec = l.startsWith('[REC]')
              const clean = rec ? l.replace('[REC]', '').trim() : l
              const [title = '', metric = '', note = ''] = clean.split('|').map(p => p.trim())
              return { rec, title, metric, note }
            })
          if (items.length) blocks.push({ type: 'opts', items })
          break
        }

        case 'hbars': {
          const rows = body.split('\n')
            .map(l => l.trim()).filter(Boolean)
            .map(l => {
              const [label = '', amount = '', pct = '0%'] = l.split('|').map(p => p.trim())
              return { label, amount, pct, pctNum: parseFloat(pct) || 0 }
            })
          if (rows.length) blocks.push({ type: 'hbars', rows })
          break
        }

        case 'verdict':
          blocks.push({ type: 'verdict', text: body })
          break

        case 'followups': {
          // Either pipe-separated on one line or one per line
          const raw = body.replace(/\n/g, '|')
          const items = raw.split('|').map(s => s.trim()).filter(Boolean)
          if (items.length) blocks.push({ type: 'followups', items })
          break
        }
      }
    } else {
      i++
    }
  }

  // Fallback: if nothing parsed, treat entire content as prose
  if (blocks.length === 0 && content.trim()) {
    blocks.push({ type: 'prose', text: content.trim() })
  }

  return blocks
}

// ─── Inline bold renderer ─────────────────────────────────────────────────────
function Bold({ text }: { text: string }): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

// ─── Block components ─────────────────────────────────────────────────────────

function ProseBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).map(p => p.replace(/\n/g, ' ')).filter(Boolean)
  return (
    <div className="ans-prose">
      {paragraphs.map((p, i) => (
        <p key={i}><Bold text={p} /></p>
      ))}
    </div>
  )
}

function MetricsBlock({ rows }: { rows: MetricRow[] }) {
  const count = Math.min(rows.length, 4)
  return (
    <div className="ans-metrics" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {rows.map((r, i) => (
        <div key={i} className="ans-metric ans-dcard">
          <span className="ans-metric-k">{r.label}</span>
          <span className="ans-metric-v">{r.value}</span>
          {r.detail && <span className="ans-metric-d">{r.detail}</span>}
        </div>
      ))}
    </div>
  )
}

function OptsBlock({ items, onSelect }: { items: OptItem[]; onSelect?: (t: string) => void }) {
  return (
    <div className="ans-opts">
      {items.map((item, i) => (
        <div
          key={i}
          className={`ans-opt${item.rec ? ' ans-opt--rec' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(item.title)}
          onKeyDown={e => e.key === 'Enter' && onSelect?.(item.title)}
        >
          <span className="ans-opt-rank">{i + 1}</span>
          <div className="ans-opt-body">
            <span className="ans-opt-title">{item.title}</span>
            {item.note && <span className="ans-opt-note">{item.note}</span>}
          </div>
          {item.metric && <span className="ans-opt-metric">{item.metric}</span>}
        </div>
      ))}
    </div>
  )
}

function HbarsBlock({ rows }: { rows: HbarRow[] }) {
  const max = Math.max(...rows.map(r => r.pctNum), 1)
  return (
    <div className="ans-hbars">
      {rows.map((r, i) => (
        <div key={i} className="ans-hbar">
          <span className="ans-hbar-label">{r.label}</span>
          <div className="ans-hbar-track">
            <div
              className="ans-hbar-fill"
              style={{ width: `${(r.pctNum / max) * 100}%` }}
            />
          </div>
          <span className="ans-hbar-amount">{r.amount}</span>
        </div>
      ))}
    </div>
  )
}

function VerdictBlock({ text }: { text: string }) {
  return (
    <div className="ans-verdict">
      {/* Lightning bolt icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ans-verdict-icon" aria-hidden="true">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      <p><Bold text={text} /></p>
    </div>
  )
}

function FollowupsBlock({ items, onSelect }: { items: string[]; onSelect?: (q: string) => void }) {
  return (
    <div className="ans-followups">
      {items.slice(0, 4).map((q, i) => (
        <button key={i} className="ans-fu" onClick={() => onSelect?.(q)}>
          {q}
        </button>
      ))}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface FainResponseProps {
  content:     string
  onFollowUp?: (q: string) => void
  timestamp?:  Date
}

export function FainResponse({ content, onFollowUp, timestamp }: FainResponseProps) {
  const blocks = parseBlocks(content)

  const time = (timestamp ?? new Date()).toLocaleTimeString('en-GB', {
    hour:   '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="ans-card">
      {/* ── Header ── */}
      <div className="ans-head">
        <span className="ans-head-mark">fain.</span>
        <span className="ans-head-badge">
          <span className="ans-head-dot" aria-hidden="true" />
          category totals only
        </span>
        <time className="ans-head-time" dateTime={timestamp?.toISOString()}>{time}</time>
      </div>

      {/* ── Body ── */}
      <div className="ans-body">
        {blocks.map((block, i) => {
          switch (block.type) {
            case 'prose':     return <ProseBlock     key={i} text={block.text} />
            case 'metrics':   return <MetricsBlock   key={i} rows={block.rows} />
            case 'opts':      return <OptsBlock      key={i} items={block.items} onSelect={onFollowUp} />
            case 'hbars':     return <HbarsBlock     key={i} rows={block.rows} />
            case 'verdict':   return <VerdictBlock   key={i} text={block.text} />
            case 'followups': return <FollowupsBlock key={i} items={block.items} onSelect={onFollowUp} />
          }
        })}
      </div>
    </div>
  )
}
