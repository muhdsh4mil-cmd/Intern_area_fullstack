const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
  const isConfigured = 
    process.env.EMAIL_USER && 
    process.env.EMAIL_USER !== "your-email@gmail.com" && 
    process.env.EMAIL_PASS && 
    process.env.EMAIL_PASS !== "your-app-password";

  console.log("=========================================");
  console.log(`📧 [EMAIL SIMULATION] Sending Email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body (Text): ${text}`);
  console.log("=========================================");

  if (!isConfigured) {
    console.log("⚠️ SMTP credentials not fully configured in backend .env file. Falling back to console simulation.");
    return { simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"InternArea" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Real email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send real email via SMTP transporter:", error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;
