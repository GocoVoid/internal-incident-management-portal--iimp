
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword, forgotPassword, login, sendOtp, verifyOtp } from '../services/authService';
import { useAuthContext } from '../context/AuthContext';

const MAX_ATTEMPTS    = 5;
const LOCKOUT_MINUTES = 15;
const LOCKOUT_MS      = LOCKOUT_MINUTES * 60 * 1000;
const OTP_RESEND_SECS = 60;

export const useAuth = () => {
  const navigate               = useNavigate();
  const { handleLoginSuccess } = useAuthContext();

  // Stage
  const [stage, setStage] = useState('LOGIN');

  // Shared state across stages
  const [email,   setEmail]   = useState('');
  const [purpose, setPurpose] = useState('');

  // Stage: LOGIN
  const [loginFields,     setLoginFields]     = useState({ email: '', password: '' });
  const [loginError,      setLoginError]      = useState('');
  const [loginLoading,    setLoginLoading]    = useState(false);
  const [shakeLogin,      setShakeLogin]      = useState(false);
  const [failedAttempts,  setFailedAttempts]  = useState(0);
  const [lockedUntil,     setLockedUntil]     = useState(null);
  const [successBanner,   setSuccessBanner]   = useState('');

  // Stage: CHANGE_PASSWORD
  const [cpFields,  setCpFields]  = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [cpErrors,  setCpErrors]  = useState({});
  const [cpApiError, setCpApiError] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [shakeCp,   setShakeCp]   = useState(false);

  // Stage: OTP
  const [otp,          setOtp]          = useState(['', '', '', '', '', '']);
  const [otpError,     setOtpError]     = useState('');
  const [otpLoading,   setOtpLoading]   = useState(false);
  const [shakeOtp,     setShakeOtp]     = useState(false);
  const [resendTimer,  setResendTimer]  = useState(0);
  const resendIntervalRef = useRef(null);

  // Helpers
  const shake = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  const isLocked = lockedUntil && Date.now() < lockedUntil;
  const getRemainingLockoutMinutes = () =>
    lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 60000)) : 0;

  const startResendTimer = () => {
    setResendTimer(OTP_RESEND_SECS);
    clearInterval(resendIntervalRef.current);
    resendIntervalRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(resendIntervalRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleLoginSubmit = useCallback(async ({ email: em, password }) => {
    if (isLocked) {
      setLoginError(`Account locked. Try again in ${getRemainingLockoutMinutes()} minute(s).`);
      shake(setShakeLogin);
      return;
    }

    setLoginLoading(true);
    setLoginError('');
    setSuccessBanner('');

    try {
      const response = await login(em, password);

      if (response?.firstLogin) {
        setEmail(em);
        setPurpose('NEW_LOGIN');
        setCpFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setCpErrors({});
        setCpApiError('');
        setStage('CHANGE_PASSWORD');
        return;
      }

      const dashRoute = handleLoginSuccess(response);
      setFailedAttempts(0);
      setLockedUntil(null);
      navigate(dashRoute, { replace: true });

    } catch (err) {
      const status = err?.status;
      let msg = '';

      if (status === 401) {
        const next = failedAttempts + 1;
        setFailedAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          const until = Date.now() + LOCKOUT_MS;
          setLockedUntil(until);
          msg = `Account locked after ${MAX_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`;
        } else {
          const rem = MAX_ATTEMPTS - next;
          msg = `Invalid email or password. ${rem} attempt${rem !== 1 ? 's' : ''} remaining.`;
        }
      } else if (status === 403) {
        msg = 'Your account is inactive. Please contact the Admin.';
      } else if (status === 423) {
        msg = `Account locked. Try again in ${LOCKOUT_MINUTES} minutes.`;
      } else if (!navigator.onLine) {
        msg = 'No internet connection. Please check your network.';
      } else {
        msg = err?.message || 'Something went wrong. Please try again.';
      }

      setLoginError(msg);
      shake(setShakeLogin);
    } finally {
      setLoginLoading(false);
    }
  }, [isLocked, failedAttempts, handleLoginSuccess, navigate]);

  const handleForgotPassword = useCallback((em) => {
    setEmail(em);
    setPurpose('FORGOT_PASSWORD');
    setCpFields({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setCpErrors({});
    setCpApiError('');
    setStage('CHANGE_PASSWORD');
  }, []);

  const validateCp = (fields, purposeVal) => {
    const errs = {};
    if (purposeVal === 'NEW_LOGIN' && !fields.oldPassword)
      errs.oldPassword = 'Current password is required.';
    if (!fields.newPassword)
      errs.newPassword = 'New password is required.';
    else if (fields.newPassword.length < 8)
      errs.newPassword = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(fields.newPassword))
      errs.newPassword = 'Must include at least one uppercase letter.';
    else if (!/[0-9]/.test(fields.newPassword))
      errs.newPassword = 'Must include at least one number.';
    else if (purposeVal === 'NEW_LOGIN' && fields.oldPassword === fields.newPassword)
      errs.newPassword = 'New password must differ from the current password.';
    if (!fields.confirmPassword)
      errs.confirmPassword = 'Please confirm your new password.';
    else if (fields.newPassword !== fields.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';
    return errs;
  };

  const[token, setToken] = useState('');

  const handleSendOtp = useCallback(async () => {
    const errs = validateCp(cpFields, purpose);
    setCpErrors(errs);
    if (Object.keys(errs).length) { shake(setShakeCp); return; }

    setCpLoading(true);
    setCpApiError('');

    try {
      const res = await sendOtp(email, purpose);
      setToken(res?.data?.token);
      console.log(res.data.token);
      if (res?.success) {
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        startResendTimer();
        setStage('OTP');
      }
    } catch (err) {
      setCpApiError(err?.message || 'Failed to send OTP. Please try again.');
      shake(setShakeCp);
    } finally {
      setCpLoading(false);
    }
  }, [email, purpose, cpFields]);

  const handleBackToLogin = useCallback(() => {
    setStage('LOGIN');
    setLoginError('');
    setSuccessBanner('');
  }, []);

  const handleVerifyOtp = useCallback(async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setOtpError('Please enter all 6 digits.');
      shake(setShakeOtp);
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      if (purpose=='FORGOT_PASSWORD') {
        await forgotPassword(email, cpFields.newPassword, otpCode, token, purpose);
      }
      else {
        await changePassword(email, cpFields.oldPassword, cpFields.newPassword, otpCode, token, purpose);
      }

      const msg = purpose === 'NEW_LOGIN'
        ? 'Password changed successfully. Please log in with your new password.'
        : 'OTP verified. You may now log in.';

      setStage('LOGIN');
      setLoginFields({ email, password: '' });
      setSuccessBanner(msg);
      setLoginError('');
    } catch (err) {
      const status = err?.status;
      let msg = '';
      if (status === 400 || status === 422)
        msg = 'Invalid or expired OTP. Please try again.';
      else
        msg = err?.message || 'Verification failed. Please try again.';
      setOtpError(msg);
      shake(setShakeOtp);
    } finally {
      setOtpLoading(false);
    }
  }, [email, purpose, otp]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setOtpError('');
    try {
      await sendOtp(email, purpose);
      setOtp(['', '', '', '', '', '']);
      startResendTimer();
    } catch (err) {
      setOtpError(err?.message || 'Failed to resend OTP.');
    }
  }, [email, purpose, resendTimer]);

  const handleBackToCp = useCallback(() => {
    setStage('CHANGE_PASSWORD');
    setOtpError('');
    clearInterval(resendIntervalRef.current);
  }, []);

  return {
    stage,

    loginFields, setLoginFields,
    loginError, loginLoading, shakeLogin,
    isLocked, getRemainingLockoutMinutes,
    successBanner,
    handleLoginSubmit,
    handleForgotPassword,

    cpFields, setCpFields,
    cpErrors, cpApiError,
    cpLoading, shakeCp,
    purpose,
    handleSendOtp,
    handleBackToLogin,

    otp, setOtp,
    otpError, otpLoading, shakeOtp,
    resendTimer,
    handleVerifyOtp,
    handleResendOtp,
    handleBackToCp,
  };
};
