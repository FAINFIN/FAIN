'use client'

/**
 * UserGuard — mounts invisibly inside the app shell.
 *
 * On every load it compares the server-session email with the last
 * email stored in localStorage. If they differ (a different account
 * logged in on the same browser), it wipes IndexedDB before the user
 * can see any stale data, then records the new email.
 *
 * Sign-out also calls clearUserData() directly (see Sidebar.tsx), so
 * the next user starts with a clean slate even without this check.
 */

import { useEffect } from 'react'
import { useUser } from '@/lib/auth/UserContext'
import { clearUserData } from '@/lib/db/schema'

const STORAGE_KEY = 'fain.activeUser'

export function UserGuard() {
  const user = useUser()

  useEffect(() => {
    async function verify() {
      const storedEmail = localStorage.getItem(STORAGE_KEY)

      if (storedEmail && storedEmail !== user.email) {
        // A different account — wipe everything before they see anything
        await clearUserData()
      }

      // Always stamp the current user so the next login can detect a switch
      localStorage.setItem(STORAGE_KEY, user.email)
    }

    verify().catch(console.error)
  }, [user.email])

  return null
}
