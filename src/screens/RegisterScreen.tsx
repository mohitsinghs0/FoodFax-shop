import React, { useState, useEffect } from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  Store, 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { registerSchema } from '../utils/validationSchemas';
import { authSecurityService } from '../services/authSecurityService';

export const RegisterScreen: React.FC = () => {
  const { registerWithPhone, isLoading, errorMessage, setActiveScreen } = useOwnerApp();

  useEffect(() => {
    localStorage.setItem('foodfax_has_onboarded', 'true');
  }, []);

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fullPhone = `${countryCode}${phoneNumber.trim()}`;

  // Dynamic Password Security Assessment
  const strength = authSecurityService.assessPasswordStrength(password);
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecialOrLong = /[^a-zA-Z0-9]/.test(password) || password.length >= 8;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    // Strict Zod Schema Validation
    const validationResult = registerSchema.safeParse({
      fullName: fullName.trim(),
      phone: fullPhone,
      password,
      confirmPassword,
    });

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0]?.toString() || 'general';
        errors[field] = issue.message;
      });
      setFieldErrors(errors);
      if (errors['general']) {
        setGeneralError(errors['general']);
      }
      return;
    }

    await registerWithPhone({
      phone: fullPhone,
      password,
      fullName: fullName.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col justify-center px-6 py-8 max-w-md mx-auto select-none">
      {/* Back Button */}
      <button
        onClick={() => setActiveScreen('login')}
        className="self-start mb-4 p-2 -ml-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#131B2E] transition flex items-center gap-1.5 text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      {/* Brand Header */}
      <div className="mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#F97316] flex items-center justify-center mb-3.5 shadow-lg shadow-orange-950/40">
          <Store className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Register Restaurant</h2>
        <p className="text-[#94A3B8] text-xs mt-1">
          Create an owner account using your verified mobile number to list your restaurant and manage live orders
        </p>
      </div>

      {/* General Error Banner */}
      {(errorMessage || generalError) && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
            Owner Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors['fullName']) {
                  setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                }
              }}
              placeholder="e.g. Vikram Malhotra"
              className={`w-full bg-[#131B2E] border ${
                fieldErrors['fullName'] ? 'border-red-500' : 'border-[#23304A] focus:border-[#F97316]'
              } rounded-xl pl-10 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition font-medium`}
              required
            />
          </div>
          {fieldErrors['fullName'] && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['fullName']}
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
            Owner Mobile Number
          </label>
          <div className="flex gap-2">
            <div className="bg-[#131B2E] border border-[#23304A] rounded-xl px-3 py-3 flex items-center gap-1.5 text-xs font-bold text-white shrink-0">
              <span>🇮🇳</span>
              <span>{countryCode}</span>
            </div>
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (fieldErrors['phone']) {
                    setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                maxLength={10}
                placeholder="98450 12345"
                className={`w-full bg-[#131B2E] border ${
                  fieldErrors['phone'] ? 'border-red-500' : 'border-[#23304A] focus:border-[#F97316]'
                } rounded-xl pl-10 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition tracking-wide font-medium`}
                required
              />
            </div>
          </div>
          {fieldErrors['phone'] ? (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['phone']}
            </p>
          ) : (
            <p className="text-[10px] text-[#64748B] mt-1">Must be a valid 10-digit Indian mobile number</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
            Security Password / PIN
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors['password']) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder="Min. 6 characters"
              className={`w-full bg-[#131B2E] border ${
                fieldErrors['password'] ? 'border-red-500' : 'border-[#23304A] focus:border-[#F97316]'
              } rounded-xl pl-10 pr-10 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition font-medium`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Visual Password Strength Indicator (Meter) */}
          {password.length > 0 && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#0B0F19] border border-[#23304A] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                  <span>Password Security</span>
                </span>
                <span className={`font-bold ${strength.color} tracking-wide`}>
                  {strength.label}
                </span>
              </div>

              {/* Segmented Meter Bar */}
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map((step) => {
                  let activeClass = 'bg-slate-800';
                  if (strength.score >= step) {
                    if (strength.score === 1) activeClass = 'bg-red-500';
                    else if (strength.score === 2) activeClass = 'bg-orange-500';
                    else if (strength.score === 3) activeClass = 'bg-amber-400';
                    else activeClass = 'bg-emerald-400';
                  }
                  return (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${activeClass}`}
                    />
                  );
                })}
              </div>

              {/* Requirement Criteria Badges */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
                <div className={`flex items-center gap-1.5 text-[11px] ${hasMinLength ? 'text-emerald-400 font-medium' : 'text-[#64748B]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${hasMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>6+ characters</span>
                </div>

                <div className={`flex items-center gap-1.5 text-[11px] ${hasNumber ? 'text-emerald-400 font-medium' : 'text-[#64748B]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${hasNumber ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Contains number</span>
                </div>

                <div className={`flex items-center gap-1.5 text-[11px] ${hasLetter ? 'text-emerald-400 font-medium' : 'text-[#64748B]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${hasLetter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Contains letter</span>
                </div>

                <div className={`flex items-center gap-1.5 text-[11px] ${hasSpecialOrLong ? 'text-emerald-400 font-medium' : 'text-[#64748B]'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${hasSpecialOrLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Symbol or 8+ chars</span>
                </div>
              </div>
            </div>
          )}

          {fieldErrors['password'] && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['password']}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
            Confirm Password / PIN
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors['confirmPassword']) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder="Re-enter password"
              className={`w-full bg-[#131B2E] border ${
                fieldErrors['confirmPassword'] ? 'border-red-500' : 'border-[#23304A] focus:border-[#F97316]'
              } rounded-xl pl-10 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] outline-none transition font-medium`}
              required
            />
          </div>
          {passwordsMatch && (
            <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Passwords match</span>
            </p>
          )}
          {passwordsMismatch && (
            <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Passwords do not match yet</span>
            </p>
          )}
          {fieldErrors['confirmPassword'] && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors['confirmPassword']}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-950/40 transition disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Owner Account...</span>
            </>
          ) : (
            <span>Create Account & Setup Shop</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 text-center text-xs text-[#94A3B8]">
        Already have a shop account?{' '}
        <button
          onClick={() => setActiveScreen('login')}
          className="text-[#F97316] font-bold hover:underline"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};
