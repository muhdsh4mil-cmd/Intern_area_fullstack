import React, { useState, useEffect, useRef } from "react";
import { requestPasswordReset, verifyResetOTP } from "../api/authAPI";

// ── OTP digit input box component ────────────────────────────────────────────
function OTPInput({ value, onChange }) {
  const digits = 6;
  const inputsRef = useRef([]);
  const parts = value.split("").concat(Array(digits).fill("")).slice(0, digits);

  const handleKey = (e, idx) => {
    if (e.key === "Backspace") {
      if (parts[idx] === "" && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
      const next = [...parts];
      next[idx] = "";
      onChange(next.join(""));
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...parts];
    next[idx] = val;
    onChange(next.join(""));
    if (val && idx < digits - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, digits);
    onChange(pasted.padEnd(digits, "").slice(0, digits));
    const nextIdx = Math.min(pasted.length, digits - 1);
    inputsRef.current[nextIdx]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center">
      {parts.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKey(e, idx)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-xl font-bold font-mono text-white bg-white/5 border-2 rounded-xl outline-none transition-all duration-200"
          style={{
            borderColor: digit ? "#008BDC" : "rgba(255,255,255,0.12)",
            boxShadow: digit ? "0 0 0 3px rgba(0,139,220,0.15)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── Countdown timer hook ──────────────────────────────────────────────────────
function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  const start = (s = seconds) => {
    setRemaining(s);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return { remaining, display: `${mm}:${ss}`, start };
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ForgotPassword({ setView, onOpenModal }) {
  // step 1 = email entry, step 2 = OTP entry, step 3 = success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null); // { newPassword, deliveredTo }
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const { remaining, display: timerDisplay, start: startTimer } = useCountdown(600);

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email: email.trim() });
      // Mask the email returned from server for display
      setMaskedEmail(result.email?.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "•") + c) || email);
      setStep(2);
      startTimer(600);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    if (otp.length < 6) return;
    setError("");
    setLoading(true);
    try {
      const result = await verifyResetOTP({ email: email.trim(), otp });
      setSuccess({ newPassword: result.newPassword, deliveredTo: result.deliveredTo });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (success?.newPassword) {
      navigator.clipboard.writeText(success.newPassword).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResendOTP = async () => {
    if (remaining > 0) return;
    setError("");
    setOtp("");
    setLoading(true);
    try {
      const result = await requestPasswordReset({ email: email.trim() });
      setMaskedEmail(result.email?.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + b.replace(/./g, "•") + c) || email);
      startTimer(600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-navy-900 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => setView("landing")}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </button>

      <div className="w-full max-w-md animate-scale-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>

          {/* Step titles */}
          {step === 1 && (
            <>
              <h1 className="font-outfit font-extrabold text-2xl text-white tracking-tight">Forgot Password?</h1>
              <p className="text-slate-400 text-sm mt-1.5">Enter your email and we'll send a verification code</p>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="font-outfit font-extrabold text-2xl text-white tracking-tight">Check Your Gmail</h1>
              <p className="text-slate-400 text-sm mt-1.5">
                We sent a 6-digit code to <span className="text-primary font-bold">{maskedEmail}</span>
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <h1 className="font-outfit font-extrabold text-2xl text-white tracking-tight">Password Reset!</h1>
              <p className="text-slate-400 text-sm mt-1.5">Your new password has been sent to your Gmail</p>
            </>
          )}
        </div>

        {/* ── Step progress indicator ── */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                step > s ? "bg-emerald-500 text-white" :
                step === s ? "bg-primary text-white ring-4 ring-primary/20" :
                "bg-white/10 text-slate-500"
              }`}>
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-10 rounded-full transition-all duration-500 ${step > s ? "bg-emerald-500" : "bg-white/10"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* ══ STEP 1: Email Entry ══ */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              {/* Info banner */}
              <div className="flex items-start gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3.5">
                <svg className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A <span className="text-primary font-bold">6-digit verification code</span> will be sent to your Gmail. The code expires in <span className="text-primary font-bold">10 minutes</span> and this is limited to <span className="text-primary font-bold">once per day</span>.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-outfit">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="forgot-email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-primary/60 focus:bg-white/8 transition-all"
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
              </div>

              {error && <ErrorBanner message={error} />}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                id="send-otp-btn"
                className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send Verification Code
                  </>
                )}
              </button>
            </form>
          )}

          {/* ══ STEP 2: OTP Entry ══ */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Timer */}
              <div className="flex items-center justify-between bg-slate-900/50 border border-white/8 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-slate-400 font-semibold">Code expires in</span>
                </div>
                <span className={`text-sm font-bold font-mono tabular-nums ${remaining < 60 ? "text-red-400" : "text-amber-400"}`}>
                  {timerDisplay}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 text-center font-outfit">
                  Enter 6-digit Code
                </p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>

              {error && <ErrorBanner message={error} />}

              {remaining === 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-300 text-center font-semibold animate-fade-in">
                  Code expired. Please request a new one.
                </div>
              )}

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6 || remaining === 0}
                id="verify-otp-btn"
                className="w-full py-3.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Spinner /> : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Verify & Reset Password
                  </>
                )}
              </button>

              <div className="text-center space-y-2">
                <p className="text-xs text-slate-500">Didn't receive the email?</p>
                <button
                  onClick={handleResendOTP}
                  disabled={remaining > 0 || loading}
                  className={`text-xs font-bold transition-colors ${remaining > 0 ? "text-slate-600 cursor-not-allowed" : "text-primary hover:text-primary-light"}`}
                >
                  {remaining > 0 ? `Resend available in ${timerDisplay}` : "Resend Code"}
                </button>
              </div>

              <button
                onClick={() => { setStep(1); setOtp(""); setError(""); }}
                className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
              >
                ← Change email address
              </button>
            </div>
          )}

          {/* ══ STEP 3: Success ══ */}
          {step === 3 && success && (
            <div className="space-y-5 animate-fade-in">
              {/* Success icon */}
              <div className="flex flex-col items-center text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-3 shadow-inner">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  New password emailed to
                  <span className="block text-primary font-bold text-sm mt-0.5">{success.deliveredTo}</span>
                </p>
              </div>

              {/* Password reveal card */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-outfit">Your New Temporary Password</span>
                  <button
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-xs text-primary hover:text-primary-light font-bold transition-colors flex items-center gap-1"
                  >
                    {showPassword ? "Hide" : "Reveal"}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white tracking-[0.2em] overflow-hidden text-center">
                    {showPassword ? success.newPassword : "••••••••••"}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    title="Copy to clipboard"
                    className={`flex-shrink-0 w-10 h-10 border rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                      copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-primary/15 hover:bg-primary/25 border-primary/30 text-primary"
                    }`}
                  >
                    {copied ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-[11px] text-amber-400/80">Sign in with this password, then update it from Profile Settings.</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setView("landing");
                  setTimeout(() => onOpenModal && onOpenModal("login"), 100);
                }}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl shadow-lg shadow-primary/25 transition-all"
              >
                Sign In with New Password
              </button>
            </div>
          )}
        </div>

        {/* Footer links (steps 1 & 2 only) */}
        {step < 3 && (
          <div className="mt-5 text-center space-y-1.5">
            <p className="text-xs text-slate-500">
              Remembered your password?{" "}
              <button
                onClick={() => {
                  setView("landing");
                  setTimeout(() => onOpenModal && onOpenModal("login"), 100);
                }}
                className="text-primary hover:text-primary-light font-bold transition-colors"
              >
                Sign in
              </button>
            </p>
            <p className="text-xs text-slate-500">
              New to InternArea?{" "}
              <button
                onClick={() => {
                  setView("landing");
                  setTimeout(() => onOpenModal && onOpenModal("register"), 100);
                }}
                className="text-primary hover:text-primary-light font-bold transition-colors"
              >
                Create a free account
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small reusable sub-components ─────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
      <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className="text-xs text-red-300 font-semibold leading-relaxed">{message}</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
