# FoodFax Shop Owner App — Security & Readiness Audit
**Audit date:** 2026-10-26  
**Scope:** Default branch source inspection only. No build, device test, production request, or database query was run.

## Confirmed code-review findings
- **High priority — client-side shop binding is not a security boundary:** `src/services/securityService.ts` uses a salt embedded in client JavaScript to generate a SHA-256 digest. Because client code and the salt are visible to users, this cannot prove a shop binding is authentic. Enforce shop ownership through authenticated server-side checks and database RLS.
- **Configuration hygiene:** `.env.example` includes realistic-looking Supabase keys and a Google Maps API key. Replace these with placeholders and rotate/restrict any real keys that were committed.
- **Fallback credentials:** `src/lib/supabaseClient.ts` has a hard-coded anon-key fallback. Client anon/publishable keys are not equivalent to service-role secrets, but they should still be environment-configured and governed by strict RLS; no credential should be relied on as a security control.
- **Validation tests exist:** `src/utils/security.test.ts` covers helper-level tenant checks, status transitions, and upload validation. These tests do not by themselves prove that every database/API operation enforces those checks.
- **Duplicate app surface:** `Foodfax-shop-App` is a separate Flutter-oriented repository with overlapping owner functionality. Confirm which app is authoritative before applying behavior changes to both.

## Required verification before release
1. Verify shop ownership server-side for every read/write, including orders, menu, settings, storage, reports and KYC.
2. Test RLS against anonymous, owner-A, owner-B and admin identities.
3. Validate file uploads by size, actual content/type, and allowed extensions; store sensitive KYC files privately.
4. Remove reliance on client-generated signatures or localStorage/sessionStorage for authorization.
5. Check auth/session expiry, logout, account switching and stale cached shop data.
6. Run TypeScript tests, production build, Android build, and manual device checks.
7. Rotate/restrict any real keys exposed in repository history.

## Status
- Source inspection: **started**
- Runtime/build/tests: **not run**
- Production configuration/database: **not verified**
- Production readiness: **not certified**
