import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/config'
import { Sidebar } from '@/components/app/Sidebar'
import { TopBar } from '@/components/app/TopBar'
import { MobileNav } from '@/components/app/MobileNav'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { UserProvider } from '@/lib/auth/UserContext'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const user = {
    name:  session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  }

  return (
    <UserProvider user={user}>
      <div className="app-shell">
        <Sidebar user={user} />
        <div className="app-shell-content">
          <TopBar user={user} />
          <main className="app-main">
            <ErrorBoundary name="AppScreen">
              {children}
            </ErrorBoundary>
          </main>
        </div>
        <MobileNav />
      </div>
    </UserProvider>
  )
}
