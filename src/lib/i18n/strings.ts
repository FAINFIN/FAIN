export type Locale = 'en' | 'ka'

export const STRINGS = {
  en: {
    // Nav
    nav: {
      dashboard:  'Dashboard',
      cashFlow:   'Cash Flow',
      ask:        'Ask Fain',
      settings:   'Settings',
      signOut:    'Sign out',
    },
    // Dashboard
    dash: {
      title:        'Dashboard',
      cashOnHand:   'Cash on hand',
      monthlyBurn:  'Monthly burn',
      monthlyRev:   'Revenue',
      runway:       'Runway',
      noAccounts:   'Connect a bank to get started.',
      noAccountsSub:'Fain needs at least one account to show your dashboard.',
      connectBank:  'Connect your bank',
      incomeVsExp:  'Income vs Expenses',
      netCashFlow:  'Net cash flow',
      topCategories:'Top spending categories',
      months:       (n: number) => `${n} mo`,
    },
    // Cash flow
    cashFlow: {
      title:        'Cash Flow & What-if',
      levers:       'What-if levers',
      reset:        'Reset',
      baseline:     'Baseline',
      scenario:     'Scenario',
      scenarioBurn: 'Scenario burn',
      scenarioRunway: 'Scenario runway',
      netHistory:   'Monthly net cash flow — 12 months',
      projection:   'Projected cash balance — base vs scenario',
      months18:     '18+ mo',
    },
    // Ask
    ask: {
      title:        'Ask Fain',
      placeholder:  'Ask about your finances…',
      chips: [
        'How long is my runway?',
        "What's my biggest expense?",
        'Am I profitable?',
        'What happened last month?',
      ],
    },
    // Auth / onboarding
    auth: {
      createAccount:  'Create your account',
      connectBank:    'Connect your bank',
      continueGoogle: 'Continue with Google',
      orWithEmail:    'or with email',
      fullName:       'Full name',
      workEmail:      'Work email',
      company:        'Company',
      magicLinkHint:  "We'll email you a secure sign-in link — no password to remember.",
      continue:       'Continue',
      termsPrefix:    "By continuing you agree to Fain's ",
      terms:          'Terms',
      and:            ' and ',
      privacy:        'Privacy Policy',
      readOnly:       'Read-only access · never stores bank logins · cancel anytime',
    },
    // Misc
    loading:    'Loading…',
    liveLabel:  'Live',
  },

  ka: {
    nav: {
      dashboard:  'მთავარი',
      cashFlow:   'ფულის ნაკადი',
      ask:        'ჰკითხე Fain-ს',
      settings:   'პარამეტრები',
      signOut:    'გამოსვლა',
    },
    dash: {
      title:        'მთავარი',
      cashOnHand:   'ნაღდი ფული',
      monthlyBurn:  'თვიური ხარჯი',
      monthlyRev:   'შემოსავალი',
      runway:       'ფინ. გამძლეობა',
      noAccounts:   'დასაწყებად დაუკავშირდი ბანკს.',
      noAccountsSub:'Fain-ს სჭირდება მინიმუმ ერთი ანგარიში.',
      connectBank:  'ბანკის დაკავშირება',
      incomeVsExp:  'შემოსავალი vs ხარჯი',
      netCashFlow:  'წმინდა ფულის ნაკადი',
      topCategories:'ხარჯის კატეგორიები',
      months:       (n: number) => `${n} თვე`,
    },
    cashFlow: {
      title:        'ფულის ნაკადი & სცენარები',
      levers:       'What-if სვეტები',
      reset:        'გასუფთავება',
      baseline:     'ბაზისური',
      scenario:     'სცენარი',
      scenarioBurn: 'სცენარის ხარჯი',
      scenarioRunway: 'სცენარის გამძლეობა',
      netHistory:   'თვიური წმინდა ნაკადი — 12 თვე',
      projection:   'ნაღდი ფულის პროგნოზი — ბაზა vs სცენარი',
      months18:     '18+ თვე',
    },
    ask: {
      title:        'ჰკითხე Fain-ს',
      placeholder:  'დასვი შეკითხვა ფინანსებზე…',
      chips: [
        'რამდენ ხანს გავუძლებ?',
        'რა არის ჩემი მთავარი ხარჯი?',
        'მომგებიანი ვარ?',
        'გასულ თვეში რა მოხდა?',
      ],
    },
    auth: {
      createAccount:  'ანგარიშის შექმნა',
      connectBank:    'ბანკის დაკავშირება',
      continueGoogle: 'Google-ით გაგრძელება',
      orWithEmail:    'ან ელ-ფოსტით',
      fullName:       'სახელი და გვარი',
      workEmail:      'სამსახურის ელ-ფოსტა',
      company:        'კომპანია',
      magicLinkHint:  'გამოგიგზავნით შესვლის ბმულს — პაროლი არ გჭირდება.',
      continue:       'გაგრძელება',
      termsPrefix:    'გაგრძელებით ეთანხმები Fain-ის ',
      terms:          'პირობებს',
      and:            ' და ',
      privacy:        'კონფიდენციალობის პოლიტიკას',
      readOnly:       'მხოლოდ წაკითხვის წვდომა · ბანკის პაროლს არ ვინახავთ',
    },
    loading:    'იტვირთება…',
    liveLabel:  'პირდაპირ',
  },
}

export type Strings = typeof STRINGS['en']
