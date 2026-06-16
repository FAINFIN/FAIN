import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  lift?: boolean
}

export function Card({ padded = true, lift, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border-subtle bg-[var(--surface-primary)]',
        'shadow-card',
        padded && 'p-5',
        lift && 'shadow-lift transition-shadow hover:shadow-lift',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-[var(--text-primary)]', className)} {...props}>
      {children}
    </h3>
  )
}
