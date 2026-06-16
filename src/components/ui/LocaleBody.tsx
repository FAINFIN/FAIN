'use client'

import { useEffect } from 'react'
import { useLocale } from '@/lib/i18n/LocaleContext'

/**
 * Sets data-locale and lang attributes on <body> whenever the locale changes.
 * Mount this once inside the root layout, inside LocaleProvider.
 */
export function LocaleBody() {
  const { locale } = useLocale()

  useEffect(() => {
    document.body.setAttribute('data-locale', locale)
    document.documentElement.setAttribute('lang', locale)
  }, [locale])

  return null
}
