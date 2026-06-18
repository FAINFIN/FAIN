import type { Metadata } from 'next'
import { OnboardingWizard } from './OnboardingWizard'

export const metadata: Metadata = { title: 'Set up your workspace' }

export default function OnboardingPage() {
  return <OnboardingWizard />
}
