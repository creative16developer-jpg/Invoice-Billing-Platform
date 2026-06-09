import nodemailer from 'nodemailer';

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"SmartInvoice" <no-reply@smartinvoice.com>';

  // Check if SMTP is configured
  if (!host || !user || !pass) {
    console.warn('\n⚠️  [SMTP WARNING] SMTP credentials not fully configured in environment variables.');
    console.warn(`📩  [OTP SIMULATOR] Generated OTP for ${email}: [ ${otp} ]`);
    console.warn('💡  Please add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM to your .env.local file to enable email dispatch.\n');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from,
      to: email,
      subject: 'Verify Your SmartInvoice Account - OTP Code',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #4f39f6; padding: 12px; border-radius: 12px; margin-bottom: 12px;">
              <span style="font-size: 24px; color: #ffffff; font-weight: bold;">SmartInvoice</span>
            </div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.025em;">Verify Your Email Address</h2>
          </div>
          
          <p style="font-size: 15px; line-height: 24px; margin-bottom: 20px; color: #475569;">
            Hello,
          </p>
          <p style="font-size: 15px; line-height: 24px; margin-bottom: 24px; color: #475569;">
            Thank you for registering with SmartInvoice. To activate your merchant profile and access the dashboard, please enter the 6-digit verification code below:
          </p>
          
          <div style="text-align: center; margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; border: 1px solid #e2e8f0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f39f6; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="font-size: 13px; line-height: 20px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            This verification code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email or secure your account.
          </p>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} SmartInvoice. All rights reserved.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`\n✅  [SMTP SUCCESS] OTP email successfully sent to ${email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`\n❌  [SMTP ERROR] Failed to send OTP email to ${email}:`, error);
    console.warn(`📩  [OTP FALLBACK] OTP code for ${email} is: [ ${otp} ]\n`);
    return false;
  }
}
