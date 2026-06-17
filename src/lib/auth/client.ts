import { createAuthClient } from 'better-auth/react'
import { magicLinkClient } from 'better-auth/client/plugins'
import { twoFactorClient } from 'better-auth/client/plugins'
import { phoneNumberClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [
    magicLinkClient(),
    twoFactorClient(),
    phoneNumberClient(),
  ],
})
