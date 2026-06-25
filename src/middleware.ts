/**
 * Next.js middleware entry point.
 * Re-exports the route-protection logic from proxy.ts.
 *
 * proxy.ts → middleware.ts so Next.js actually loads it.
 */
export { proxy as middleware, config } from './proxy'
