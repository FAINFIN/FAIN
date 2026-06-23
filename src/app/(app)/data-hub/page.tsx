import type { Metadata } from 'next'
import { DataHubClient } from './DataHubClient'

export const metadata: Metadata = { title: 'Financial Data Hub' }

export default function DataHubPage() {
  return <DataHubClient />
}
