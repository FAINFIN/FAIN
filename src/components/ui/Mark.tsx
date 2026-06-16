import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface MarkProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg'
}

export function Mark({ size = 'md', className, ...props }: MarkProps) {
  return (
    <span
      className={cn(
        'mark',
        size === 'sm' && 'h-7 w-7 text-xs',
        size === 'lg' && 'h-10 w-10 text-base',
        className
      )}
      aria-hidden="true"
      {...props}
    >
      f
    </span>
  )
}
