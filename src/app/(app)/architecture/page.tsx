import type { Metadata } from 'next'
import { ArchitectureClient } from './ArchitectureClient'

export const metadata: Metadata = {
  title: 'Architecture · Fain',
}

export default function ArchitecturePage() {
  return <ArchitectureClient />
}
