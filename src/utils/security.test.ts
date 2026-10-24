import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateOrderStatusTransition,
  validateMerchantTenantAccess,
  assertMerchantTenantAccess,
  formatDailyToken,
  validateKycFile,
  sanitizeInput,
  validateMenuItemInput,
  MAX_KYC_FILE_SIZE_BYTES,
} from './security';
import { assertNoServiceRoleKey } from '../lib/supabaseClient';

describe('1. Merchant Tenant Boundary Isolation Tests', () => {
  const shopA = 'shop_street_momos_101';
  const shopB = 'shop_punjabi_dhaba_202';

  it('allows merchant to access resources belonging to their own shop', () => {
    const result = validateMerchantTenantAccess(shopA, shopA);
    assert.equal(result.allowed, true);
    assert.equal(result.error, undefined);
    assert.doesNotThrow(() => assertMerchantTenantAccess(shopA, shopA));
  });

  it('strictly blocks Merchant A from accessing Merchant B resources (cross-tenant leak prevention)', () => {
    const result = validateMerchantTenantAccess(shopA, shopB);
    assert.equal(result.allowed, false);
    assert.match(result.error || '', /Tenant Isolation Violation/i);
    assert.throws(
      () => assertMerchantTenantAccess(shopA, shopB),
      /Tenant Isolation Violation/i
    );
  });

  it('rejects unauthenticated requests without an active shop session', () => {
    const result = validateMerchantTenantAccess(null, shopA);
    assert.equal(result.allowed, false);
    assert.match(result.error || '', /Unauthorized/i);
  });

  it('rejects resource access without target shop_id', () => {
    const result = validateMerchantTenantAccess(shopA, '');
    assert.equal(result.allowed, false);
    assert.match(result.error || '', /Bad Request/i);
  });
});

describe('2. Order Status State Machine Transition Tests', () => {
  it('allows standard sequential forward lifecycle transitions', () => {
    // PENDING -> ACCEPTED
    assert.equal(validateOrderStatusTransition('pending', 'accepted').allowed, true);
    // ACCEPTED -> PREPARING
    assert.equal(validateOrderStatusTransition('accepted', 'preparing').allowed, true);
    // PREPARING -> READY
    assert.equal(validateOrderStatusTransition('preparing', 'ready').allowed, true);
    // READY -> COMPLETED
    assert.equal(validateOrderStatusTransition('ready', 'completed').allowed, true);
  });

  it('allows cancellation from active pre-fulfillment states', () => {
    assert.equal(validateOrderStatusTransition('pending', 'cancelled').allowed, true);
    assert.equal(validateOrderStatusTransition('accepted', 'cancelled').allowed, true);
    assert.equal(validateOrderStatusTransition('preparing', 'cancelled').allowed, true);
    assert.equal(validateOrderStatusTransition('ready', 'cancelled').allowed, true);
  });

  it('permits idempotent identical state re-application', () => {
    assert.equal(validateOrderStatusTransition('pending', 'pending').allowed, true);
    assert.equal(validateOrderStatusTransition('accepted', 'accepted').allowed, true);
    assert.equal(validateOrderStatusTransition('ready', 'ready').allowed, true);
  });

  it('disallows illegal jumps (e.g. PENDING directly to COMPLETED or READY)', () => {
    // Jump from PENDING directly to COMPLETED
    const jumpToCompleted = validateOrderStatusTransition('pending', 'completed');
    assert.equal(jumpToCompleted.allowed, false);
    assert.match(jumpToCompleted.error || '', /cannot jump from 'PENDING' to 'COMPLETED'/i);

    // Jump from PENDING directly to READY
    const jumpToReady = validateOrderStatusTransition('pending', 'ready');
    assert.equal(jumpToReady.allowed, false);

    // Jump from ACCEPTED directly to COMPLETED
    const acceptedToCompleted = validateOrderStatusTransition('accepted', 'completed');
    assert.equal(acceptedToCompleted.allowed, false);
  });

  it('disallows reverse transitions from later states to earlier states', () => {
    // READY cannot revert to PREPARING
    assert.equal(validateOrderStatusTransition('ready', 'preparing').allowed, false);
    // PREPARING cannot revert to PENDING
    assert.equal(validateOrderStatusTransition('preparing', 'pending').allowed, false);
  });

  it('enforces terminal state immutability (COMPLETED and CANCELLED cannot transition)', () => {
    assert.equal(validateOrderStatusTransition('completed', 'pending').allowed, false);
    assert.equal(validateOrderStatusTransition('completed', 'accepted').allowed, false);
    assert.equal(validateOrderStatusTransition('completed', 'cancelled').allowed, false);
    assert.equal(validateOrderStatusTransition('cancelled', 'pending').allowed, false);
    assert.equal(validateOrderStatusTransition('cancelled', 'ready').allowed, false);
  });
});

describe('3. Daily Sequential Token Numbering Tests', () => {
  it('formats numeric tokens into daily sequential #101 format', () => {
    assert.equal(formatDailyToken(101), '#101');
    assert.equal(formatDailyToken('102'), '#102');
    assert.equal(formatDailyToken('150'), '#150');
  });

  it('preserves existing prefixed tokens without duplication', () => {
    assert.equal(formatDailyToken('#101'), '#101');
    assert.equal(formatDailyToken('#999'), '#999');
  });

  it('extracts fallback daily tokens cleanly when raw token is absent', () => {
    assert.equal(formatDailyToken(null, 'order-789'), '#789');
    assert.equal(formatDailyToken(undefined, 'ord-abc1234'), '#234');
    assert.equal(formatDailyToken(null, undefined), '#101');
  });
});

describe('4. KYC Document Upload Security Tests', () => {
  it('accepts valid PDF documents within 5MB limit', () => {
    const validPdf = {
      name: 'fssai_license.pdf',
      type: 'application/pdf',
      size: 2 * 1024 * 1024, // 2MB
    };
    const result = validateKycFile(validPdf);
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  it('accepts valid JPEG and PNG documents within 5MB limit', () => {
    const validJpg = {
      name: 'pan_card.jpg',
      type: 'image/jpeg',
      size: 1.5 * 1024 * 1024,
    };
    assert.equal(validateKycFile(validJpg).valid, true);

    const validPng = {
      name: 'gstin_certificate.png',
      type: 'image/png',
      size: 3 * 1024 * 1024,
    };
    assert.equal(validateKycFile(validPng).valid, true);
  });

  it('strictly rejects files exceeding the 5MB maximum limit', () => {
    const oversizedFile = {
      name: 'bank_statement_hd.pdf',
      type: 'application/pdf',
      size: MAX_KYC_FILE_SIZE_BYTES + 1024, // 5MB + 1KB
    };
    const result = validateKycFile(oversizedFile);
    assert.equal(result.valid, false);
    assert.match(result.error || '', /exceeds the 5MB limit/i);
  });

  it('strictly rejects dangerous executable, script, or archive file types', () => {
    const dangerousFiles = [
      { name: 'malware.exe', type: 'application/x-msdownload', size: 1024 },
      { name: 'exploit.sh', type: 'application/x-sh', size: 1024 },
      { name: 'script.bat', type: 'text/plain', size: 1024 },
      { name: 'payload.js', type: 'application/javascript', size: 1024 },
      { name: 'archive.zip', type: 'application/zip', size: 1024 },
      { name: 'backdoor.php', type: 'application/x-php', size: 1024 },
    ];

    for (const f of dangerousFiles) {
      const result = validateKycFile(f);
      assert.equal(result.valid, false, `Failed to reject dangerous file: ${f.name}`);
      assert.match(result.error || '', /prohibited|invalid/i);
    }
  });

  it('rejects empty zero-byte files', () => {
    const emptyFile = {
      name: 'empty.pdf',
      type: 'application/pdf',
      size: 0,
    };
    const result = validateKycFile(emptyFile);
    assert.equal(result.valid, false);
    assert.match(result.error || '', /file is empty/i);
  });
});

describe('5. Menu Item & Pricing Integrity Tests', () => {
  it('sanitizes malicious script and HTML tags from dish names and descriptions', () => {
    const xssPayload = '<script>alert("hacked")</script>Paneer Butter Masala';
    const clean = sanitizeInput(xssPayload);
    assert.equal(clean, 'Paneer Butter Masala');

    const htmlPayload = '<b>Crispy</b> <i>Spring Rolls</i>';
    assert.equal(sanitizeInput(htmlPayload), 'Crispy Spring Rolls');
  });

  it('validates and accepts legitimate dish names with positive prices', () => {
    const result = validateMenuItemInput({
      name: 'Chole Bhature Special',
      price: 120,
    });
    assert.equal(result.valid, true);
    assert.equal(result.sanitizedName, 'Chole Bhature Special');
    assert.equal(result.sanitizedPrice, 120);
  });

  it('strictly rejects negative prices', () => {
    const result = validateMenuItemInput({
      name: 'Free Burger Attack',
      price: -50,
    });
    assert.equal(result.valid, false);
    assert.match(result.error || '', /positive number/i);
  });

  it('rejects non-numeric NaN prices', () => {
    const result = validateMenuItemInput({
      name: 'Invalid Price Dish',
      price: 'abc',
    });
    assert.equal(result.valid, false);
    assert.match(result.error || '', /positive number/i);
  });
});

describe('6. Secrets & Bundle Hygiene Tests', () => {
  it('permits valid anonymous client tokens', () => {
    const anonJwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const anonJwtPayload = Buffer.from(JSON.stringify({ role: 'anon', iss: 'supabase' })).toString('base64');
    const anonToken = `${anonJwtHeader}.${anonJwtPayload}.mockSignature`;

    assert.doesNotThrow(() => assertNoServiceRoleKey(anonToken));
  });

  it('strictly throws security error when a service_role key is detected', () => {
    const srJwtHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const srJwtPayload = Buffer.from(JSON.stringify({ role: 'service_role', iss: 'supabase' })).toString('base64');
    const serviceRoleToken = `${srJwtHeader}.${srJwtPayload}.mockSignature`;

    assert.throws(
      () => assertNoServiceRoleKey(serviceRoleToken),
      /SECURITY VIOLATION.*Service Role Key must NEVER be used on the client/i
    );
  });
});
