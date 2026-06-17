'use client'

import { createContext, useContext } from 'react'

export interface SessionUser {
  name?: string | null
  email: string
}

const UserContext = createContext<SessionUser>({ email: '' })

export function UserProvider({
  user,
  children,
}: {
  user: SessionUser
  children: React.ReactNode
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): SessionUser {
  return useContext(UserContext)
}
