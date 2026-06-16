import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface BrandProps {
  href?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Brand({ href = '/', className, size = 'md' }: BrandProps) {
  const sizeClass = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[size]

  const inner = (
    <span className={cn('brand', sizeClass, className)}>
      <span className="word">
        fain<span className="fstop">.</span>
      </span>
    </span>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}
