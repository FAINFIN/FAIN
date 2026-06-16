import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'
import { Card, CardHeader, CardTitle } from './Card'

interface ChartCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  action?: React.ReactNode
  height?: number
}

export function ChartCard({ title, action, height = 220, className, children, ...props }: ChartCardProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </Card>
  )
}
