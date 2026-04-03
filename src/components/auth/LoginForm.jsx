import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import pratitiLogo from '../../assets/pratiti_logo.png'

const EyeIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);
const AlertIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const CheckCircleIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const ArrowLeftIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const ShieldIcon = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const PetalSpinner = ({ size = 20 }) => (
  <img src={pratitiLogo} alt="Pratiti Logo" width={20} height={20} />
);

// Helper Functions
const validateEmail = (v) => {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
  return '';
};
const validatePassword = (v) => {
  if (!v) return 'Password is required.';
  if (v.length < 6) return 'Password must be at least 6 characters.';
  return '';
};

const inputBase =
  'w-full pl-10 pr-10 py-3 rounded-xl border bg-white text-sm text-gray-900 ' +
  'placeholder-gray-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-0';
const inputNormal = `${inputBase} border-gray-200 focus:border-indigo-500 focus:ring-indigo-100`;
const inputError  = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50`;

const PasswordInput = ({ id, name, value, onChange, onBlur, disabled, placeholder, autoComplete, hasError }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        id={id} name={name} type={show ? 'text' : 'password'}
        value={value} onChange={onChange} onBlur={onBlur}
        disabled={disabled} placeholder={placeholder}
        autoComplete={autoComplete}
        className={hasError ? inputError : inputNormal}
      />
      <button type="button" tabIndex={-1}
        onClick={() => setShow(p => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
        {show ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
      </button>
    </div>
  );
};

const FieldError = ({ msg }) => msg
  ? <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 animate-fade-in">
      <AlertIcon className="w-3 h-3 shrink-0" />{msg}
    </p>
  : null;

const PrimaryBtn = ({ loading, disabled, loadingText, children, onClick, type = 'submit' }) => (
  <button type={type} onClick={onClick} disabled={loading || disabled}
    className={
      'w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl text-sm font-medium text-white ' +
      'transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ' +
      ((loading || disabled)
        ? 'bg-indigo-400 cursor-not-allowed opacity-70'
        : 'bg-indigo-700 hover:bg-indigo-800 active:scale-[0.98]')
    }>
    {loading ? <><PetalSpinner /><span>{loadingText}</span></> : children}
  </button>
);

// Login Form
const LoginStage = ({ auth }) => {
  const {
    loginFields, setLoginFields,
    loginError, loginLoading, shakeLogin,
    isLocked, getRemainingLockoutMinutes,
    successBanner,
    handleLoginSubmit, handleForgotPassword,
  } = auth;

  const [touched, setTouched] = useState({ email: false, password: false });

  const fieldErrors = {
    email:    touched.email    ? validateEmail(loginFields.email)       : '',
    password: touched.password ? validatePassword(loginFields.password) : '',
  };
  const hasFieldError = Object.values(fieldErrors).some(Boolean);

  const onChange = (e) => setLoginFields(p => ({ ...p, [e.target.name]: e.target.value }));
  const onBlur   = (e) => setTouched(p => ({ ...p, [e.target.name]: true }));

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (validateEmail(loginFields.email) || validatePassword(loginFields.password)) return;
    handleLoginSubmit(loginFields);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  };

  const onForgot = () => {
    const emailErr = validateEmail(loginFields.email);
    if (emailErr) {
      setTouched(p => ({ ...p, email: true }));
      return;
    }
    handleForgotPassword(loginFields.email);
  };

  return (
    <form onSubmit={onSubmit} noValidate className={shakeLogin ? 'animate-shake' : ''}>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight animate-slide-up">
          Good {getGreeting()} !
        </h2>
        <p className="mt-1 text-sm text-gray-500 animate-slide-up animate-slide-up-delay-1">
          Sign in with your corporate credentials to continue.
        </p>
      </div>
      <div className="mb-7 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 animate-slide-up animate-slide-up-delay-2" />

      {successBanner && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 animate-fade-in">
          <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700 leading-relaxed">{successBanner}</p>
        </div>
      )}

      {(loginError || isLocked) && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
          <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">
            {isLocked ? `Account locked. Try again in ${getRemainingLockoutMinutes()} minute(s).` : loginError}
          </p>
        </div>
      )}

      <div className="mb-4 animate-slide-up animate-slide-up-delay-3">
        <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide">Email address</label>
        <div className="relative">
          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            id="email" name="email" type="email" autoComplete="email" autoFocus
            placeholder="you@company.com"
            value={loginFields.email} onChange={onChange} onBlur={onBlur}
            disabled={loginLoading || isLocked}
            className={`${fieldErrors.email ? inputError : inputNormal} pr-4`}
          />
        </div>
        <FieldError msg={fieldErrors.email} />
      </div>

      <div className="mb-2 animate-slide-up animate-slide-up-delay-4">
        <label htmlFor="password" className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide">Password</label>
        <PasswordInput
          id="password" name="password"
          value={loginFields.password} onChange={onChange} onBlur={onBlur}
          disabled={loginLoading || isLocked}
          placeholder="Enter your password"
          autoComplete="current-password"
          hasError={!!fieldErrors.password}
        />
        <FieldError msg={fieldErrors.password} />
      </div>

      <div className="mb-6 flex justify-end animate-slide-up animate-slide-up-delay-4">
        <button type="button" onClick={onForgot}
          className="text-xs text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
          Forgot password?
        </button>
      </div>

      <div className="animate-slide-up animate-slide-up-delay-5">
        <PrimaryBtn loading={loginLoading} disabled={isLocked || hasFieldError} loadingText="Signing in…">
          {isLocked ? 'Account Locked' : 'Sign in'}
        </PrimaryBtn>
      </div>

      <p className="mt-5 text-center text-xs text-gray-400 animate-slide-up animate-slide-up-delay-5">
        Having trouble?{' '}
        <a href="mailto:support@pratiti.com" className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors">
          Contact IT Support
        </a>
      </p>
    </form>
  );
};

// Change Password Form
const ChangePasswordStage = ({ auth }) => {
  const {
    cpFields, setCpFields,
    cpErrors, cpApiError,
    cpLoading, shakeCp,
    purpose,
    handleSendOtp, handleBackToLogin,
  } = auth;

  const isNewLogin     = purpose === 'NEW_LOGIN';
  const isForgotPassword = purpose === 'FORGOT_PASSWORD';

  const onChange = (e) => setCpFields(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className={shakeCp ? 'animate-shake' : ''}>

      <div className="mb-6 animate-slide-up">
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {isNewLogin ? 'Set your password' : 'Reset your password'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {isNewLogin
            ? 'Create a new password to secure your account.'
            : 'Enter your new password and verify with OTP.'}
        </p>
      </div>

      <div className="mb-5 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 animate-slide-up" />

      {cpApiError && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
          <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">{cpApiError}</p>
        </div>
      )}

      <div className="space-y-4">

        {isNewLogin && (
          <div className="animate-slide-up animate-slide-up-delay-2">
            <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide">
              Temporary password
            </label>
            <PasswordInput
              name="oldPassword" value={cpFields.oldPassword} onChange={onChange}
              placeholder="Enter your temporary password"
              autoComplete="current-password"
              hasError={!!cpErrors.oldPassword}
            />
            <FieldError msg={cpErrors.oldPassword} />
          </div>
        )}

        <div className="animate-slide-up animate-slide-up-delay-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide">New password</label>
          <PasswordInput
            name="newPassword" value={cpFields.newPassword} onChange={onChange}
            placeholder="Create a strong password"
            autoComplete="new-password"
            hasError={!!cpErrors.newPassword}
          />
          <FieldError msg={cpErrors.newPassword} />
        </div>

        <div className="animate-slide-up animate-slide-up-delay-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5 tracking-wide">Confirm new password</label>
          <PasswordInput
            name="confirmPassword" value={cpFields.confirmPassword} onChange={onChange}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            hasError={!!cpErrors.confirmPassword}
          />
          <FieldError msg={cpErrors.confirmPassword} />
          {cpFields.newPassword===cpFields.confirmPassword && cpFields.newPassword!=='' && !cpErrors.confirmPassword && (
            <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1 animate-fade-in">
              <CheckCircleIcon className="w-3.5 h-3.5" /> Passwords match
            </p>
          )}
        </div>

        <div className="pt-1 animate-slide-up animate-slide-up-delay-5">
          <PrimaryBtn loading={cpLoading} loadingText="Sending OTP…" type="button" onClick={handleSendOtp}>
            <ShieldIcon className="w-4 h-4" />
            <span>Send OTP</span>
          </PrimaryBtn>
        </div>

        <button type="button" onClick={handleBackToLogin}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors animate-slide-up animate-slide-up-delay-5">
          <ArrowLeftIcon className="w-4 h-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

// OTP Overlay
const OtpStage = ({ auth }) => {
  const {
    otp, setOtp,
    otpError, otpLoading, shakeOtp,
    resendTimer,
    purpose,
    handleVerifyOtp, handleResendOtp, handleBackToCp,
  } = auth;

  const inputRefs = useRef([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
  };

  const allFilled = otp.every(d => d !== '');

  return (
    <div className={`relative ${shakeOtp ? 'animate-shake' : ''}`}>

      <div className="mb-6 animate-slide-up">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#eeeef8,#d6f0f8)' }}>
          <ShieldIcon className="w-6 h-6 text-indigo-700" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Enter OTP</h2>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          A 6-digit code was sent to your registered email.
          {purpose === 'NEW_LOGIN' ? ' Enter it to confirm your password change.' : ' Enter it to verify your identity.'}
        </p>
      </div>

      <div className="mb-6 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-cyan-200 animate-slide-up" />

      {otpError && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-fade-in">
          <AlertIcon className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">{otpError}</p>
        </div>
      )}

      <div className="flex gap-2.5 justify-between mb-6 animate-slide-up animate-slide-up-delay-2"
        onPaste={handleOtpPaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleOtpKeyDown(i, e)}
            disabled={otpLoading}
            className={
              'w-full aspect-square text-center text-lg font-semibold rounded-xl border-2 ' +
              'bg-white outline-none transition-all duration-200 ' +
              (otpError
                ? 'border-red-400 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : digit
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50'
                  : 'border-gray-200 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100')
            }
          />
        ))}
      </div>

      <div className="mb-3 animate-slide-up animate-slide-up-delay-3">
        <PrimaryBtn
          loading={otpLoading} disabled={!allFilled}
          loadingText="Verifying…" type="button"
          onClick={handleVerifyOtp}>
          Verify OTP
        </PrimaryBtn>
      </div>

      <p className="text-center text-xs text-gray-400 mb-3 animate-slide-up animate-slide-up-delay-4">
        Didn't receive the code?{' '}
        {resendTimer > 0
          ? <span className="text-gray-400">Resend in {resendTimer}s</span>
          : <button type="button" onClick={handleResendOtp}
              className="text-cyan-600 hover:text-cyan-700 hover:underline transition-colors font-medium">
              Resend OTP
            </button>
        }
      </p>

      <button type="button" onClick={handleBackToCp}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors animate-slide-up animate-slide-up-delay-4">
        <ArrowLeftIcon className="w-4 h-4" />
        Back
      </button>
    </div>
  );
};

const LoginForm = () => {
  const auth = useAuth();

  return (
    <div>
      {auth.stage === 'LOGIN'           && <LoginStage          auth={auth} />}
      {auth.stage === 'CHANGE_PASSWORD' && <ChangePasswordStage auth={auth} />}
      {auth.stage === 'OTP'             && <OtpStage            auth={auth} />}
    </div>
  );
};

export default LoginForm;
