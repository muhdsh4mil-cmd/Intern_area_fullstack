const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const sendEmail = require("../config/email");

// @desc    Request OTP to verify before switching to French language
// @route   POST /api/language/request-french-otp
// @access  Private
const requestFrenchOTP = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  user.langOTP = otp;
  user.langOTPExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  // Build email content
  const subject = "🇫🇷 InternArea — Vérification pour activer le Français";
  const text = `Bonjour ${user.name},\n\nVotre code de vérification pour activer la langue française sur InternArea est: ${otp}\n\nCe code est valable 5 minutes. Ne le partagez avec personne.\n\n— L'équipe InternArea`;
  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#002395,#ED2939);padding:32px 32px 24px;text-align:center">
        <div style="font-size:40px;margin-bottom:8px">🇫🇷</div>
        <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">InternArea</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Vérification — Activation du Français</p>
      </div>
      <div style="padding:32px">
        <p style="color:#334155;font-size:15px;margin:0 0 8px">Bonjour <strong>${user.name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 28px;">
          Vous avez demandé à activer la langue <strong>française</strong> sur InternArea. Pour des raisons de sécurité, veuillez entrer le code à usage unique (OTP) ci-dessous. Ce code est valable pendant <strong>5 minutes</strong>.
        </p>
        <div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
          <p style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-weight:700">Code de vérification</p>
          <span style="color:#60a5fa;font-size:40px;font-weight:900;letter-spacing:10px;font-family:monospace">${otp}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">Si vous n'avez pas fait cette demande, ignorez cet e-mail en toute sécurité.</p>
      </div>
      <div style="background:#f1f5f9;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0">
        <p style="color:#94a3b8;font-size:11px;margin:0">© 2026 InternArea. Tous droits réservés.</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({ to: user.email, subject, html, text });
  } catch (emailErr) {
    user.langOTP = null;
    user.langOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Failed to send verification email. Please try again later.");
  }

  res.json({
    message: "Verification OTP sent to your registered email address.",
    email: user.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length)),
  });
});

// @desc    Verify OTP and activate French language for the user
// @route   POST /api/language/verify-french-otp
// @access  Private
const verifyFrenchOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  if (!otp) {
    res.status(400);
    throw new Error("Please enter the verification code.");
  }

  const user = await User.findById(req.user._id);

  if (!user || !user.langOTP || !user.langOTPExpires) {
    res.status(400);
    throw new Error("No active verification request found. Please request a new code.");
  }

  // Check expiry
  if (new Date() > new Date(user.langOTPExpires)) {
    user.langOTP = null;
    user.langOTPExpires = null;
    await user.save({ validateBeforeSave: false });
    res.status(400);
    throw new Error("Verification code has expired. Please request a new one.");
  }

  // Check correctness
  if (user.langOTP !== otp.trim()) {
    res.status(400);
    throw new Error("Invalid verification code. Please check and try again.");
  }

  // Success — activate French
  user.langOTP = null;
  user.langOTPExpires = null;
  user.preferredLanguage = "fr";
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Langue française activée avec succès!",
    preferredLanguage: "fr",
  });
});

// @desc    Update preferred language (non-French languages don't need OTP)
// @route   PUT /api/language/preference
// @access  Private
const updateLanguagePreference = asyncHandler(async (req, res) => {
  const { language } = req.body;
  const allowed = ["en", "es", "hi", "pt", "zh"];

  if (!language || !allowed.includes(language)) {
    res.status(400);
    throw new Error("Invalid language. Use the French OTP endpoint for French.");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  user.preferredLanguage = language;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, preferredLanguage: language });
});

module.exports = { requestFrenchOTP, verifyFrenchOTP, updateLanguagePreference };
