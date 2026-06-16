import type { Metadata } from 'next'
import { CashFlowClient } from './CashFlowClient'

export const metadata: Metadata = { title: 'Cash Flow' }

export default function CashFlowPage() {
  return <CashFlowClient />
}
