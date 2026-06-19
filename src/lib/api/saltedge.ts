const BASE_URL = 'https://www.saltedge.com/api/v6'

function getHeaders() {
  return {
    'App-id':       process.env.SALT_EDGE_APP_ID ?? '',
    'Secret':       process.env.SALT_EDGE_SECRET ?? '',
    'Content-Type': 'application/json',
  }
}

async function saltEdgeFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Salt Edge ${res.status}: ${JSON.stringify(err)}`)
  }
  const json = await res.json() as { data: T }
  console.log('[saltedge] raw response for', path, JSON.stringify(json).slice(0, 500))
  return json.data
}

// ── Customer (Salt Edge requires a customer object per user) ──────────────
// v6 response uses `customer_id` (not `id`) for the SE-assigned customer ID

interface SECustomer {
  customer_id: string
  identifier:  string
}

export async function createCustomer(identifier: string) {
  return saltEdgeFetch<SECustomer>('/customers', {
    method: 'POST',
    body:   JSON.stringify({ data: { identifier } }),
  })
}

export async function getCustomer(customerId: string) {
  return saltEdgeFetch<SECustomer>(`/customers/${customerId}`)
}

/** Look up an existing customer by the identifier we passed at creation time. */
export async function getCustomerByIdentifier(identifier: string) {
  const results = await saltEdgeFetch<SECustomer[]>(`/customers?identifier=${encodeURIComponent(identifier)}`)
  const arr = Array.isArray(results) ? results : [results]
  if (arr.length === 0) throw new Error(`Salt Edge: no customer found for identifier ${identifier}`)
  return arr[0]!
}

// ── Connect session ───────────────────────────────────────────────────────
export async function createConnectSession(customerId: string, returnTo: string) {
  return saltEdgeFetch<{ connect_url: string; expires_at: string }>('/connect_sessions/create', {
    method: 'POST',
    body:   JSON.stringify({
      data: {
        customer_id: customerId,
        consent: {
          scopes:       ['account_details', 'transactions_details'],
          from_date:    new Date(Date.now() - 24 * 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          period_days:  730, // 24 months
        },
        attempt: { return_to: returnTo, fetch_scopes: ['accounts', 'transactions'] },
        allowed_countries: ['GE', 'UZ', 'KZ', 'AM', 'AZ'],
      },
    }),
  })
}

// ── Accounts ──────────────────────────────────────────────────────────────
export interface SaltEdgeAccount {
  id:            string
  name:          string
  nature:        string
  balance:       string
  currency_code: string
  extra:         Record<string, unknown>
}

export async function fetchAccounts(connectionId: string) {
  return saltEdgeFetch<SaltEdgeAccount[]>(`/accounts?connection_id=${connectionId}`)
}

// ── Transactions ──────────────────────────────────────────────────────────
export interface SaltEdgeTransaction {
  id:            string
  account_id:    string
  amount:        string
  currency_code: string
  made_on:       string
  description:   string
  category:      string
  extra: {
    merchant_name?: string
    original_amount?: number
    account_balance_snapshot?: string
  }
}

export async function fetchTransactions(
  accountId: string,
  fromDate?: string,
  toDate?: string,
) {
  const params = new URLSearchParams({ account_id: accountId })
  if (fromDate) params.set('from_date', fromDate)
  if (toDate)   params.set('to_date',   toDate)

  // Salt Edge paginates with next_id
  const all: SaltEdgeTransaction[] = []
  let nextId: string | null = null

  do {
    if (nextId) params.set('from_id', nextId)
    const res = await fetch(`${BASE_URL}/transactions?${params}`, { headers: getHeaders() })
    const json = await res.json() as { data: SaltEdgeTransaction[]; meta?: { next_id?: string } }
    all.push(...json.data)
    nextId = json.meta?.next_id ?? null
  } while (nextId)

  return all
}

// ── Connection status ─────────────────────────────────────────────────────
export async function fetchConnection(connectionId: string) {
  return saltEdgeFetch<{ id: string; status: string; last_success_at: string }>(`/connections/${connectionId}`)
}

export async function deleteConnection(connectionId: string) {
  return saltEdgeFetch<{ deleted: boolean }>(`/connections/${connectionId}`, { method: 'DELETE' })
}
