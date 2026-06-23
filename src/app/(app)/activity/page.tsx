import type { Metadata } from 'next'
import { ActivityClient } from './ActivityClient'

export const metadata: Metadata = { title: 'Activity & Feed' }

export default function ActivityPage() {
  return <ActivityClient />
}
