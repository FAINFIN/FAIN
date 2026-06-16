import type { Metadata } from 'next'
import { AskClient } from './AskClient'

export const metadata: Metadata = { title: 'Ask Fain' }

export default function AskPage() {
  return <AskClient />
}
