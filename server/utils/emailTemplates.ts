function toDigits(code: string): string {
  return (code || "").replace(/\D/g, "").slice(0, 6);
}

export function verificationOtpEmailSubject(appName = "AgriReach") {
  return `${appName} verification code`;
}

export function verificationOtpEmailText(params: {
  code: string;
  appName?: string;
  expireMinutes?: number;
}) {
  const appName = params.appName || "AgriReach";
  const expireMinutes = params.expireMinutes ?? 10;
  const code = toDigits(params.code);
  return `Your ${appName} verification code is: ${code}\n\nThis code will expire in ${expireMinutes} minutes. If you did not request this, you can ignore this email.`;
}

export function verificationOtpEmailHtml(params: {
  code: string;
  email?: string;
  appName?: string;
  baseUrl?: string;
  supportEmail?: string;
  expireMinutes?: number;
}) {
  const appName = params.appName || "AgriReach";
  const baseUrl = params.baseUrl || process.env.BASE_URL || "http://localhost:3000";
  const supportEmail = params.supportEmail || (process.env.SMTP_FROM || "support@agrireach.local");
  const expireMinutes = params.expireMinutes ?? 10;
  const code = toDigits(params.code).padEnd(6, "0");
  const codeChars = code.split("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName} - Verify Your Email</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* Base reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #f0f9ff 0%, #ecfeff 50%, #f0fdf4 100%); 
      color: #1f2937; 
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
    }
    a { color: #22c55e; text-decoration: none; font-weight: 500; }
    a:hover { color: #16a34a; text-decoration: underline; }
    
    /* Container */
    .email-container { 
      width: 100%; 
      padding: 40px 20px; 
      background: linear-gradient(135deg, #f0f9ff 0%, #ecfeff 50%, #f0fdf4 100%);
      min-height: 100vh;
    }
    
    .email-card { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 20px; 
      box-shadow: 0 20px 40px rgba(34, 197, 94, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid rgba(34, 197, 94, 0.1);
    }
    
    /* Header with AgriReach branding */
    .email-header { 
      padding: 32px 32px 24px; 
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
      opacity: 0.3;
    }
    
    .brand-container {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    
    .brand-name { 
      font-family: 'Montserrat', sans-serif;
      font-weight: 700; 
      font-size: 28px; 
      color: #ffffff; 
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      letter-spacing: -0.5px;
    }
    
    .brand-tagline {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4px;
      font-weight: 500;
    }
    
    /* Content area */
    .email-content { 
      padding: 40px 32px; 
      background: #ffffff;
    }
    
    .welcome-section {
      text-align: center;
      margin-bottom: 32px;
    }
    
    .email-title { 
      font-family: 'Montserrat', sans-serif;
      font-size: 32px; 
      font-weight: 700; 
      margin: 0 0 12px; 
      color: #1f2937;
      line-height: 1.2;
    }
    
    .email-subtitle {
      font-size: 18px;
      color: #6b7280;
      margin: 0 0 8px;
      font-weight: 500;
    }
    
    .email-description { 
      color: #6b7280; 
      font-size: 16px; 
      line-height: 1.6; 
      margin: 0 0 32px;
      text-align: center;
    }
    
    /* Enhanced OTP section */
    .otp-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      border: 2px solid rgba(34, 197, 94, 0.1);
      text-align: center;
    }
    
    .otp-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .otp-container { 
      display: flex; 
      justify-content: center; 
      gap: 12px; 
      margin: 24px 0;
      flex-wrap: wrap;
    }
    
    .otp-digit { 
      width: 56px; 
      height: 64px; 
      border-radius: 12px; 
      border: 2px solid #22c55e;
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 28px; 
      font-weight: 700; 
      background: #ffffff;
      color: #22c55e;
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.1);
      transition: all 0.3s ease;
      font-family: 'Montserrat', monospace;
    }
    
    .otp-expiry {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      padding: 12px 20px;
      margin: 24px 0;
      font-size: 14px;
      color: #92400e;
      font-weight: 600;
      display: inline-block;
    }
    
    /* Action section */
    .action-section {
      text-align: center;
      margin: 32px 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: #ffffff;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      transition: all 0.3s ease;
      border: none;
      font-family: 'Montserrat', sans-serif;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
      text-decoration: none;
      color: #ffffff;
    }
    
    /* Footer */
    .email-footer { 
      padding: 32px; 
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .footer-content {
      color: #6b7280; 
      font-size: 14px;
      line-height: 1.6;
    }
    
    .footer-links {
      margin: 16px 0;
    }
    
    .footer-links a {
      color: #22c55e;
      text-decoration: none;
      margin: 0 12px;
      font-weight: 500;
    }
    
    .footer-links a:hover {
      text-decoration: underline;
    }
    
    .copyright {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
    
    /* Responsive design */
    @media (max-width: 600px) {
      .email-container { padding: 20px 10px; }
      .email-header { padding: 24px 20px 20px; }
      .email-content { padding: 32px 20px; }
      .email-footer { padding: 24px 20px; }
      .email-title { font-size: 28px; }
      .brand-name { font-size: 24px; }
      .otp-container { gap: 8px; }
      .otp-digit { width: 48px; height: 56px; font-size: 24px; }
      .otp-section { padding: 24px 16px; }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      body {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f1419 100%);
        color: #e2e8f0;
      }
      .email-card {
        background: #1e293b;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2);
        border-color: rgba(34, 197, 94, 0.2);
      }
      .email-content { background: #1e293b; }
      .email-title { color: #f8fafc; }
      .email-subtitle, .email-description { color: #cbd5e1; }
      .otp-section {
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
        border-color: rgba(34, 197, 94, 0.2);
      }
      .otp-label { color: #f8fafc; }
      .otp-digit {
        background: #0f172a;
        border-color: #22c55e;
        color: #22c55e;
        box-shadow: 0 4px 8px rgba(34, 197, 94, 0.2);
      }
      .email-footer {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-top-color: #374151;
      }
      .footer-content { color: #9ca3af; }
      .copyright {
        border-top-color: #374151;
        color: #6b7280;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <!-- Header with branding -->
      <div class="email-header">
        <div class="brand-container">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
              <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z" fill="white"/>
              <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">${appName}</div>
            <div class="brand-tagline">Connecting Rural Communities</div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <div class="email-content">
        <div class="welcome-section">
          <h1 class="email-title">Welcome to ${appName}!</h1>
          <p class="email-subtitle">You're almost ready to get started</p>
          <p class="email-description">
            Please verify your email address to complete your registration and join our thriving agricultural community.
          </p>
        </div>

        <div class="otp-section">
          <div class="otp-label">Your Verification Code</div>
          <div class="otp-container">
            ${codeChars.map((c) => `<div class="otp-digit">${c}</div>`).join("")}
          </div>
          <div class="otp-expiry">
            ⏰ This code expires in <strong>${expireMinutes} minutes</strong>
          </div>
        </div>

        <div class="action-section">
          <a href="${baseUrl}/auth/verify" class="cta-button">
            Complete Verification →
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-content">
          <p><strong>Need help?</strong> We're here to support you on your agricultural journey.</p>
          <div class="footer-links">
            <a href="${baseUrl}/support">Get Support</a>
            <a href="${baseUrl}/community">Join Community</a>
            <a href="${baseUrl}/about">About Us</a>
          </div>
          <p style="margin-top: 16px; font-size: 13px;">
            If you didn't create an account with ${appName}, you can safely ignore this email.
            <br>
            For assistance, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a>
          </p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
          <br>
          Empowering rural communities through technology and connection.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function passwordResetEmailSubject(appName = "AgriReach") {
  return `Reset your ${appName} password`;
}

export function passwordResetEmailText(params: {
  resetUrl: string;
  appName?: string;
  expireMinutes?: number;
}) {
  const appName = params.appName || "AgriReach";
  const expireMinutes = params.expireMinutes ?? 30;
  const code = toDigits(params.resetUrl);
  return `Reset your ${appName} password using this verification code: ${code}\n\nThis code will expire in ${expireMinutes} minutes. If you did not request this, you can ignore this email.`;
}

export function passwordResetEmailHtml(params: {
  resetUrl: string;
  email?: string;
  appName?: string;
  baseUrl?: string;
  supportEmail?: string;
  expireMinutes?: number;
}) {
  const appName = params.appName || "AgriReach";
  const baseUrl = params.baseUrl || process.env.BASE_URL || "http://localhost:3000";
  const supportEmail = params.supportEmail || (process.env.SMTP_FROM || "support@agrireach.local");
  const expireMinutes = params.expireMinutes ?? 30;
  const code = toDigits(params.resetUrl).padEnd(6, "0");
  const codeChars = code.split("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${appName} - Reset Your Password</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* Base reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #f0f9ff 0%, #ecfeff 50%, #f0fdf4 100%);
      color: #1f2937;
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      min-height: 100vh;
    }
    a { color: #22c55e; text-decoration: none; font-weight: 500; }
    a:hover { color: #16a34a; text-decoration: underline; }

    .email-container {
      width: 100%;
      padding: 40px 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #ecfeff 50%, #f0fdf4 100%);
      min-height: 100vh;
    }

    .email-card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(34, 197, 94, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05);
      overflow: hidden;
      border: 1px solid rgba(34, 197, 94, 0.1);
    }

    .email-header {
      padding: 32px 32px 24px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      position: relative;
      overflow: hidden;
    }

    .brand-container {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .brand-name {
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: 28px;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      letter-spacing: -0.5px;
    }

    .brand-tagline {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 4px;
      font-weight: 500;
    }

    .email-content {
      padding: 40px 32px;
      background: #ffffff;
    }

    .email-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px;
      color: #1f2937;
      line-height: 1.2;
      text-align: center;
    }

    .email-description {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 32px;
      text-align: center;
    }

    /* Enhanced OTP section */
    .otp-section {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%);
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      border: 2px solid rgba(34, 197, 94, 0.1);
      text-align: center;
    }
    
    .otp-label {
      font-family: 'Montserrat', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .otp-container { 
      display: flex; 
      justify-content: center; 
      gap: 12px; 
      margin: 24px 0;
      flex-wrap: wrap;
    }
    
    .otp-digit { 
      width: 56px; 
      height: 64px; 
      border-radius: 12px; 
      border: 2px solid #22c55e;
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 28px; 
      font-weight: 700; 
      background: #ffffff;
      color: #22c55e;
      box-shadow: 0 4px 8px rgba(34, 197, 94, 0.1);
      transition: all 0.3s ease;
      font-family: 'Montserrat', monospace;
    }
    
    .otp-expiry {
      background: rgba(251, 191, 36, 0.1);
      border: 1px solid rgba(251, 191, 36, 0.3);
      border-radius: 8px;
      padding: 12px 20px;
      margin: 24px 0;
      font-size: 14px;
      color: #92400e;
      font-weight: 600;
      display: inline-block;
    }

    .email-footer {
      padding: 32px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .footer-content {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
    }

    .copyright {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }

    @media (max-width: 600px) {
      .email-container { padding: 20px 10px; }
      .email-header { padding: 24px 20px 20px; }
      .email-content { padding: 32px 20px; }
      .email-footer { padding: 24px 20px; }
      .email-title { font-size: 28px; }
      .brand-name { font-size: 24px; }
      .otp-container { gap: 8px; }
      .otp-digit { width: 48px; height: 56px; font-size: 24px; }
      .otp-section { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-card">
      <div class="email-header">
        <div class="brand-container">
          <div class="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="white"/>
              <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z" fill="white"/>
              <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">${appName}</div>
            <div class="brand-tagline">Connecting Rural Communities</div>
          </div>
        </div>
      </div>

      <div class="email-content">
        <h1 class="email-title">Reset Your Password</h1>
        <p class="email-description">
          We received a request to reset your password. Use the verification code below to create a new password for your ${appName} account.
        </p>

        <div class="otp-section">
          <div class="otp-label">Your Password Reset Code</div>
          <div class="otp-container">
            ${codeChars.map((c) => `<div class="otp-digit">${c}</div>`).join("")}
          </div>
          <div class="otp-expiry">
            ⏰ This code expires in <strong>${expireMinutes} minutes</strong>
          </div>
        </div>

        <p class="email-description" style="margin-top: 32px; font-size: 14px;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <div class="email-footer">
        <div class="footer-content">
          <p>For assistance, contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
        </div>
        <div class="copyright">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
          <br>
          Empowering rural communities through technology and connection.
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
