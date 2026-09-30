/**
 * FoodFax Authentication Security & Anti-Bypass Service
 * 
 * Provides:
 * 1. Cryptographically secure random OTP generation (no predictable backdoors)
 * 2. Strict OTP verification with expiration (5 mins) and attempt limiting (max 3 tries)
 * 3. Brute-force protection & account lockout tracking against credential stuffing
 * 4. Password strength assessment and validation
 * 5. Secure session purging on sign-out
 */

export interface OtpRecord {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong';
  color: string;
  barColor: string;
  feedback: string[];
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds lockout
const EXTENDED_LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes if sustained (> 8 fails)
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_ATTEMPTS = 3;

class AuthSecurityService {
  private activeOtps: Map<string, OtpRecord> = new Map();
  private activeResetOtps: Map<string, OtpRecord> = new Map();

  /**
   * Normalizes a phone number to standard digits-only format for indexing.
   */
  public normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    return digits.slice(-10); // Last 10 digits
  }

  // ==========================================
  // BRUTE-FORCE PROTECTION & RATE LIMITING
  // ==========================================

  private getLockoutStorageKey(phone: string): string {
    return `ff_auth_lockout_${this.normalizePhone(phone)}`;
  }

  public checkLockout(phone: string): LockoutStatus {
    const key = this.getLockoutStorageKey(phone);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };

      const data = JSON.parse(raw);
      const now = Date.now();

      if (data.lockedUntil && data.lockedUntil > now) {
        const remainingSeconds = Math.ceil((data.lockedUntil - now) / 1000);
        return {
          isLocked: true,
          remainingSeconds,
          attemptsCount: data.attempts || 0,
        };
      }

      // If lockout time has passed, reset lock
      if (data.lockedUntil && data.lockedUntil <= now) {
        localStorage.removeItem(key);
        return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
      }

      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsCount: data.attempts || 0,
      };
    } catch (_) {
      return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
    }
  }

  public recordFailedAttempt(phone: string): LockoutStatus {
    const key = this.getLockoutStorageKey(phone);
    try {
      const now = Date.now();
      const current = this.checkLockout(phone);
      const newAttempts = current.attemptsCount + 1;

      let lockedUntil: number | null = null;
      let remainingSeconds = 0;

      if (newAttempts >= 8) {
        // Extended lockout
        lockedUntil = now + EXTENDED_LOCKOUT_DURATION_MS;
        remainingSeconds = Math.ceil(EXTENDED_LOCKOUT_DURATION_MS / 1000);
      } else if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Standard lockout
        lockedUntil = now + LOCKOUT_DURATION_MS;
        remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
      }

      const payload = {
        attempts: newAttempts,
        lastAttempt: now,
        lockedUntil,
      };
      localStorage.setItem(key, JSON.stringify(payload));

      return {
        isLocked: Boolean(lockedUntil),
        remainingSeconds,
        attemptsCount: newAttempts,
      };
    } catch (_) {
      return { isLocked: false, remainingSeconds: 0, attemptsCount: 1 };
    }
  }

  public recordSuccessfulAttempt(phone: string): void {
    const key = this.getLockoutStorageKey(phone);
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }

  // ==========================================
  // CRYPTOGRAPHICALLY SECURE OTP MANAGEMENT
  // ==========================================

  /**
   * Generates a true cryptographically secure 6-digit random code.
   */
  private generateRandom6Digits(): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const codeNumber = 100000 + (array[0] % 900000);
      return codeNumber.toString();
    }
    // Fallback
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generates and stores a new OTP for a specific phone number.
   * Invalidates any previously active OTP for this number.
   */
  public generateSecureOtp(phone: string): { code: string; expiresAt: number } {
    const normalized = this.normalizePhone(phone);
    const code = this.generateRandom6Digits();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    const record: OtpRecord = {
      phone: normalized,
      code,
      expiresAt,
      attempts: 0,
    };

    this.activeOtps.set(normalized, record);
    // Also save in sessionStorage for resilience across page interactions
    try {
      sessionStorage.setItem(`ff_otp_${normalized}`, JSON.stringify(record));
    } catch (_) {}

    return { code, expiresAt };
  }

  /**
   * Verifies an entered OTP code against the active record for this phone.
   * Enforces exact match, expiry, and max 3 attempts limit.
   * Completely eliminates any backdoor codes.
   */
  public verifySecureOtp(phone: string, inputCode: string): { success: boolean; error?: string } {
    const normalized = this.normalizePhone(phone);
    const cleanInput = inputCode.trim();

    if (!cleanInput || cleanInput.length !== 6 || !/^\d{6}$/.test(cleanInput)) {
      return { success: false, error: 'Please enter a valid 6-digit numerical OTP' };
    }

    // Retrieve active record
    let record = this.activeOtps.get(normalized);
    if (!record) {
      try {
        const raw = sessionStorage.getItem(`ff_otp_${normalized}`);
        if (raw) {
          record = JSON.parse(raw);
          if (record) this.activeOtps.set(normalized, record);
        }
      } catch (_) {}
    }

    if (!record) {
      return {
        success: false,
        error: 'No active OTP found for this mobile number. Please request a new code.',
      };
    }

    const now = Date.now();
    if (now > record.expiresAt) {
      this.clearOtp(normalized);
      return {
        success: false,
        error: 'Verification code has expired. Please request a new OTP.',
      };
    }

    // Increment attempts count
    record.attempts += 1;
    this.activeOtps.set(normalized, record);
    try {
      sessionStorage.setItem(`ff_otp_${normalized}`, JSON.stringify(record));
    } catch (_) {}

    if (record.attempts > MAX_OTP_ATTEMPTS) {
      this.clearOtp(normalized);
      return {
        success: false,
        error: 'Too many incorrect attempts. This code is now invalidated. Please request a new OTP.',
      };
    }

    // Strict code comparison - NO BYPASS ALLOWED
    if (record.code !== cleanInput) {
      const remainingAttempts = MAX_OTP_ATTEMPTS - record.attempts;
      return {
        success: false,
        error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
      };
    }

    // Verification successful! Clean up OTP record to prevent replay
    this.clearOtp(normalized);
    return { success: true };
  }

  public clearOtp(normalizedPhone: string): void {
    this.activeOtps.delete(normalizedPhone);
    try {
      sessionStorage.removeItem(`ff_otp_${normalizedPhone}`);
    } catch (_) {}
  }

  // ==========================================
  // PASSWORD RESET OTP MANAGEMENT
  // ==========================================

  public generatePasswordResetOtp(phone: string): { code: string; expiresAt: number } {
    const normalized = this.normalizePhone(phone);
    const code = this.generateRandom6Digits();
    const expiresAt = Date.now() + OTP_EXPIRY_MS;

    const record: OtpRecord = {
      phone: normalized,
      code,
      expiresAt,
      attempts: 0,
    };

    this.activeResetOtps.set(normalized, record);
    try {
      sessionStorage.setItem(`ff_reset_otp_${normalized}`, JSON.stringify(record));
    } catch (_) {}

    return { code, expiresAt };
  }

  public verifyPasswordResetOtp(phone: string, inputCode: string): { success: boolean; error?: string } {
    const normalized = this.normalizePhone(phone);
    const cleanInput = inputCode.trim();

    if (!cleanInput || cleanInput.length !== 6 || !/^\d{6}$/.test(cleanInput)) {
      return { success: false, error: 'Enter a valid 6-digit numerical code' };
    }

    let record = this.activeResetOtps.get(normalized);
    if (!record) {
      try {
        const raw = sessionStorage.getItem(`ff_reset_otp_${normalized}`);
        if (raw) {
          record = JSON.parse(raw);
          if (record) this.activeResetOtps.set(normalized, record);
        }
      } catch (_) {}
    }

    if (!record) {
      return { success: false, error: 'No active reset code found. Request a new one.' };
    }

    if (Date.now() > record.expiresAt) {
      this.activeResetOtps.delete(normalized);
      try {
        sessionStorage.removeItem(`ff_reset_otp_${normalized}`);
      } catch (_) {}
      return { success: false, error: 'Reset code expired. Please request again.' };
    }

    record.attempts += 1;
    if (record.attempts > MAX_OTP_ATTEMPTS) {
      this.activeResetOtps.delete(normalized);
      try {
        sessionStorage.removeItem(`ff_reset_otp_${normalized}`);
      } catch (_) {}
      return { success: false, error: 'Too many incorrect attempts. Reset code invalidated.' };
    }

    if (record.code !== cleanInput) {
      const remaining = MAX_OTP_ATTEMPTS - record.attempts;
      return { success: false, error: `Invalid code. ${remaining} attempt(s) remaining.` };
    }

    // Success, clear reset OTP
    this.activeResetOtps.delete(normalized);
    try {
      sessionStorage.removeItem(`ff_reset_otp_${normalized}`);
    } catch (_) {}
    return { success: true };
  }

  // ==========================================
  // PASSWORD STRENGTH EVALUATOR
  // ==========================================

  public assessPasswordStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        label: 'Very Weak',
        color: 'text-red-400',
        barColor: 'bg-red-500',
        feedback: ['Enter a password of at least 6 characters'],
      };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 6) score += 1;
    else feedback.push('At least 6 characters required');

    if (password.length >= 8) score += 1;

    // Numbers check
    if (/\d/.test(password)) score += 1;
    else feedback.push('Add at least one number');

    // Letters & special chars check
    if (/[a-zA-Z]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Add a special character (e.g. @, #, $)');
    }

    // Trivial passwords penalty
    const trivialPatterns = ['123456', 'password', '111111', '000000', 'qwerty', 'admin'];
    if (trivialPatterns.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('Avoid common dictionary words or sequences');
    }

    const cappedScore = Math.min(Math.max(score, 0), 4);

    if (cappedScore <= 1) {
      return {
        score: cappedScore,
        label: 'Weak',
        color: 'text-red-400',
        barColor: 'bg-red-500',
        feedback,
      };
    } else if (cappedScore === 2 || cappedScore === 3) {
      return {
        score: cappedScore,
        label: 'Fair',
        color: 'text-amber-400',
        barColor: 'bg-amber-500',
        feedback,
      };
    } else {
      return {
        score: cappedScore,
        label: 'Strong',
        color: 'text-emerald-400',
        barColor: 'bg-emerald-500',
        feedback: ['Strong security password'],
      };
    }
  }

  // ==========================================
  // SECURE LOGOUT & PURGE
  // ==========================================

  public purgeAllAuthStorage(): void {
    try {
      localStorage.removeItem('foodfax_owner_profile');
      localStorage.removeItem('foodfax_owner_shop');
      localStorage.removeItem('foodfax_sec_shop_binding_v1');
      sessionStorage.removeItem('foodfax_sec_shop_binding_v1');
      // Clear all temp OTPs
      this.activeOtps.clear();
      this.activeResetOtps.clear();
    } catch (_) {}
  }
}

export const authSecurityService = new AuthSecurityService();
