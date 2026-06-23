# Fain — Auth Test Scenarios
**Stack:** better-auth v1.6.19 · Next.js App Router · Neon/Drizzle · Google OAuth · Microsoft OAuth · Magic Link · TOTP 2FA  
**Last updated:** 2026-06-21  
**Scope:** `/login`, `/register`, `/forgot-password`, `/onboarding`, all `/api/auth/*` endpoints, proxy middleware, post-auth routing

---

## Test environment notes

| Item | Value |
|---|---|
| Production URL | https://fain.ge |
| Auth base | https://fain.ge/api/auth |
| Google callback URI | https://fain.ge/api/auth/callback/google |
| Microsoft callback URI | https://fain.ge/api/auth/callback/microsoft |
| Onboarding gate | `userProfiles.onboardingCompletedAt IS NOT NULL` |
| Session cookie | `better-auth.session_token` (httpOnly, Secure, SameSite=Lax) |
| PKCE | S256 code challenge, stored in `better-auth.pkce_*` cookie |

---

## Status legend
`✅ PASS` `❌ FAIL` `⚠ PARTIAL` `🔲 NOT TESTED`

---

## 1. Registration — Email + Password

### TC-REG-01: New user — happy path
**Preconditions:** Email does not exist in DB.  
**Steps:**
1. Navigate to `/register`
2. Enter a valid email and password ≥ 8 characters
3. Submit the form

**Expected result:**
- Account created with `emailVerified = false`
- Verification email sent via Resend to the provided address
- UI shows "check your email" confirmation state
- User is NOT signed in yet; attempting `/ask` redirects to `/login`

**Watch for:**
- Resend delivery to spam
- Verification link expiry = 1 hour

**Status:** 🔲

---

### TC-REG-02: Duplicate email — email/password already registered
**Preconditions:** Email exists with email/password account.  
**Steps:**
1. Navigate to `/register`
2. Enter the same email as an existing account
3. Submit

**Expected result:**
- Server returns 422 / "User already exists" (or similar)
- UI displays inline error — does NOT redirect or send another email
- No duplicate account created in DB

**Status:** 🔲

---

### TC-REG-03: Duplicate email — previously registered via Google OAuth
**Preconditions:** Email exists as an OAuth-only account (no password).  
**Steps:**
1. Navigate to `/register`
2. Enter the email linked to the Google account
3. Submit with a password

**Expected result:**
- Registration blocked with clear error
- UI does NOT create a second account
- No duplicate user row in DB

**Watch for:** better-auth may allow creating a credential account alongside an OAuth account — verify the DB for the `account` table row count.

**Status:** 🔲

---

### TC-REG-04: Invalid email format
**Steps:**
1. Navigate to `/register`
2. Enter `notanemail`, `user@`, `@domain.com`
3. Submit

**Expected result:**
- HTML5 email validation fires client-side before submission
- Server also rejects with 422 if client-side is bypassed
- No network request made for purely malformed input

**Status:** 🔲

---

### TC-REG-05: Weak password
**Steps:**
1. Navigate to `/register`
2. Enter a valid email + password `abc` (too short)
3. Submit

**Expected result:**
- Client or server rejects with "password too short" message
- Minimum length enforced (verify what better-auth requires — typically 8 chars)

**Status:** 🔲

---

### TC-REG-06: Email verification link — valid click
**Preconditions:** TC-REG-01 completed; verification email received.  
**Steps:**
1. Open verification email
2. Click the "Verify email" link (expires in 1 h)

**Expected result:**
- `emailVerified = true` set in DB
- `autoSignInAfterVerification: true` → user is immediately signed in
- Proxy checks `onboardingCompletedAt` — not set → redirect to `/onboarding`
- Onboarding wizard displayed (4 steps: role, company size, goal, workspace name)

**Status:** 🔲

---

### TC-REG-07: Email verification link — expired (> 1 hour)
**Preconditions:** Verification link older than 1 hour.  
**Steps:**
1. Click the expired link

**Expected result:**
- better-auth rejects with `token_expired` or similar error
- UI shows "link expired" message with option to resend
- User still unverified; cannot access app routes

**Status:** 🔲

---

### TC-REG-08: Email verification link — used twice
**Steps:**
1. Click the valid verification link
2. Copy the same URL and open it again

**Expected result:**
- Second click returns an error (token already consumed)
- User remains verified — no regression to unverified state
- No crash or 500

**Status:** 🔲

---

### TC-REG-09: Unverified user attempts to sign in
**Preconditions:** Account created (TC-REG-01) but email NOT verified.  
**Steps:**
1. Go to `/login`
2. Enter the email/password of the unverified account
3. Submit

**Expected result:**
- Login blocked with "Please verify your email" message
- Option to resend verification email offered
- No session created; `/ask` still redirects to `/login`

**Watch for:** `requireEmailVerification: true` in config — this must hold.

**Status:** 🔲

---

### TC-REG-10: Authenticated user visits /register
**Preconditions:** Valid session exists.  
**Steps:**
1. With active session, navigate to `/register`

**Expected result:**
- Proxy intercepts at middleware level
- Redirect to `/ask` (if onboarding complete) or `/onboarding` (if not)
- Register page never rendered

**Status:** 🔲

---

## 2. Registration — Google OAuth

### TC-REG-G01: Brand-new user — Google sign-in (no prior account)
**Preconditions:** Google email does NOT exist in Fain's DB.  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Authenticate with Google (account picker if multiple)
4. Google redirects to `/api/auth/callback/google`

**Expected result:**
- better-auth creates a new `user` row (email, name from Google)
- `emailVerified = true` (Google verifies its own emails)
- Creates an `account` row with `providerId = 'google'`
- Session cookie set; user redirected to `/onboarding` (no profile yet)
- Onboarding wizard shown (4 steps)

**Watch for:**
- Verify PKCE cookies are sent to the callback (domain must be `fain.ge`, not `www.fain.ge`)
- State parameter preserved through Google redirect

**Status:** 🔲

---

### TC-REG-G02: Google sign-in — existing email/password account, email verified
**Preconditions:** User registered with email/password AND verified their email (`emailVerified = true`).  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google" with the same email

**Expected result:**
- `account.accountLinking.trustedProviders` includes `'google'`
- `requireLocalEmailVerified: false` (in config) so linking proceeds
- New `account` row added with `providerId = 'google'` linked to existing user
- Existing user's data preserved; NO duplicate user row
- Session created; redirect chain: callback → proxy checks onboarding → `/ask` (if done) or `/onboarding`

**Critical DB check:** `SELECT * FROM account WHERE userId = '<id>'` — should show 2 rows (credential + google)

**Status:** 🔲

---

### TC-REG-G03: Google sign-in — existing email/password account, email NOT verified
**Preconditions:** User registered with email/password but NEVER clicked the verification link.  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google" with the same email

**Expected result:**
- `requireLocalEmailVerified: false` in config allows linking despite unverified local account
- Google account linked to existing user
- Google's `emailVerified = true` upgrades the user's `emailVerified` flag in DB
- Session created; redirect to onboarding or /ask

**This was the root bug we fixed. Verify it now works.**

**Status:** 🔲

---

### TC-REG-G04: Google sign-in — user cancels Google consent screen
**Steps:**
1. Click "Continue with Google"
2. On the Google consent screen, click "Cancel" / close the popup

**Expected result:**
- Google redirects back with `error=access_denied`
- better-auth redirects to `/?error=...` or `/login?error=...`
- User sees friendly error (not a raw query param dump)
- No partial account created in DB

**Status:** 🔲

---

### TC-REG-G05: Google sign-in — www.fain.ge vs fain.ge
**Preconditions:** User navigates to `https://www.fain.ge/login`.  
**Steps:**
1. Navigate to `https://www.fain.ge/login`
2. Click "Continue with Google"

**Expected result:**
- Vercel 301 redirects `www.fain.ge` → `fain.ge` before any OAuth flow begins
- PKCE cookies set on `fain.ge` domain
- OAuth flow completes without `invalid_code` / cookie-domain mismatch

**This is the www-redirect fix in `vercel.json`. Must pass.**

**Status:** 🔲

---

## 3. Registration — Microsoft OAuth

### TC-REG-M01: Brand-new user — Microsoft sign-in
**Preconditions:** Microsoft email does NOT exist in Fain's DB.  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Microsoft"
3. Authenticate (personal or M365 account — tenantId = 'common')

**Expected result:**
- New user created; `providerId = 'microsoft'`
- Session created; redirect to `/onboarding`

**Watch for:** Personal Microsoft accounts (`@outlook.com`, `@hotmail.com`) must work as well as M365 accounts.

**Status:** 🔲

---

### TC-REG-M02: Microsoft sign-in — existing email account
**Preconditions:** Same email already registered with email/password.  
**Steps:** Same as TC-REG-G02 but using Microsoft.

**Expected result:** Same linking behavior — `microsoft` is in `trustedProviders`.

**Status:** 🔲

---

## 4. Login — Email + Password

### TC-LOG-EP01: Happy path — verified account, onboarding complete
**Preconditions:** Account exists, `emailVerified = true`, `onboardingCompletedAt IS NOT NULL`.  
**Steps:**
1. Navigate to `/login`
2. Enter correct email and password
3. Submit

**Expected result:**
- Session cookie set (`better-auth.session_token`)
- `router.push('/ask')` called by client
- `/ask` loads successfully — no redirect to `/onboarding`

**Status:** 🔲

---

### TC-LOG-EP02: Happy path — onboarding NOT complete
**Preconditions:** Account exists, `emailVerified = true`, `onboardingCompletedAt IS NULL`.  
**Steps:**
1. Login with correct credentials

**Expected result:**
- Session created
- Client calls `router.push('/ask')`
- Proxy intercepts `/ask`, calls `/api/onboarding` GET
- `onboardingCompletedAt` is null → redirects to `/onboarding`
- Onboarding wizard shown

**Status:** 🔲

---

### TC-LOG-EP03: Wrong password
**Steps:**
1. Navigate to `/login`
2. Enter correct email, wrong password

**Expected result:**
- `authClient.signIn.email` returns `error`
- UI shows `a.errCredentials` inline (no page redirect)
- No session created
- Error message must NOT reveal whether the email exists (avoid user enumeration)

**Status:** 🔲

---

### TC-LOG-EP04: Non-existent email
**Steps:**
1. Navigate to `/login`
2. Enter an email that has no account

**Expected result:**
- Same error message as wrong password (identical phrasing to prevent user enumeration)
- No session created

**Watch for:** Error messages like "email not found" are a security issue. Must show a generic credential error.

**Status:** 🔲

---

### TC-LOG-EP05: Remembered user — "Welcome back" flow
**Preconditions:** `fain_last_email` is set in `localStorage` from a previous login.  
**Steps:**
1. Navigate to `/login`

**Expected result:**
- `StepWelcomeBack` component shown with avatar initials and remembered email
- User sees their email displayed; only password field shown
- "Use another account" link visible → clears `localStorage` and shows full sign-in form
- "Forgot password" link present

**Status:** 🔲

---

### TC-LOG-EP06: Remembered user — cleared localStorage
**Preconditions:** `localStorage.removeItem('fain_last_email')` or private/incognito window.  
**Steps:**
1. Navigate to `/login`

**Expected result:**
- Full `StepSignIn` form shown (email + password fields + social buttons)
- No "welcome back" state

**Status:** 🔲

---

### TC-LOG-EP07: Authenticated user visits /login
**Preconditions:** Valid session exists.  
**Steps:**
1. With active session, navigate to `/login`

**Expected result:**
- Proxy middleware redirects to `/ask` (onboarding done) or `/onboarding` (not done)
- Login form never rendered

**Status:** 🔲

---

### TC-LOG-EP08: Authenticated user visits / (landing page)
**Preconditions:** Valid session, onboarding complete.  
**Steps:**
1. With active session, navigate to `https://fain.ge/`

**Expected result:**
- Proxy intercepts (`/` is in `AUTH_ROUTES`)
- Redirect to `/ask`
- Landing page never rendered

**Status:** 🔲

---

## 5. Login — Google OAuth (returning user)

### TC-LOG-G01: Returning Google user — has session cookie from before
**Preconditions:** User previously signed in with Google; session cookie still valid.  
**Steps:**
1. Navigate to `/login`

**Expected result:**
- Proxy intercepts → redirect to `/ask` or `/onboarding`
- No need to re-authenticate with Google

**Status:** 🔲

---

### TC-LOG-G02: Returning Google user — session expired, re-authenticates
**Preconditions:** Session cookie expired/cleared. Google account is linked in DB.  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Google may skip consent (already authorized) and redirect immediately

**Expected result:**
- New session created
- Redirect to `/ask` (onboarding already complete)
- `prompt=none` may be used by Google (silent re-auth) — verify no blank screen

**Status:** 🔲

---

### TC-LOG-G03: Google — different account selected at account picker
**Preconditions:** User has 2 Google accounts in browser. Fain account is linked to account A.  
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. Select account B (NOT the linked one) at Google's account picker

**Expected result:**
- If account B email does NOT exist in Fain → new Fain account created → onboarding
- If account B email exists but is linked to a different Google account → that user is signed in
- No cross-account merge or data leak

**Status:** 🔲

---

## 6. Login — Two-Factor Authentication (TOTP)

### TC-2FA-01: Login with 2FA enabled — correct TOTP code
**Preconditions:** User has TOTP 2FA enabled (via Settings).  
**Steps:**
1. Navigate to `/login`
2. Enter correct email + password
3. Submit → `StepTwoFactor` component shown (`method = '2fa'`)
4. Open authenticator app, enter 6-digit code
5. Submit

**Expected result:**
- `authClient.twoFactor.verifyTotp({ code })` succeeds
- Session created
- `router.push('/ask')` called

**Status:** 🔲

---

### TC-2FA-02: Login with 2FA enabled — wrong TOTP code
**Steps:**
1. Same as TC-2FA-01 steps 1–3
2. Enter invalid code `000000`

**Expected result:**
- Error shown: `a.errInvalidCode`
- User remains on 2FA step; session NOT created
- Back button returns to sign-in form

**Status:** 🔲

---

### TC-2FA-03: Login with 2FA enabled — expired TOTP code
**Steps:**
1. Wait until TOTP window expires (every 30 seconds)
2. Enter the just-expired code

**Expected result:**
- better-auth rejects expired code (typically allows ±1 window = 30 s tolerance)
- Inline error shown

**Status:** 🔲

---

### TC-2FA-04: 2FA — back button goes to sign-in
**Steps:**
1. Reach `StepTwoFactor`
2. Click "Back"

**Expected result:**
- `step` state set back to `'signin'`
- Full sign-in form shown
- No session created; previous partial auth cleared

**Status:** 🔲

---

## 7. Password Reset

### TC-PW-01: Request reset — existing email
**Preconditions:** Account exists with email/password.  
**Steps:**
1. Navigate to `/forgot-password`
2. Enter registered email
3. Submit

**Expected result:**
- Reset email sent via Resend (subject: "Reset your Fain password")
- UI shows "check your inbox" state
- Token set in DB with 1-hour expiry (`resetPasswordTokenExpiresIn: 3600`)
- Response must NOT differ based on whether email exists (prevent enumeration)

**Status:** 🔲

---

### TC-PW-02: Request reset — non-existent email
**Steps:**
1. Navigate to `/forgot-password`
2. Enter email that has no account
3. Submit

**Expected result:**
- Same success UI as TC-PW-01 — no error revealing that email doesn't exist
- No email sent (but user can't tell)

**Status:** 🔲

---

### TC-PW-03: Reset link — valid, within 1 hour
**Preconditions:** Reset email received (TC-PW-01).  
**Steps:**
1. Click "Reset password" link in email
2. Directed to `/forgot-password/reset?token=...`
3. Enter new password and confirm
4. Submit

**Expected result:**
- Password updated in DB
- Session may be created automatically (better-auth behavior; verify)
- Redirect to `/ask` or `/login`
- All existing sessions for this user should be invalidated (check if better-auth does this)

**Status:** 🔲

---

### TC-PW-04: Reset link — expired (> 1 hour)
**Steps:**
1. Use a reset link older than 1 hour

**Expected result:**
- Token rejected
- UI shows "link expired" with option to request a new one
- No password change in DB

**Status:** 🔲

---

### TC-PW-05: Reset link — used twice
**Steps:**
1. Use a valid reset link → change password
2. Use the same link again

**Expected result:**
- Second use rejected (token consumed on first use)
- Error message shown; no password change

**Status:** 🔲

---

### TC-PW-06: Reset for OAuth-only account (no password)
**Preconditions:** User registered only via Google OAuth (no credential account row).  
**Steps:**
1. Navigate to `/forgot-password`
2. Enter the Google-linked email

**Expected result:**
- No credential account exists → either no reset email sent, or email sent informing user to use Google sign-in
- UI must NOT crash or reveal an internal error

**Status:** 🔲

---

## 8. Magic Link

### TC-ML-01: Request magic link — valid email
**Preconditions:** Magic link configured (expiresIn = 15 min).  
**Steps:**
1. Navigate to `/login` (if magic link UI is exposed)
2. Enter email and request magic link

**Expected result:**
- Resend sends magic link email (subject: "Sign in to Fain")
- Link expires in 15 minutes
- UI shows "check your inbox"

**Note:** Magic link is currently a plugin configured in better-auth but the UI entry point is not confirmed. Verify where users can trigger it.

**Status:** 🔲

---

### TC-ML-02: Click magic link — valid
**Steps:**
1. Click the link in the email within 15 min

**Expected result:**
- Session created
- Redirect to `/onboarding` or `/ask` depending on profile status
- Link consumed (single-use)

**Status:** 🔲

---

### TC-ML-03: Click magic link — expired (> 15 min)
**Steps:**
1. Click the link after 15 minutes

**Expected result:**
- Token rejected; error page or error message shown
- No session created

**Status:** 🔲

---

## 9. Onboarding Flow

### TC-ON-01: Fresh user — all 4 steps, happy path
**Preconditions:** User authenticated, `onboardingCompletedAt IS NULL`.  
**Steps:**
1. Land on `/onboarding`
2. Step 0 (Role): Select one of 6 options (Founder, CFO, Accountant, Investor, Consultant, Other)
3. Click Continue → Step 1 (Company size): Solo / 2-10 / 11-50 / 51-200 / 200+
4. Click Continue → Step 2 (Primary goal): Select one option
5. Click Continue → Step 3 (Workspace name): Enter organisation name, click Launch
6. `POST /api/onboarding` called with `{ jobRole, companySize, primaryGoal, organisation }`
7. On success, `router.push('/ask')`

**Expected result:**
- `userProfiles` row created with all 4 fields + `onboardingCompletedAt = now()`
- `/ask` loads successfully
- Revisiting `/onboarding` now redirects to `/ask` (proxy sees completed profile)

**Status:** 🔲

---

### TC-ON-02: Back navigation between steps
**Steps:**
1. Reach Step 2
2. Click "Back"
3. Click "Back" again

**Expected result:**
- Step counter decrements correctly (2 → 1 → 0)
- Selections from previous steps preserved
- No API call made until final step
- Step progress dots reflect current position

**Status:** 🔲

---

### TC-ON-03: Continue disabled until selection made
**Steps:**
1. Land on Step 0 (Role)
2. Click "Continue" without selecting anything

**Expected result:**
- `canAdvance` is false → Continue button disabled
- No API call made

**Status:** 🔲

---

### TC-ON-04: Step 3 — empty workspace name
**Steps:**
1. Reach Step 3
2. Leave organisation field blank
3. Click "Launch"

**Expected result:**
- Blocked client-side (empty string fails `canAdvance` check)
- If submitted anyway, server returns 400 (Zod: `z.string().min(1)`)

**Status:** 🔲

---

### TC-ON-05: Onboarding API call fails (500 / network error)
**Steps:**
1. Complete all 4 steps
2. Network fails on `POST /api/onboarding`

**Expected result:**
- Error message shown on wizard
- User can retry (button re-enabled after error)
- `onboardingCompletedAt` NOT set (partial data not saved)
- No navigation to `/ask` until success

**Status:** 🔲

---

### TC-ON-06: Unauthenticated user visits /onboarding
**Steps:**
1. Clear cookies
2. Navigate directly to `/onboarding`

**Expected result:**
- Proxy intercepts (onboarding is an auth-required route)
- Redirects to `/login?from=/onboarding`

**Status:** 🔲

---

### TC-ON-07: Completed-onboarding user revisits /onboarding
**Preconditions:** `onboardingCompletedAt IS NOT NULL`.  
**Steps:**
1. Navigate to `/onboarding`

**Expected result:**
- Proxy calls `/api/onboarding` GET → sees `onboardingCompletedAt` set
- Redirects to `/ask`

**Note:** Currently the proxy only checks onboarding on `APP_ROUTES` and not on the `/onboarding` path itself for the "already done" case. Verify that revisiting `/onboarding` after completion redirects or at minimum doesn't re-run onboarding and overwrite data.

**Status:** 🔲

---

## 10. Post-Auth Redirect Logic

### TC-REDIR-01: callbackURL preserved through Google OAuth
**Steps:**
1. Navigate to `/login`
2. Click "Continue with Google"
3. `callbackURL = window.location.origin + '/ask'` → `https://fain.ge/ask`
4. Complete Google auth

**Expected result:**
- better-auth encodes callbackURL in the `state` parameter
- After callback, better-auth redirects to `https://fain.ge/ask`
- Proxy intercepts `/ask`; checks session (valid) + onboarding (complete) → renders `/ask`

**Watch for:** If `callbackURL` is ignored and better-auth falls back to `/`, the user hits the landing page redirect (root `page.tsx` → `redirect('/ask')`) which would still work, but is a double redirect.

**Status:** 🔲

---

### TC-REDIR-02: /login visited with `?from=` parameter
**Preconditions:** Unauthenticated user tries to access `/accounts`.  
**Steps:**
1. Navigate directly to `/accounts`
2. Proxy redirects to `/login?from=/accounts`
3. User logs in via email/password

**Expected result:**
- After successful login, `router.push('/ask')` is called (hardcoded in `LoginForm`)
- **Known limitation:** `?from=` parameter is NOT currently honoured by `LoginForm` — user always goes to `/ask` regardless of where they came from
- This is acceptable for MVP but should be flagged for future improvement

**Status:** 🔲

---

### TC-REDIR-03: App route access — no session
**Steps:**
1. Clear all cookies
2. Navigate to `/dashboard`, `/transactions`, `/settings`, `/accounts`, `/cash-flow`

**Expected result:**
- Proxy redirects each to `/login?from=<original path>`
- Login page shown with no error

**Status:** 🔲

---

### TC-REDIR-04: App route access — session exists, onboarding NOT done
**Preconditions:** Valid session, `onboardingCompletedAt IS NULL`.  
**Steps:**
1. Navigate to `/dashboard` (or any app route)

**Expected result:**
- Proxy calls `/api/onboarding` GET → null profile
- Redirect to `/onboarding`

**Status:** 🔲

---

### TC-REDIR-05: Landing page (/) — no session
**Steps:**
1. Clear cookies
2. Navigate to `https://fain.ge/`

**Expected result:**
- Landing page rendered
- No redirect

**Status:** 🔲

---

### TC-REDIR-06: Landing page (/) — valid session, onboarding complete
**Preconditions:** Active session, `onboardingCompletedAt IS NOT NULL`.  
**Steps:**
1. Navigate to `https://fain.ge/`

**Expected result:**
- Proxy intercepts (`/` is in `AUTH_ROUTES`)
- Redirect to `/ask`

**Status:** 🔲

---

## 11. Account Linking Scenarios

### TC-LINK-01: Google + email/password — same email — link succeeds
**This is the primary fixed bug. See TC-REG-G03 above.**  
**Key DB assertion after test:**
```sql
SELECT a.providerId, a.userId, u.email, u.emailVerified
FROM account a JOIN "user" u ON a.userId = u.id
WHERE u.email = '<test email>';
```
**Expected:** 2 rows — `providerId = 'credential'` and `providerId = 'google'`.

**Status:** 🔲

---

### TC-LINK-02: Microsoft + email/password — same email — link succeeds
Same as TC-LINK-01 but `providerId = 'microsoft'`.

**Status:** 🔲

---

### TC-LINK-03: Google + Microsoft — same email — both linked
**Preconditions:** User already has Google linked. Now signs in with Microsoft using same email.  
**Expected:** 3 account rows (credential, google, microsoft) for 1 user row.

**Status:** 🔲

---

### TC-LINK-04: Email/password login after Google linking
**Preconditions:** TC-LINK-01 complete — user has both credential and Google accounts.  
**Steps:**
1. Log out
2. Login via email/password (NOT Google)

**Expected result:**
- Same user session created
- Same `userId` as when signed in with Google
- Same profile and data accessible

**Status:** 🔲

---

## 12. Session Management

### TC-SESS-01: Session persists after browser restart
**Preconditions:** User signed in; session cookie is persistent (30-day maxAge).  
**Steps:**
1. Sign in
2. Close and reopen browser

**Expected result:**
- Session cookie persists (not a session cookie; it has `max-age`)
- Navigating to `/ask` works without re-login
- No 401 from the proxy

**Status:** 🔲

---

### TC-SESS-02: Sign out clears session
**Steps:**
1. Sign in successfully
2. Sign out (Settings → Sign out or equivalent)

**Expected result:**
- `better-auth.session_token` cookie cleared
- Navigating to `/ask` → redirected to `/login`
- DB session row marked invalid or deleted

**Status:** 🔲

---

### TC-SESS-03: Expired session — 30 days
**Preconditions:** Manipulate cookie expiry or mock 30 days passing.  
**Steps:**
1. Let session expire (or force-expire via DB)
2. Navigate to `/ask`

**Expected result:**
- Proxy `auth.api.getSession` returns null (expired)
- Redirect to `/login`
- No infinite redirect loop

**Status:** 🔲

---

### TC-SESS-04: Multiple tabs — sign out in one tab
**Steps:**
1. Open `/ask` in Tab A
2. Open `/ask` in Tab B
3. Sign out in Tab A

**Expected result:**
- Tab A redirects to landing page
- Tab B: next navigation or page action triggers `/api/onboarding` → 401 → proxy redirects to `/login`
- No crash; no stale data shown

**Status:** 🔲

---

### TC-SESS-05: Session cookie missing (tampered/deleted)
**Steps:**
1. Open DevTools → Application → Cookies
2. Delete `better-auth.session_token`
3. Navigate to `/ask`

**Expected result:**
- Proxy sees no session → redirect to `/login`
- No 500 error

**Status:** 🔲

---

### TC-SESS-06: Session cookie tampered (invalid value)
**Steps:**
1. Open DevTools
2. Change value of `better-auth.session_token` to `garbage`
3. Navigate to `/ask`

**Expected result:**
- Proxy `auth.api.getSession` returns null (invalid token)
- Redirect to `/login`
- No 500 or stack trace exposed

**Status:** 🔲

---

## 13. Security Scenarios

### TC-SEC-01: PKCE validation — state parameter tampering
**Steps:**
1. Start Google OAuth flow (copy the redirect URL with `state=...`)
2. Complete auth in another tab with a different state

**Expected result:**
- better-auth rejects mismatched state → `invalid_code` error
- No session created

**Status:** 🔲

---

### TC-SEC-02: PKCE validation — code reuse (replay attack)
**Steps:**
1. Complete OAuth, capture the callback URL with `code=...`
2. Re-submit the same callback URL

**Expected result:**
- Google rejects the code on the second use (`invalid_grant`)
- better-auth surfaces error; no session created

**Status:** 🔲

---

### TC-SEC-03: Open redirect — malicious callbackURL
**Steps:**
1. Craft a sign-in request with `callbackURL = 'https://evil.com'`

**Expected result:**
- better-auth validates the callbackURL against the configured `baseURL` / `trustedOrigins`
- Rejects off-domain redirect
- Only redirects to `https://fain.ge/*` URLs

**Status:** 🔲

---

### TC-SEC-04: Auth cookies — HttpOnly / Secure / SameSite
**Steps:**
1. Sign in successfully
2. Inspect the `better-auth.session_token` cookie in DevTools

**Expected result:**
- `HttpOnly` ✓ (not accessible via `document.cookie`)
- `Secure` ✓ (only sent over HTTPS)
- `SameSite=Lax` ✓ (prevents CSRF on cross-site requests)

**Status:** 🔲

---

### TC-SEC-05: Direct API access without session
**Steps:**
1. Clear cookies
2. `curl https://fain.ge/api/onboarding`
3. `curl https://fain.ge/api/bank/accounts`
4. `curl https://fain.ge/api/ai/chat`

**Expected result:**
- All return `401 Unauthorized`
- No data leak

**Status:** 🔲

---

### TC-SEC-06: CSRF — state mutation via cross-origin POST
**Steps:**
1. Attempt a cross-origin `POST /api/auth/sign-in/email` from a different origin

**Expected result:**
- `SameSite=Lax` + CORS configuration rejects the request
- No session created

**Status:** 🔲

---

### TC-SEC-07: User enumeration via error messages
**Test matrix:**
- Wrong password for existing account → error message X
- Wrong email (no account) → error message Y

**Expected result:**
- X and Y must be identical or generic (e.g., "Invalid email or password")
- Timing should be similar (harder to enumerate via response time)

**Status:** 🔲

---

### TC-SEC-08: Rate limiting — brute force password
**Steps:**
1. Submit wrong password 20+ times for the same account

**Expected result:**
- After N failures, better-auth should rate-limit or lock the account temporarily
- `429 Too Many Requests` or account lock message shown

**Note:** Verify if better-auth v1.6.x has built-in rate limiting or if this needs middleware/Vercel WAF.

**Status:** 🔲

---

## 14. Error States & Messages

### TC-ERR-01: Google OAuth — invalid_client (wrong credentials)
**Preconditions:** `GOOGLE_CLIENT_SECRET` deliberately incorrect in env.  
**Expected result:**
- `invalid_client` from Google → better-auth surfaces `invalid_code` to UI
- Error displayed on `/login?error=invalid_code` or similar
- No crash; no raw stack trace

**Note:** This was our original bug. Now fixed with correct credentials.

**Status:** 🔲

---

### TC-ERR-02: Google OAuth — network failure during token exchange
**Steps:**
1. Block `oauth2.googleapis.com` at network level (DevTools → Network → Block URLs)
2. Attempt Google sign-in

**Expected result:**
- Timeout or network error in callback
- User returned to `/login` with friendly error
- No partial session or orphaned state in DB

**Status:** 🔲

---

### TC-ERR-03: Neon DB connection failure
**Preconditions:** DB unreachable (simulate by temporarily blocking `api.eu-west-2.aws.neon.tech`).  
**Steps:**
1. Attempt any sign-in

**Expected result:**
- Auth callback fails gracefully
- Error page shown (not a blank page or 500 stack trace)
- Proxy `isOnboardingComplete` catches DB error → returns `true` (fail-open) to avoid infinite loops

**Status:** 🔲

---

### TC-ERR-04: Resend email delivery failure
**Preconditions:** `RESEND_API_KEY` invalid or Resend service down.  
**Steps:**
1. Register a new account

**Expected result:**
- Account created in DB even if email sending fails (email delivery failure should not roll back registration)
- UI may show "couldn't send email" state with a retry option
- Do NOT leave user in a limbo state (account created but no way to verify)

**Status:** 🔲

---

## 15. Edge Cases

### TC-EDGE-01: Incognito / private browsing
**Steps:**
1. Open incognito window
2. Navigate to `https://fain.ge/login`
3. Attempt Google sign-in

**Expected result:**
- PKCE cookies work in incognito (no cross-site storage needed)
- OAuth flow completes normally
- Session limited to incognito session (cleared when window closed)
- `localStorage.getItem('fain_last_email')` returns null (no remembered user)

**Status:** 🔲

---

### TC-EDGE-02: Third-party cookie blocking (Safari ITP / Firefox ETP)
**Preconditions:** Safari with ITP or Firefox with Enhanced Tracking Protection.  
**Steps:**
1. Sign in via Google OAuth in Safari

**Expected result:**
- PKCE cookies are first-party (set on `fain.ge`, not Google) — should not be blocked
- OAuth flow completes normally
- If blocked, error must be informative

**Status:** 🔲

---

### TC-EDGE-03: Deep link while unauthenticated
**Steps:**
1. Clear session
2. Navigate directly to `https://fain.ge/transactions?month=2026-05`

**Expected result:**
- Proxy redirects to `/login?from=/transactions`
- After login, user goes to `/ask` (current behavior — `?from=` not honoured)
- No 404 or crash

**Status:** 🔲

---

### TC-EDGE-04: Concurrent sign-in sessions (two devices)
**Steps:**
1. Sign in on Device A (Chrome)
2. Sign in on Device B (mobile)
3. Use both simultaneously

**Expected result:**
- Both sessions active independently (no forced sign-out on device A)
- `session` table has two rows for the same userId
- Each device has its own session token

**Status:** 🔲

---

### TC-EDGE-05: Account created, onboarding API returns 500
**Preconditions:** User completes all 4 onboarding steps; API returns 500.  
**Steps:**
1. Complete onboarding wizard
2. API call fails

**Expected result:**
- Wizard stays on step 3
- Error shown inline
- `onboardingCompletedAt` NOT set
- Proxy keeps redirecting to `/onboarding` on next page load

**Status:** 🔲

---

### TC-EDGE-06: Vercel cold start — proxy `isOnboardingComplete` check
**Context:** `isOnboardingComplete` calls `fetch('/api/onboarding')` from middleware. On cold start, the function may not be ready.  
**Expected result:**
- `catch { return true }` in `isOnboardingComplete` handles the failure gracefully
- User passes through to the app (fail-open) instead of being stuck in a redirect loop
- Subsequent requests work normally once warm

**Status:** 🔲

---

### TC-EDGE-07: Google account with unverified email
**Context:** Extremely rare, but possible with G Suite domain delegations.  
**Steps:**
1. Sign in with a Google account where Google returns `emailVerified: false`

**Expected result:**
- better-auth check: `!isTrustedProvider && !userInfo.emailVerified` — Google IS a trusted provider, so this passes
- Account created/linked successfully

**Status:** 🔲

---

## 16. Cross-browser Matrix

| Browser | Email/PW | Google OAuth | Microsoft OAuth | Notes |
|---|---|---|---|---|
| Chrome (latest) | 🔲 | 🔲 | 🔲 | |
| Safari (macOS) | 🔲 | 🔲 | 🔲 | ITP cookies |
| Firefox (latest) | 🔲 | 🔲 | 🔲 | ETP cookies |
| Edge (latest) | 🔲 | 🔲 | 🔲 | Same engine as Chrome |
| Mobile Safari (iOS) | 🔲 | 🔲 | 🔲 | Popup vs redirect |
| Mobile Chrome (Android) | 🔲 | 🔲 | 🔲 | |

---

## Known Issues / Design Decisions

| ID | Issue | Severity | Notes |
|---|---|---|---|
| KI-01 | `?from=` redirect parameter not honoured after login | Low | User always goes to `/ask` regardless of origin URL |
| KI-02 | First-time Google OAuth user (no prior email/pw account) still goes to onboarding | Expected | Correct behavior — all new accounts go through onboarding |
| KI-03 | `isOnboardingComplete` adds ~100–300ms latency on every app-route request (middleware fetch to `/api/onboarding`) | Medium | Can be optimised with a session-stored flag or DB join |
| KI-04 | Magic link UI entry point not visible in current login form | Low | Configured in better-auth but no button in LoginForm |
| KI-05 | Rate limiting on sign-in not implemented at app level | Medium | Needs Vercel WAF or custom middleware if not in better-auth |

---

## Quick SQL verification queries

```sql
-- User account rows after Google + email/pw linking
SELECT a."providerId", a."userId", u.email, u."emailVerified", a."createdAt"
FROM account a
JOIN "user" u ON a."userId" = u.id
ORDER BY u.email, a."createdAt";

-- Onboarding status for all users
SELECT u.email, p."onboardingCompletedAt", p."jobRole", p."companySize"
FROM "user" u
LEFT JOIN user_profiles p ON p."userId" = u.id
ORDER BY u."createdAt" DESC;

-- Active sessions
SELECT s."userId", u.email, s."expiresAt", s."createdAt"
FROM session s
JOIN "user" u ON s."userId" = u.id
WHERE s."expiresAt" > NOW()
ORDER BY s."createdAt" DESC;

-- Unverified accounts (should complete verification or be cleaned up)
SELECT email, "emailVerified", "createdAt"
FROM "user"
WHERE "emailVerified" = false
ORDER BY "createdAt" DESC;
```
