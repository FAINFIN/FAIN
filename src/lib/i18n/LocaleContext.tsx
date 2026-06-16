'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { STRINGS, type Locale, type Strings } from './strings'

interface LocaleContextValue {
  locale:    Locale
  t:         Strings
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale:    'en',
  t:         STRINGS.en,
  setLocale: () => undefined,
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fain-locale')
      if (stored === 'ka' || stored === 'en') return stored
      // Auto-detect Georgian browser
      if (navigator.language.startsWith('ka')) return 'ka'
    }
    return 'en'
  })

  function setLocale(l: Locale) {
    setLocaleState(l)
    if (typeof window !== 'undefined') localStorage.setItem('fain-locale', l)
  }

  return (
    <LocaleContext.Provider value={{ locale, t: STRINGS[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
