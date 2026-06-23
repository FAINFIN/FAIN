import type { Metadata } from 'next'
import { DecisionEngineClient } from './DecisionEngineClient'

export const metadata: Metadata = { title: 'Decision Engine' }

export default function DecisionEnginePage() {
  return <DecisionEngineClient />
}
