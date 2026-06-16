import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'ghost' | 'outline' | 'dark'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    const base = 'btn'
    const v: Record<Variant, string> = {
      primary: 'btn-primary',
      ghost:   'btn-ghost',
      outline: 'btn-outline',
      dark:    'btn-dark',
    }
    const s: Record<Size, string> = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
    }
    return (
      <button
        ref={ref}
        className={cn(base, v[variant], s[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)
Button.displayName = 'Button'
