import type { Metadata } from 'next'
import { ForecastingClient } from './ForecastingClient'

export const metadata: Metadata = { title: 'Forecasting' }

export default function ForecastingPage() {
  return <ForecastingClient />
}
