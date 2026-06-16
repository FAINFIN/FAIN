'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Brand } from './Brand'

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface NavProps {
  items: NavItem[]
  rightSlot?: React.ReactNode
}

export function Nav({ items, rightSlot }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={cn('nav', scrolled && 'scrolled')}>
      <Brand />
      <div className="flex items-center gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--stone-2)]',
              pathname === item.href && 'text-[var(--text-primary)] bg-[var(--stone-2)]'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </nav>
  )
}
