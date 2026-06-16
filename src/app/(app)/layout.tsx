import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/config'
import { Sidebar } from '@/components/app/Sidebar'
import { SampleDataBanner } from '@/components/app/SampleDataBanner'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="app-shell">
      <Sidebar user={{ name: session.user.name, email: session.user.email }} />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
        <SampleDataBanner />
        <main className="app-main">
          <ErrorBoundary name="AppScreen">
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
