import { cn } from '@/lib/utils/cn'
import { Card } from './Card'

interface MetricCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
  className?: string
}

const trendIcon = {
  up:   '↑',
  down: '↓',
  flat: '→',
}

export function MetricCard({ label, value, sub, trend, trendLabel, className }: MetricCardProps) {
  return (
    <Card className={cn('min-w-0', className)}>
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-mono text-2xl font-semibold leading-none text-[var(--text-primary)]">
        {value}
      </p>
      {(trend || sub) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn(
              'font-medium',
              trend === 'up'   && 'pos',
              trend === 'down' && 'neg',
              trend === 'flat' && 'text-[var(--text-low)]'
            )}>
              {trendIcon[trend]} {trendLabel}
            </span>
          )}
          {sub && <span className="text-[var(--text-low)]">{sub}</span>}
        </div>
      )}
    </Card>
  )
}
