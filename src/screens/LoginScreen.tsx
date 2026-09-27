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
  X
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { 
    loginWithPhone, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    isLoading, 
    errorMessage, 
    setActiveScreen, 
    resetPasswordWithOtp,
  } = useOwnerApp();

  useEffect(() => {
    localStorage.setItem('foodfax_has_onboarded', 'true');
  }, []);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<'phone' | 'reset'>('phone');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const fullPhone = `+91${phoneNumber.trim()}`;

  // Handle Login via Password / PIN
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    if (phoneNumber.trim().length < 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    const success = await loginWithPhone(fullPhone, password);
    if (!success) {
      setFormError(errorMessage || 'Invalid mobile number or password');
    }
  };

  // Handle Sending SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setInfoMessage(null);

    if (phoneNumber.trim().length < 10) {
      setFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    const ok = await sendPhoneOtp(fullPhone);
    if (ok) {
      setOtpSent(true);
      setInfoMessage(`OTP sent to ${fullPhone}. (Use 123456 in demo/test mode)`);
    } else {
      setFormError(errorMessage || 'Failed to send OTP. Please try again.');
    }
  };

  // Handle Verify SMS OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setFormError('Please enter the 6-digit verification code');
      return;
    }

    const ok = await verifyPhoneOtp(fullPhone, cleanOtp);
    if (!ok) {
      setFormError(errorMessage || 'Invalid OTP code. Please use 123456 or request new code.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center px-6 py-8 max-w-md mx-auto relative select-none">
      {/* Brand Header */}
      <div className="text-center mb-6">
        {/* Exact Orange Squircle matching Flutter App */}
        <div className="w-[72px] h-[72px] rounded-[22px] bg-[#F97316] flex items-center justify-center mx-auto mb-5 shadow-[0_8px_24px_rgba(249,115,22,0.38)]">
          <Store className="w-9 h-9 text-white stroke-[2.2]" />
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-black text-[#F8FAFC] tracking-tight">
          Partner Login
        </h1>

        {/* Subtitle */}
        <p className="text-[13px] text-[#94A3B8] mt-1.5 max-w-[280px] mx-auto leading-relaxed">
          Enter your registered mobile number to manage your restaurant
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
                }}
                onFocus={() => setIsPhoneFocused(true)}
                onBlur={() => setIsPhoneFocused(false)}
                maxLength={10}
                placeholder="98450 12345"
                className={`w-full bg-[#131B2E] border-2 ${
                  isPhoneFocused || phoneNumber.length > 0 ? 'border-[#F97316]' : 'border-[#23304A]'
                } rounded-[14px] pl-11 pr-4 py-3.5 text-[16px] text-[#F8FAFC] placeholder-[#64748B] outline-none font-semibold tracking-wider transition`}
              />
            </div>
          </div>
        </div>

        {/* Mode Toggle Switch: Password vs OTP */}
        <div className="bg-[#131B2E] border border-[#23304A] rounded-[12px] p-1 grid grid-cols-2 mb-5">
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
        </div>

        {/* Feedback Messages */}
        {formError && (
          <div className="mb-4 p-3 rounded-[12px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <span>{infoMessage}</span>
          </div>
        )}

        {/* OTP Mode Form */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading}
                className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
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
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-11 pr-4 py-3.5 text-base text-white tracking-widest font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify OTP & Enter Dashboard</span>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="text-[13px] text-[#F97316] hover:underline font-semibold"
                  >
                    Resend OTP Code
                  </button>
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#131B2E] border border-[#23304A] focus:border-[#F97316] rounded-[14px] pl-11 pr-11 py-3.5 text-sm text-white placeholder-[#64748B] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-[14px] bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-950/40 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
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
              <h3 className="text-lg font-black text-white">Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 'phone' ? (
              <div className="space-y-4">
                <p className="text-xs text-[#94A3B8]">
                  Enter your registered mobile number to receive a verification code.
                </p>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98450 12345"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (forgotPhone.trim().length < 10) {
                      setForgotError('Enter a valid 10-digit mobile number');
                      return;
                    }
                    setForgotError(null);
                    setForgotStep('reset');
                  }}
                  className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm"
                >
                  Send Verification Code
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-2.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] text-xs font-bold">
                  Reset Code: 123456
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                    New Password / PIN
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-[#0B0F19] border border-[#23304A] focus:border-[#F97316] rounded-xl px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (forgotOtp.trim().length < 4) {
                      setForgotError('Enter valid verification code');
                      return;
                    }
                    if (newPassword.trim().length < 6) {
                      setForgotError('Password must be at least 6 characters');
                      return;
                    }
                    const ok = await resetPasswordWithOtp(`+91${forgotPhone.trim()}`, forgotOtp.trim(), newPassword);
                    if (ok) {
                      setForgotSuccess('Password updated successfully! Please sign in.');
                      setTimeout(() => {
                        setShowForgotModal(false);
                        setPassword(newPassword);
                        setPhoneNumber(forgotPhone);
                        setAuthMode('password');
                      }, 1200);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm"
                >
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
