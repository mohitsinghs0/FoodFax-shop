/**
 * FoodFax Security, Tenant Isolation & Order State Machine Utilities
 * 
 * Enforces:
 * 1. Strict multi-tenant isolation (Merchant A cannot access Merchant B's resources)
 * 2. Sequential order fulfillment state machine (no illegal status skipping)
 * 3. Daily sequential token formatting (#101, #102)
 * 4. KYC document validation (PDF, JPEG, PNG only, max 5MB)
 * 5. Input sanitization (XSS prevention) and pricing constraints (non-negative)
 */

import { OrderStatus } from '../types';

// ==========================================
// 1. ORDER STATE MACHINE
// ==========================================

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['accepted', 'cancelled'] as const,
  accepted: ['preparing', 'cancelled'] as const,
  preparing: ['ready', 'cancelled'] as const,
  ready: ['completed', 'cancelled'] as const,
  completed: [] as const, // Terminal state: fulfillment complete
  cancelled: [] as const, // Terminal state: order closed
};

export interface StateTransitionResult {
  allowed: boolean;
  error?: string;
}

/**
 * Validates whether an order can transition from currentStatus to nextStatus.
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): StateTransitionResult {
  // Idempotent update
  if (currentStatus === nextStatus) {
    return { allowed: true };
  }

  const validNext = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!validNext || !validNext.includes(nextStatus)) {
    return {
      allowed: false,
      error: `Invalid order state transition: cannot jump from '${currentStatus.toUpperCase()}' to '${nextStatus.toUpperCase()}'. Allowed next states: ${
        validNext && validNext.length > 0 ? validNext.map((s) => `'${s.toUpperCase()}'`).join(', ') : 'None (Terminal state)'
      }.`,
    };
  }

  return { allowed: true };
}

// ==========================================
// 2. STRICT TENANT ISOLATION
// ==========================================

/**
 * Validates whether the authenticated merchant owns the target order/shop resource.
 * Throws or returns an error if a merchant attempts to access another shop's data.
 */
export function validateMerchantTenantAccess(
  merchantShopId: string | null | undefined,
  resourceShopId: string | null | undefined
): { allowed: boolean; error?: string } {
  if (!merchantShopId || !merchantShopId.trim()) {
    return { allowed: false, error: 'Unauthorized: Merchant has no active shop session.' };
  }
  if (!resourceShopId || !resourceShopId.trim()) {
    return { allowed: false, error: 'Bad Request: Target resource is missing a shop_id.' };
  }
  if (merchantShopId.trim() !== resourceShopId.trim()) {
    return {
      allowed: false,
      error: `Tenant Isolation Violation: Merchant shop '${merchantShopId}' is not authorized to access resource belonging to shop '${resourceShopId}'.`,
    };
  }
  return { allowed: true };
}

/**
 * Assertion version: throws error if tenant check fails.
 */
export function assertMerchantTenantAccess(
  merchantShopId: string | null | undefined,
  resourceShopId: string | null | undefined
): void {
  const result = validateMerchantTenantAccess(merchantShopId, resourceShopId);
  if (!result.allowed) {
    throw new Error(result.error);
  }
}

// ==========================================
// 3. DAILY SEQUENTIAL TOKEN FORMATTING
// ==========================================

/**
 * Formats token number into the daily sequential format (#101, #102, etc.)
 */
export function formatDailyToken(rawToken: string | number | null | undefined, fallbackId?: string): string {
  if (rawToken !== null && rawToken !== undefined) {
    const str = String(rawToken).trim();
    if (str.length > 0) {
      if (str.startsWith('#')) return str;
      const parsed = parseInt(str, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return `#${parsed}`;
      }
      return `#${str}`;
    }
  }

  if (fallbackId && fallbackId.length > 0) {
    const clean = fallbackId.replace(/\D/g, '');
    if (clean.length >= 3) {
      return `#${clean.slice(-3)}`;
    }
    return `#${fallbackId.slice(-4).toUpperCase()}`;
  }

  return '#101';
}

// ==========================================
// 4. KYC DOCUMENT VALIDATION
// ==========================================

export const ALLOWED_KYC_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_KYC_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

export const MAX_KYC_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface KycValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a KYC file for upload:
 * - MIME type must be PDF, JPEG, or PNG
 * - File extension must match allowed types
 * - Size must be <= 5MB
 * - Disallows executables, scripts, or archive files
 */
export function validateKycFile(file: {
  name?: string;
  type?: string;
  size?: number;
}): KycValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided for KYC verification.' };
  }

  // 1. File size check (Max 5MB)
  if (typeof file.size === 'number') {
    if (file.size <= 0) {
      return { valid: false, error: 'KYC document file is empty.' };
    }
    if (file.size > MAX_KYC_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size exceeds the 5MB limit (current: ${sizeMb}MB). Please upload a compressed document.`,
      };
    }
  }

  // 2. MIME type check
  const mime = (file.type || '').trim().toLowerCase();
  const hasValidMime = (ALLOWED_KYC_MIME_TYPES as readonly string[]).includes(mime);

  // 3. Extension check
  const fileName = (file.name || '').trim().toLowerCase();
  const extMatch = fileName.match(/\.[0-9a-z]+$/i);
  const ext = extMatch ? extMatch[0].toLowerCase() : '';
  const hasValidExt = (ALLOWED_KYC_EXTENSIONS as readonly string[]).includes(ext);

  // Reject prohibited executable / script extensions explicitly
  const dangerousExts = ['.exe', '.bat', '.sh', '.js', '.ts', '.php', '.py', '.html', '.htm', '.zip', '.tar', '.gz'];
  if (dangerousExts.includes(ext)) {
    return {
      valid: false,
      error: `Security Violation: File type '${ext}' is strictly prohibited. Only PDF, JPG, and PNG documents are allowed.`,
    };
  }

  // If MIME is provided, it must be valid. If MIME is empty (e.g. from some OS file pickers), extension must match.
  if (mime && !hasValidMime) {
    return {
      valid: false,
      error: `Invalid file format '${mime}'. Allowed formats: PDF, JPEG, PNG.`,
    };
  }

  if (fileName && !hasValidExt) {
    return {
      valid: false,
      error: `Invalid file extension '${ext}'. Allowed extensions: .pdf, .jpg, .jpeg, .png.`,
    };
  }

  return { valid: true };
}

// ==========================================
// 5. INPUT SANITIZATION & PRICING INTEGRITY
// ==========================================

/**
 * Strips raw HTML and script tags from text inputs to prevent XSS.
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script>...</script>
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validates and sanitizes menu item name and price.
 * Ensures price is a valid positive number (>= 0).
 */
export function validateMenuItemInput(input: {
  name: string;
  price: number | string;
}): { valid: boolean; sanitizedName: string; sanitizedPrice: number; error?: string } {
  const sanitizedName = sanitizeInput(input.name);
  if (!sanitizedName || sanitizedName.length === 0) {
    return {
      valid: false,
      sanitizedName: '',
      sanitizedPrice: 0,
      error: 'Dish name cannot be empty or contain only HTML tags.',
    };
  }

  const numericPrice = typeof input.price === 'number' ? input.price : parseFloat(String(input.price));
  if (isNaN(numericPrice) || numericPrice < 0) {
    return {
      valid: false,
      sanitizedName,
      sanitizedPrice: 0,
      error: 'Price must be a valid positive number (>= 0).',
    };
  }

  return {
    valid: true,
    sanitizedName,
    sanitizedPrice: Math.round(numericPrice * 100) / 100, // 2 decimal precision
  };
}

