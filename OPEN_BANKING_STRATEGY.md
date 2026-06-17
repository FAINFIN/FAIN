# Fain — Open Banking Data Strategy
> Status: Architecture Phase · Focus: Runway & Burn Analysis · Date: 2026-06-17

---

## 1. What We're Working With

### NBG Regulated Banks (12 total)

All Georgian banks listed on nbg.gov.ge implement the **Berlin Group NextGenPSD2 framework** — the same European standard as PSD2. This is important: it means **one API shape across all 12 banks**, just different base URLs and token endpoints.

| Bank | Framework Version | SCA Approach | Notes |
|------|------------------|-------------|-------|
| TBC Bank | NextGenPSD2 v1.3.6 | OAuth + Redirect | Primary bank for Georgian SMEs |
| Bank of Georgia (BOG) | NextGenPSD2 v1.3.9 | OAuth only | Has XAIS (extended AIS) + XPIS |
| TeraBank | NextGenPSD2 | OAuth | |
| ProCredit Bank | NextGenPSD2 | OAuth | Common for SME businesses |
| Credo Bank | NextGenPSD2 | OAuth | |
| Halyk Bank Georgia | NextGenPSD2 | OAuth | |
| Liberty Bank | NextGenPSD2 | OAuth | |
| Basisbank | NextGenPSD2 | OAuth | |
| Silk Bank | NextGenPSD2 | OAuth | |
| Cartu Bank | NextGenPSD2 | OAuth | |
| PASHA Bank | NextGenPSD2 | OAuth | Common for international businesses |
| Paysera Bank | NextGenPSD2 | OAuth | Fintech-native |

**Key insight**: You write one AIS client, it talks to all 12 banks.

### Salt Edge

A regulated AISP (licensed in UK/EU) that sits between you and the banks. One API → 5,000+ banks globally. They handle the OAuth/consent dance per bank and return normalized data.

---

## 2. Exact Data You Can Pull

### 2a. Account Data (AIS — `/v2/accounts`)

This is what you get per account after user consent:

```json
{
  "resourceId": "unique-account-id-at-this-bank",
  "iban": "GE29TB7522145063300002",
  "currency": "GEL",
  "ownerName": "ABC Company Ltd",
  "cashAccountType": "CACC",
  "name": "Current Account",
  "displayName": "TBC Current GEL",
  "product": "Business Current Account",
  "status": "enabled",
  "bic": "TBCBGE22",
  "linkedAccounts": "",
  "balances": [
    {
      "balanceType": "closingBooked",
      "balanceAmount": { "currency": "GEL", "amount": "124500.00" },
      "referenceDate": "2026-06-17"
    },
    {
      "balanceType": "interimAvailable",
      "balanceAmount": { "currency": "GEL", "amount": "124200.00" },
      "referenceDate": "2026-06-17",
      "lastChangeDateTime": "2026-06-17T14:23:00+04:00"
    }
  ]
}
```

**Balance types you'll encounter:**
- `closingBooked` — end-of-day confirmed balance ✅ use this for runway calc
- `interimAvailable` — real-time available ✅ use for current cash position
- `openingBooked` — start of day balance
- `expected` — including pending transactions
- `forwardAvailable` — after future scheduled payments

**cashAccountType codes relevant to Fain:**
- `CACC` — Current Account (main operating account)
- `SVGS` — Savings Account
- `LOAN` — Loan/Credit Account
- `CARD` — Card Account

### 2b. Transaction Data (AIS — `/v2/accounts/{accountId}/transactions`)

This is the most valuable data for Fain. Per transaction:

```json
{
  "transactionId": "2024061700001234",
  "entryReference": "REF2024061700001",
  "bookingDate": "2026-06-17",
  "valueDate": "2026-06-17",
  "transactionAmount": {
    "currency": "GEL",
    "amount": "-4500.00"
  },
  "creditorName": "Vendor Name LLC",
  "creditorAccount": { "iban": "GE29BG0000000001234567" },
  "debtorName": "ABC Company Ltd",
  "debtorAccount": { "iban": "GE29TB7522145063300002" },
  "remittanceInformationUnstructured": "Office rent June 2026",
  "bankTransactionCode": "PMNT-ICDT-ESCT",
  "proprietaryBankTransactionCode": "OUTGOING",
  "transactionStatus": "BOOK"
}
```

**Field-by-field relevance for runway calc:**

| Field | What it is | Fain use |
|-------|-----------|----------|
| `bookingDate` | When bank posted it | **Primary date** for burn tracking |
| `valueDate` | Settlement date | Fallback if bookingDate missing |
| `amount` | Negative = outflow, Positive = inflow | **Core burn signal** |
| `currency` | GEL/USD/EUR | Multi-currency normalization |
| `creditorName` | Who you paid | Vendor categorization |
| `debtorName` | Who paid you | Revenue source tagging |
| `remittanceInformationUnstructured` | Free text memo | Category inference via Claude |
| `bankTransactionCode` | Coded type (PMNT, FEES, etc.) | Automatic type detection |
| `transactionStatus` | BOOK/PDNG/RJCT | Ignore PDNG/RJCT for burn |

**Transaction amount sign convention:**
- Negative amount = money OUT (expense, payment to vendor)
- Positive amount = money IN (revenue, transfer received)

**Transaction history window:**
- NBG standard allows requesting up to 24 months of history
- BOG documentation confirms 24-month window is supported
- Some smaller banks may restrict to 12 months

### 2c. BOG Extended AIS (XAIS) — Bonus Data

BOG specifically exposes XAIS (`/docs/bg-ofa-xais`), which provides:
- More granular categorization codes
- Richer metadata per transaction
- Extended balance types

Worth implementing for BOG specifically.

### 2d. What Salt Edge Adds on Top

If you route through Salt Edge (for non-Georgian banks), you get:

```json
{
  "id": "111111111111111111",
  "duplicated": false,
  "mode": "normal",
  "status": "posted",
  "made_on": "2026-06-17",
  "amount": -4500.00,
  "currency_code": "GEL",
  "description": "Office rent June 2026",
  "category": "rent",
  "extra": {
    "merchant_id": "merchant_xyz",
    "merchant_name": "Commercial Property Ltd",
    "categorization_confidence": 0.97,
    "original_amount": -4500.00,
    "original_currency_code": "GEL",
    "transfer_account_id": null
  }
}
```

Salt Edge's **Data Enrichment** service adds:
- Automatic **transaction categorization** (business or personal mode)
- **Merchant identification** — maps raw text to actual merchant names
- **Financial Insights** reports: income/expense, balance trend, expense by category, savings report

---

## 3. What You CANNOT Get

These limitations matter for architecture:

| Data point | Available? | Notes |
|-----------|-----------|-------|
| Payroll/employee count | ❌ | Only transaction descriptions hint at this |
| Invoice data | ❌ | Would need accounting software integration |
| Tax obligations | ❌ | Need RS.GE integration separately |
| Credit card spending detail | Partial | Card account shows total, not per-item |
| Future scheduled payments | Partial | Some banks expose periodic-payments |
| Business name / legal entity | ✅ via ownerName | Confirmed on consent |
| Account holder identity | ✅ via TBC-ID / BOG-ID | Separate identity endpoint |

---

## 4. How to Work With the Data

### 4a. Core Data Pipeline (NBG Direct)

```
User connects bank
    ↓
POST /consents (create AIS consent)
    ↓
Redirect user to bank OAuth → user approves
    ↓
Receive authorization code → exchange for access_token
    ↓
GET /accounts → list all accounts
    ↓
GET /accounts/{id}/balances → current balances
    ↓
GET /accounts/{id}/transactions?dateFrom=24mo-ago → full history
    ↓
Store everything in IndexedDB (Dexie)
    ↓
access_token expires? → use refresh_token silently
```

**Consent lifecycle (critical for UX):**
- Consent duration: up to 90 days typically (bank-dependent)
- You must re-request consent after expiry
- TBC uses Redirect SCA (browser redirect to TBC login)
- BOG uses OAuth SCA only

### 4b. The Privacy Architecture (Fain's Differentiator)

Since Fain never stores raw transactions on a server:

```
Browser                     Fain Server              Bank API
   |                             |                       |
   |── POST /api/initiate ──────>|                       |
   |                             |── POST /consents ────>|
   |<── redirect_url ────────────|<── consentId ─────────|
   |                             |                       |
   |── [user redirected to bank, approves] ─────────────|
   |                             |                       |
   |── GET /api/token?code=xxx ─>|                       |
   |                             |── POST /token ───────>|
   |<── {access_token, refresh} ─|<── tokens ────────────|
   |                             |                       |
   |── [store tokens in IndexedDB]                       |
   |                             |                       |
   |── [browser calls bank APIs directly with token] ───>|
   |<── [raw transactions] ─────────────────────────────|
   |                             |                       |
   |── [store in IndexedDB only, never POST to server]   |
```

**Server only ever sees:**
- Consent initiation request (no financial data)
- Token exchange (one-time, then browser-cached)
- Claude API calls: only aggregated summaries ("total spent on payroll last month: ₾45,000")

**This is the correct privacy model.** Never proxy raw transactions through your server.

### 4c. IndexedDB Schema (Dexie)

```typescript
// Fain IndexedDB schema
const db = new Dexie('fain');

db.version(1).stores({
  // Connected bank accounts
  accounts: '++id, bankCode, resourceId, iban, currency, type, lastSynced',
  
  // All transactions
  transactions: '++id, accountId, transactionId, bookingDate, amount, currency, [accountId+bookingDate]',
  
  // Snapshots of balances over time (for trend charts)
  balanceSnapshots: '++id, accountId, date, balance, currency, balanceType',
  
  // Fain-computed categories (override raw bankTransactionCode)
  categories: '++id, transactionId, category, subcategory, confidence, source',
  
  // Sync state per account
  syncState: 'accountId, lastSyncedDate, oldestFetchedDate, accessToken, refreshToken, tokenExpiry',
  
  // Bank connections (consents)
  connections: '++id, bankCode, consentId, consentStatus, consentExpiry, scopes',
});
```

**Key indexes for performance:**
- `[accountId+bookingDate]` — critical for monthly burn queries
- `bookingDate` — for range queries across all accounts

### 4d. Computing Runway & Burn (the Fain core)

```typescript
// Runway calculation
async function calculateRunway(lookbackMonths = 3) {
  const now = new Date();
  const from = subMonths(now, lookbackMonths);
  
  // 1. Current cash across all accounts
  const latestBalances = await db.balanceSnapshots
    .where('date').equals(toISO(today))
    .filter(b => b.balanceType === 'closingBooked')
    .toArray();
  
  const totalCashGEL = await normalizeToCurrency(latestBalances, 'GEL');
  
  // 2. Burn = outflows only (negative amounts), excluding transfers
  const expenses = await db.transactions
    .where('bookingDate').between(toISO(from), toISO(now))
    .filter(tx => tx.amount < 0 && tx.category !== 'transfer')
    .toArray();
  
  const totalBurnGEL = Math.abs(await normalizeToCurrency(expenses, 'GEL'));
  const monthlyBurnRate = totalBurnGEL / lookbackMonths;
  
  // 3. Runway in months
  const runwayMonths = totalCashGEL / monthlyBurnRate;
  
  return {
    totalCash: totalCashGEL,
    monthlyBurn: monthlyBurnRate,
    runway: runwayMonths,
    lookbackMonths,
    asOf: now,
  };
}
```

### 4e. Transaction Categorization Strategy

Raw bank data has `remittanceInformationUnstructured` (free text like "Salary June Nino Gogoladze") and `bankTransactionCode` (like `PMNT-ICDT-ESCT`). You need to classify these.

**Three-layer approach:**

**Layer 1 — Bank codes (instant, no AI needed):**
```
PMNT-RCDT-ESCT → Incoming Credit (likely revenue)
PMNT-ICDT-ESCT → Outgoing Credit (expense)
FEES → Bank fees
LDAS → Loan disbursement
LNRE → Loan repayment
TAXE → Tax payment
SALA → Salary
```

**Layer 2 — Keyword rules (fast, deterministic):**
```typescript
const rules = [
  { pattern: /salary|salari|განაცხადი|ხელფასი/i, category: 'payroll' },
  { pattern: /rent|ijarа|ქირა/i, category: 'rent' },
  { pattern: /AWS|Google Cloud|Vercel|hosting/i, category: 'infrastructure' },
  { pattern: /invoice|ინვოისი/i, category: 'revenue' },
];
```

**Layer 3 — Claude inference (async, for ambiguous transactions):**
```typescript
// Send batch of uncategorized transactions to Claude
// Only send: amount, date, creditorName, remittanceText
// Never send: IBAN, account numbers, balance
const prompt = `
Categorize these business transactions for a Georgian SME.
Categories: payroll | rent | utilities | software | marketing | 
            revenue | loan-payment | tax | bank-fees | transfer | other

Transactions:
${uncategorized.map(tx => 
  `${tx.bookingDate} | ${tx.amount > 0 ? 'IN' : 'OUT'} ${Math.abs(tx.amount)} GEL | "${tx.description}"`
).join('\n')}

Return JSON: [{id, category, confidence}]
`;
```

---

## 5. NBG Direct vs Salt Edge Decision

### Go NBG Direct if:
- ✅ You only need Georgian banks (BOG + TBC cover 90%+ of SME market)
- ✅ Your privacy story is the core differentiator
- ✅ You want zero per-transaction cost
- ✅ You can spend ~2-3 weeks on the OAuth/JWS setup

**Required for NBG Direct:**
1. Register with Georgian Banking Association (GBA) as a TPP
2. Get NBG TPP authorization (similar to PSD2 in Europe)
3. Implement JWS signing — TBC requires `x-jws-signature` on ALL requests (they have an [open-source JWS library](https://github.com/TBCBank/TBC.OpenBanking.Jws))
4. QWAC certificate equivalent for Georgia (GBA standard)

**Consent URL patterns:**
- TBC: `https://xs2a.tbcbank.ge/` (prod), sandbox available
- BOG: `https://xs2a.bog.ge/0.8/` (prod), `https://xs2a-sandbox.bog.ge/0.8/` (sandbox)

### Go Salt Edge if:
- ✅ You need global coverage (founders with non-Georgian accounts)
- ✅ You want automatic transaction categorization out-of-the-box
- ✅ You want to launch faster (weeks not months)
- ⚠️ You're okay with Salt Edge temporarily seeing raw transaction data during fetch
- ⚠️ Cost: ~$0.50–1.00/connection/month at scale

**Note on privacy with Salt Edge:** Salt Edge fetches on their infrastructure, normalizes, then sends to your browser. Your server never sees it, but Salt Edge does — briefly. You can mitigate this in your privacy policy by being transparent.

### Recommended for Fain V1: **Hybrid**

1. **Salt Edge for connection UX** — use their pre-built widget to handle the OAuth dance across all Georgian banks. Much less engineering.
2. **After tokens received, call banks directly from browser** — the token Salt Edge gives back can be used with the bank's XS2A API directly. Check Salt Edge's token passthrough mode.
3. **Add direct NBG for TBC + BOG V2** — once you've validated the product, implement direct NBG for the two biggest banks (cutting out the middleman).

---

## 6. Multi-Currency Strategy

Georgian SMEs commonly hold accounts in GEL, USD, and EUR. Fain must normalize everything to GEL for runway calculations.

```typescript
// Use NBG official exchange rates (free, no API key required)
// https://nbg.gov.ge/en/page/foreign-exchange-market
const NBG_RATES_URL = 'https://nbg.gov.ge/api/foreign-exchange-rates';

async function getExchangeRates(date: string) {
  const res = await fetch(`${NBG_RATES_URL}?date=${date}`);
  // Returns official GEL rates for USD, EUR, GBP, etc.
}

// TBC also has exchange rates API (no auth required):
// GET https://openapi.tbcbank.ge/v1/exchange-rates/commercial
```

**Normalization rule:** Always store raw amounts in original currency + a `amountGEL` computed field. Never bake exchange rates in permanently — recalculate when NBG rates update.

---

## 7. What to Build First (Ordered)

1. **Sandbox connection** — Connect to TBC sandbox (`sandbox.tbcbank.ge`) and BOG sandbox, pull test transactions. Validate your IndexedDB schema handles multi-account, multi-currency.

2. **Balance snapshot ingestion** — On connect, store the most recent `closingBooked` balance per account with date. This is the seed data for runway.

3. **Transaction ingestion** — Pull 24 months, store in IndexedDB. Implement incremental sync (only pull from `lastSyncedDate`).

4. **Burn rate engine** — Compute `monthlyBurnRate` from last 90 days of outflows. Exclude inter-account transfers. Normalize to GEL.

5. **Runway metric** — `cash / monthlyBurn`. This is the `[[Runway | 14 mo]]` inline metric Fain displays.

6. **Claude integration** — Pass aggregate summaries to Claude (not raw transactions): "Monthly outflows by category: payroll ₾45k, rent ₾8k, software ₾2k..."

7. **Consent refresh flow** — Handle the 90-day consent expiry. Prompt user to re-authorize before data goes stale.

---

## 8. API Registration Steps (To Do)

### TBC Bank
1. Create developer account at `developers.tbcbank.ge`
2. Register an app → get API key + secret
3. Get a certificate: `developers.tbcbank.ge/docs/api-product-certificates`
4. Sandbox env: test everything before going live
5. Go Live: submit via developer portal

### BOG
1. Register at `businessmanager.bog.ge`
2. Open Banking section → register TPP
3. Download OpenAPI spec from `api.bog.ge/docs/redocusaurus/plugin-redoc-0.yaml`
4. Sandbox: `xs2a-sandbox.bog.ge`
5. Production: `xs2a.bog.ge`

### NBG TPP Registration (for all banks)
- Contact the Georgian Banking Association: `association.ge`
- Full NBG OpenFinance standards: `cdn.association.ge/static/openbanking/standards/`

---

## 9. Raw API Reference Summary

### NBG Berlin Group Endpoints (same pattern across all banks)

```
# Consent lifecycle
POST   /v2/consents                           → create consent
GET    /v2/consents/{consentId}               → read consent
DELETE /v2/consents/{consentId}               → delete consent
GET    /v2/consents/{consentId}/status        → check status

# Accounts
GET    /v2/accounts                           → list accounts
GET    /v2/accounts/{accountId}              → account details
GET    /v2/accounts/{accountId}/balances     → balances ⭐
GET    /v2/accounts/{accountId}/transactions → transactions ⭐

# Transaction query params
?dateFrom=2024-06-17        # start date (YYYY-MM-DD)
?dateTo=2026-06-17          # end date
?bookingStatus=booked       # booked|pending|both
?withBalance=true           # include balance in response

# Auth
OAuth 2.0 Authorization Code flow
All requests: x-jws-signature header (TBC requirement)
All requests: X-Request-ID: {uuid}
All requests: PSU-IP-Address: {user IP}
```

### Salt Edge Endpoints

```
POST   /api/v6/customers              → create customer (one per Fain user)
POST   /api/v6/connect_sessions       → generate widget URL
GET    /api/v6/connections            → list connections
POST   /api/v6/connections/refresh    → refresh data
GET    /api/v6/accounts               → list accounts
GET    /api/v6/transactions           → list transactions
POST   /api/v6/data_enrichment/categorize → run categorization
GET    /api/v6/data_enrichment/categories → get categories

Base URL: https://www.saltedge.com
Auth: App-id + Secret headers
Sandbox: fake_oauth_client_xf provider
```

---

## 10. Key Risks

| Risk | Severity | Mitigation |
|------|---------|-----------|
| Consent expires every 90 days | Medium | In-app reminder + silent token refresh |
| Bank sandbox ≠ production behavior | Medium | Test on personal accounts before launch |
| JWS signature complexity (TBC) | High | Use TBC's open-source JWS library |
| Exchange rate lag | Low | Cache NBG rates, update daily |
| 24-month history not always available | Medium | Fall back to available period, note in UI |
| SME founder has business + personal accounts | Medium | Clear account-type filter in UI |
| Multi-currency transactions (USD expenses) | Medium | Always normalize to GEL, show original |
