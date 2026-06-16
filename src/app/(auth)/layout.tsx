import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Fain', template: '%s · Fain' },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
