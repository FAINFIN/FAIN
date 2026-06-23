'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface MermaidDiagramProps {
  /** Mermaid diagram definition string */
  chart: string
  /** Optional CSS class applied to the wrapper div */
  className?: string
  /** Title shown above the diagram */
  title?: string
}

/**
 * Renders a Mermaid diagram client-side.
 *
 * Usage:
 *   <MermaidDiagram chart={`
 *     flowchart LR
 *       A[Browser] -->|IndexedDB| B[Dexie]
 *       B --> C[Claude]
 *   `} />
 */
export function MermaidDiagram({ chart, className, title }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    if (!chart.trim()) return

    setError(null)
    setRendered(false)

    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            // Pull from Fain CSS custom properties at runtime
            primaryColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-tangerine-500')
              .trim() || '#E8650A',
            primaryTextColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary')
              .trim() || '#1a1a18',
            primaryBorderColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--border-subtle')
              .trim() || '#d4cfc8',
            lineColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--border-subtle')
              .trim() || '#d4cfc8',
            secondaryColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--surface-secondary')
              .trim() || '#f0ece6',
            tertiaryColor: getComputedStyle(document.documentElement)
              .getPropertyValue('--surface-tertiary')
              .trim() || '#e8e2da',
            background: getComputedStyle(document.documentElement)
              .getPropertyValue('--surface-primary')
              .trim() || '#faf8f5',
            fontFamily: '"Mulish", system-ui, sans-serif',
            fontSize: '13px',
          },
          flowchart: { curve: 'basis', useMaxWidth: true },
          sequence: { useMaxWidth: true },
          er: { useMaxWidth: true },
        })

        // Validate syntax first
        await mermaid.parse(chart)

        const { svg } = await mermaid.render(`mermaid-${id}`, chart)

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg

          // Make SVG responsive
          const svgEl = containerRef.current.querySelector('svg')
          if (svgEl) {
            svgEl.removeAttribute('height')
            svgEl.style.width = '100%'
            svgEl.style.maxWidth = '100%'
          }

          setRendered(true)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [chart, id])

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
          {title}
        </p>
      )}

      {error ? (
        <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          <p className="mb-1 font-semibold">Diagram error</p>
          <pre className="whitespace-pre-wrap font-mono text-xs opacity-80">{error}</pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={cn(
            'overflow-x-auto rounded-card border border-[var(--border-subtle)]',
            'bg-[var(--surface-primary)] p-4',
            !rendered && 'min-h-[120px] animate-pulse bg-[var(--surface-secondary)]'
          )}
          aria-label={title ?? 'Diagram'}
        />
      )}
    </div>
  )
}
