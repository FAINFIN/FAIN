import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode
  active?: boolean
}

export function Chip({ icon, active, className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'chip cursor-pointer select-none',
        active && 'border-[var(--tan-9)] bg-[var(--tan-9)] text-white',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1 inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
