/**
 * Security & Cryptographic Single-Shop Binding Service
 * 
 * Enforces strict 1-to-1 cryptographic binding between:
 * - The authenticated owner session (user ID / token)
 * - The authorized shop ID ('shopId')
 * 
 * Prevents:
 * 1. Cross-shop data leakage or access
 * 2. Manual URL tampering (e.g. ?shopId=..., ?shop=..., #shopId=...)
 * 3. LocalStorage tampering or spoofing with another shop's payload
 * 4. Stale session hijacking
 */

const STORAGE_SESSION_BINDING_KEY = 'foodfax_sec_shop_binding_v1';
const BINDING_SECRET_SALT = 'FOODFAX_STRICT_ISOLATED_SHOP_BINDING_SALT_2026';

export interface CryptographicShopBinding {
  userId: string;
  shopId: string;
  phone: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

/**
 * Generates a SHA-256 cryptographic digest using standard Web Crypto API.
 */
async function computeSha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a tamper-evident cryptographic signature for a user-to-shop binding.
 */
export async function createBindingSignature(
  userId: string,
  shopId: string,
  phone: string,
  issuedAt: number
): Promise<string> {
  const payload = `${userId}::${shopId}::${phone}::${issuedAt}::${BINDING_SECRET_SALT}`;
  return computeSha256(payload);
}

/**
 * Generates and securely stores a signed cryptographic session binding.
 */
export async function generateAndStoreShopBinding(
  userId: string,
  shopId: string,
  phone: string
): Promise<CryptographicShopBinding> {
  const now = Date.now();
  // 7-day validity matching persistent auth session
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;
  const signature = await createBindingSignature(userId, shopId, phone, now);

  const binding: CryptographicShopBinding = {
    userId,
    shopId,
    phone,
    issuedAt: now,
    expiresAt,
    signature,
  };

  try {
    sessionStorage.setItem(STORAGE_SESSION_BINDING_KEY, JSON.stringify(binding));
    localStorage.setItem(STORAGE_SESSION_BINDING_KEY, JSON.stringify(binding));
  } catch (e) {
    console.warn('[Security] Failed to write shop binding to storage:', e);
  }

  return binding;
}

/**
 * Validates whether the currently stored binding matches the given user ID and shop ID,
 * and verifies the cryptographic signature to ensure no manual tampering has occurred.
 */
export async function verifyShopBinding(
  expectedUserId: string,
  candidateShopId: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Check sessionStorage first, then localStorage
    const raw = sessionStorage.getItem(STORAGE_SESSION_BINDING_KEY) || localStorage.getItem(STORAGE_SESSION_BINDING_KEY);
    if (!raw) {
      return { valid: false, reason: 'NO_BINDING_FOUND' };
    }

    const binding: CryptographicShopBinding = JSON.parse(raw);

    // Verify user ID matches
    if (binding.userId !== expectedUserId) {
      return { valid: false, reason: 'USER_MISMATCH' };
    }

    // Verify shop ID matches
    if (binding.shopId !== candidateShopId) {
      return { valid: false, reason: 'SHOP_MISMATCH_TAMPERED' };
    }

    // Verify expiration
    if (Date.now() > binding.expiresAt) {
      return { valid: false, reason: 'BINDING_EXPIRED' };
    }

    // Verify cryptographic signature integrity
    const expectedSignature = await createBindingSignature(
      binding.userId,
      binding.shopId,
      binding.phone,
      binding.issuedAt
    );

    if (expectedSignature !== binding.signature) {
      return { valid: false, reason: 'INVALID_SIGNATURE_TAMPERED' };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: 'PARSE_VERIFICATION_ERROR' };
  }
}

/**
 * Clears the stored binding token upon logout or detected tampering.
 */
export function purgeShopBinding(): void {
  try {
    sessionStorage.removeItem(STORAGE_SESSION_BINDING_KEY);
    localStorage.removeItem(STORAGE_SESSION_BINDING_KEY);
  } catch (_) {}
}

/**
 * Sanitizes and strips any malicious URL query parameters or hash fragments
 * (e.g. ?shopId=..., ?shop=..., ?stallId=..., #shopId=...) that an attacker or user
 * might manually inject into the browser URL bar to attempt cross-shop access.
 */
export function sanitizeBrowserUrlTampering(): { tamperedDetected: boolean; attemptedShopId: string | null } {
  if (typeof window === 'undefined') {
    return { tamperedDetected: false, attemptedShopId: null };
  }

  try {
    const url = new URL(window.location.href);
    const suspiciousKeys = ['shopId', 'shop_id', 'shop', 'stallId', 'stall_id', 'restaurant_id', 'restaurantId'];
    let tamperedDetected = false;
    let attemptedShopId: string | null = null;

    suspiciousKeys.forEach((key) => {
      if (url.searchParams.has(key)) {
        attemptedShopId = url.searchParams.get(key);
        url.searchParams.delete(key);
        tamperedDetected = true;
      }
    });

    // Check hash parameters (e.g., #shopId=xxx)
    if (url.hash && suspiciousKeys.some((k) => url.hash.includes(k))) {
      tamperedDetected = true;
      url.hash = '';
    }

    if (tamperedDetected) {
      console.warn(`[Security Alert] Detected and neutralized URL tampering attempt! Parameter was removed:`, attemptedShopId);
      window.history.replaceState({}, document.title, url.pathname + url.search);
    }

    return { tamperedDetected, attemptedShopId };
  } catch (err) {
    return { tamperedDetected: false, attemptedShopId: null };
  }
}
