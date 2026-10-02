import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  KeyRound, 
  X,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { authSecurityService, PasswordStrength } from '../services/authSecurityService';
import { loginPasswordSchema, loginOtpSchema } from '../utils/validationSchemas';

export const LoginScreen: React.FC = () => {
  const { 
    loginWithPhone, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    isLoading, 
    errorMessage, 
    setActiveScreen, 
    requestPasswordReset,
    resetPasswordWithOtp,
    generatedOtp,
  } = useOwnerApp();

  useEffect(() => {
    localStorage.setItem('foodfax_has_onboarded', 'true');
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setFormError(errorMessage);
    }
  }, [errorMessage]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Rate Limiting & Cooldown States
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [deliveredSmsCode, setDeliveredSmsCode] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'phone' | 'reset'>('phone');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotSmsCode, setForgotSmsCode] = useState<string | null>(null);

  const fullPhone = `+91${phoneNumber.trim()}`;

  // Check lockout on phone number changes
  useEffect(() => {
    if (phoneNumber.trim().length === 10) {
      const lock = authSecurityService.checkLockout(fullPhone);
      if (lock.isLocked) {
        setLockoutSeconds(lock.remainingSeconds);
      } else {
        setLockoutSeconds(0);
      }
    }
  }, [phoneNumber, fullPhone]);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFormError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Countdown timer for OTP Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Dynamic Password Strength Meter
  const passwordStrength: PasswordStrength = authSecurityService.assessPasswordStrength(password);
  const newPasswordStrength: PasswordStrength = authSecurityService.assessPasswordStrength(newPassword);

  // Handle Login via Password / PIN
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    // Schema Validation
    const validation = loginPasswordSchema.safeParse({ phone: fullPhone, password });
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Please check mobile number and password');
      return;
    }

    const lock = authSecurityService.checkLockout(fullPhone);
    if (lock.isLocked) {
      setLockoutSeconds(lock.remainingSeconds);
      setFormError(`Account temporarily locked for security. Wait ${lock.remainingSeconds}s.`);
      return;
    }

    const result = await loginWithPhone(fullPhone, password);
    const isSuccess = typeof result === 'boolean' ? result : (result as any)?.success;
    const errorDetail = (typeof result === 'object' && (result as any)?.error) || errorMessage;

    if (!isSuccess) {
      // Re-check lockout status
      const updatedLock = authSecurityService.checkLockout(fullPhone);
      if (updatedLock.isLocked) {
        setLockoutSeconds(updatedLock.remainingSeconds);
      }
      setFormError(errorDetail || 'Mobile number is not registered. Please click Register Restaurant below.');
    }
  };

  // Handle Sending SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    if (phoneNumber.trim().length !== 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    const ok = await sendPhoneOtp(fullPhone);
    if (ok) {
      setLockoutSeconds(0);
      setOtpSent(true);
      setResendCooldown(30);
      // Retrieve the generated secure code to display in the SMS notification card
      // In production with real SMS gateway, this arrives on the phone. Here we display realistic simulation.
      const freshRecord = sessionStorage.getItem(`ff_otp_${authSecurityService.normalizePhone(fullPhone)}`);
      let code = generatedOtp;
      if (freshRecord) {
        try {
          const parsed = JSON.parse(freshRecord);
          if (parsed.code) code = parsed.code;
        } catch (_) {}
      }
      setDeliveredSmsCode(code);
      setInfoMessage(`Verification code sent to ${fullPhone}. Valid for 5 minutes.`);
    } else {
      setFormError(errorMessage || `Mobile number ${fullPhone} is not registered yet. Please click Register Restaurant below.`);
    }
  };

  // Handle Verify SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanOtp = otp.trim();
    const validation = loginOtpSchema.safeParse({ phone: fullPhone, otp: cleanOtp });
    if (!validation.success) {
      setFormError(validation.error.issues[0]?.message || 'Please enter the 6-digit verification code');
      return;
    }

    const ok = await verifyPhoneOtp(fullPhone, cleanOtp);
    if (!ok) {
      const updatedLock = authSecurityService.checkLockout(fullPhone);
      if (updatedLock.isLocked) {
        setLockoutSeconds(updatedLock.remainingSeconds);
      }
      setFormError(errorMessage || 'Invalid OTP code. Please enter the correct code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center px-6 py-8 max-w-md mx-auto relative select-none">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-[72px] h-[72px] rounded-[22px] bg-[#F97316] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_24px_rgba(249,115,22,0.38)]">
          <Store className="w-9 h-9 text-white stroke-[2.2]" />
        </div>

        <h1 className="text-[26px] font-black text-[#F8FAFC] tracking-tight">
          Partner Login
        </h1>

        <p className="text-[13px] text-[#94A3B8] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
          Enter your registered mobile number to securely manage your restaurant
        </p>
      </div>

      {/* Main Form */}
      <div>
        {/* Phone Input with Country Code */}
        <div className="mb-5">
          <label className="block text-[12px] font-bold text-[#94A3B8] mb-2">
            Owner Mobile Number
          </label>
          <div className="flex gap-2.5">
            {/* Country Code Container */}
            <div className="bg-[#131B2E] border border-[#23304A] rounded-[14px] px-3.5 py-3.5 flex items-center gap-1.5 text-sm font-bold text-white shrink-0">
              <span className="text-base leading-none">🇮🇳</span>
              <span>+91</span>
            </div>

            {/* Mobile Number Input */}
            <div className="relative flex-1">
              <Smartphone className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneNumber(val);
                  setFormError(null);
                  setDeliveredSmsCode(null);
                }}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                maxLength={10}
                placeholder="98450 12345"
                disabled={lockoutSeconds > 0}
                className={`w-full bg-[#131B2E] border-2 ${
                  isPhoneFocused || phoneNumber.length > 0 ? 'border-[#F97316]' : 'border-[#23304A]'
                } rounded-[14px] pl-11 pr-4 py-3.5 text-[16px] text-[#F8FAFC] placeholder-[#64748B] outline-none font-semibold tracking-wider transition disabled:opacity-50`}
              />
            </div>
          </div>
        </div>

        {/* Security Lockout Banner */}
        {lockoutSeconds > 0 && (
          <div className="mb-5 p-3.5 rounded-[14px] bg-red-500/15 border-2 border-red-500/40 text-red-300 text-xs flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-red-200">Security Lockout Active</p>
                <p className="text-[11px] text-red-300/80">
                  Wait <span className="font-mono font-bold text-white">{lockoutSeconds}s</span> or unlock via Instant SMS OTP.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setFormError(null);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#F97316] hover:bg-orange-600 text-white font-bold text-[11px] whitespace-nowrap shadow transition"
            >
              Use OTP
            </button>
          </div>
        )}

        {/* Mode Toggle Switch: Password vs OTP */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[12px] p-1 grid grid-cols-2 mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setFormError(null);
            }}
            className={`py-2 text-[12px] font-bold rounded-[9px] transition ${
              authMode === 'otp'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Instant SMS OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setFormError(null);
            }}
            className={`py-2 text-[12px] font-bold rounded-[9px] transition ${
              authMode === 'password'
                ? 'bg-[#F97316] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Password / PIN
          </button>
        </div>

        {/* Error Feedback */}
        {formError && lockoutSeconds === 0 && (
          <div className="mb-4 p-3 rounded-[12px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Realistic SMS Delivery Simulation Notification Card */}
        {otpSent && deliveredSmsCode && (
          <div className="mb-4 p-3.5 rounded-[14px] bg-gradient-to-r from-orange-500/15 to-amber-500/10 border border-orange-500/30 shadow-lg shadow-orange-950/20">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-orange-400 text-[11px] font-bold tracking-wide uppercase">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS Notification • Just Now</span>
              </div>
              <span className="text-[10px] text-orange-300/80 font-mono">Expires in 5m</span>
            </div>
            <p className="text-xs text-slate-200 leading-snug">
              FoodFax security verification code: <span className="font-mono font-black text-white text-sm tracking-widest bg-orange-600/40 px-1.5 py-0.5 rounded">{deliveredSmsCode}</span>
            </p>
            <button
              type="button"
              onClick={() => {
                setOtp(deliveredSmsCode);
                setFormError(null);
              }}
              className="mt-2.5 w-full py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-[11px] font-bold text-orange-300 flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Auto-Fill Code ({deliveredSmsCode})</span>
            </button>
          </div>
        )}

        {/* OTP Mode Form */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading || lockoutSeconds > 0}
                className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Secure OTP...</span>
                  </>
                ) : (
                  <span>Send SMS OTP Code</span>
                )}
              </button>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#94A3B8] mb-2">
                    Enter 6-Digit SMS Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(clean);
                        setFormError(null);
                      }}
                      placeholder="••••••"
                      disabled={lockoutSeconds > 0}
                      className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-11 pr-4 py-3.5 text-base text-white tracking-widest font-mono font-bold outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6 || lockoutSeconds > 0}
                  className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify & Enter Dashboard</span>
                  )}
                </button>

                <div className="text-center pt-1">
                  {resendCooldown > 0 ? (
                    <span className="text-[12px] text-slate-400 font-medium">
                      Resend code in <span className="font-mono text-orange-400 font-bold">{resendCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading || lockoutSeconds > 0}
                      className="text-[13px] text-[#F97316] hover:underline font-semibold disabled:opacity-50"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Password Mode Form */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[12px] font-bold text-[#94A3B8]">
                  Owner Security Password / PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPhone(phoneNumber);
                    setShowForgotModal(true);
                    setForgotStep('phone');
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotSmsCode(null);
                  }}
                  className="text-[12px] text-[#F97316] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="••••••••"
                  disabled={lockoutSeconds > 0}
                  className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-11 pr-11 py-3.5 text-sm text-white placeholder-[#64748B] outline-none transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator when typing */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password strength:</span>
                    <span className={`font-bold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength.score >= step ? passwordStrength.barColor : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || lockoutSeconds > 0}
              className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        )}

        {/* Bottom Registration Link */}
        <div className="text-center mt-7">
          <span className="text-[13px] text-[#94A3B8]">
            New restaurant partner?{' '}
          </span>
          <button
            type="button"
            onClick={() => setActiveScreen('register')}
            className="text-[13px] text-[#F97316] font-extrabold hover:underline"
          >
            Register Restaurant
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#131B2E] border border-[#23304A] rounded-t-[24px] sm:rounded-[24px] p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-black text-white">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[#94A3B8] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Simulated SMS banner for Reset Code */}
            {forgotSmsCode && (
              <div className="mb-3 p-3 rounded-xl bg-orange-500/15 border border-orange-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-orange-400 uppercase">SMS Reset Code Delivered</span>
                  <span className="text-[10px] text-orange-300 font-mono">Expires in 5m</span>
                </div>
                <p className="text-xs text-slate-200">
                  Password reset code: <span className="font-mono font-bold text-white bg-orange-600/40 px-1.5 py-0.5 rounded text-sm">{forgotSmsCode}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setForgotOtp(forgotSmsCode)}
                  className="mt-2 w-full py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 text-[11px] font-bold text-orange-300 transition"
                >
                  Auto-Fill Reset Code ({forgotSmsCode})
                </button>
              </div>
            )}

            {forgotStep === 'phone' ? (
              <div className="space-y-4">
                <p className="text-xs text-[#94A3B8]">
                  Enter your registered 10-digit mobile number to receive a secure password reset code.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    Registered Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="bg-[#0B0F19] border border-[#23304A] rounded-xl px-3 py-3 text-xs font-bold text-white shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98450 12345"
                      className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (forgotPhone.trim().length !== 10) {
                      setForgotError('Enter a valid 10-digit Indian mobile number');
                      return;
                    }
                    setForgotError(null);
                    const res = await requestPasswordReset(`+91${forgotPhone.trim()}`);
                    if (res.success && res.otp) {
                      setForgotSmsCode(res.otp);
                      setForgotStep('reset');
                    } else {
                      setForgotError(res.message || 'Mobile number not found.');
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm transition"
                >
                  Send Reset Code
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white font-mono font-bold tracking-widest outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    New Security Password / PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl pl-4 pr-10 py-3 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Strength:</span>
                      <span className={`font-bold ${newPasswordStrength.color}`}>{newPasswordStrength.label}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (forgotOtp.trim().length !== 6) {
                      setForgotError('Enter the complete 6-digit verification code');
                      return;
                    }
                    if (newPassword.trim().length < 6) {
                      setForgotError('Password must be at least 6 characters');
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setForgotError('Passwords do not match');
                      return;
                    }
                    const ok = await resetPasswordWithOtp(`+91${forgotPhone.trim()}`, forgotOtp.trim(), newPassword);
                    if (ok) {
                      setForgotSuccess('Password updated successfully! Please sign in with your new password.');
                      setTimeout(() => {
                        setShowForgotModal(false);
                        setPassword(newPassword);
                        setPhoneNumber(forgotPhone);
                        setAuthMode('password');
                      }, 1500);
                    } else {
                      setForgotError(errorMessage || 'Failed to update password. Code may be invalid or expired.');
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm transition"
                >
                  Save New Password & Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
