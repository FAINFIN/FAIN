import type { Metadata } from 'next'
import { InvestorReportingClient } from './InvestorReportingClient'

export const metadata: Metadata = { title: 'Investor Reporting' }

export default function InvestorReportingPage() {
  return <InvestorReportingClient />
}
