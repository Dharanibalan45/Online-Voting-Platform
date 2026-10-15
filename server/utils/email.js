const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false, // development workaround for local SSL interception
    },
  });
};

const sendOTPEmail = async (to, name, otp) => {
  try {
    const transporter = createTransporter();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a56db, #0e9f6e); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">VoteSecure</h1>
          <p style="color: rgba(255,255,255,0.85); margin-top: 8px;">Secure Online Voting Platform</p>
        </div>

        <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Hello, ${name}</h2>
          <p>Your one-time verification code is:</p>

          <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #1a56db;">
              ${otp}
            </span>
          </div>

          <p style="color: red; font-weight: bold;">This code expires in 2 minutes.</p>
          <p style="font-size: 14px;">If you did not request this, ignore this email.</p>
        </div>

        <div style="background: #f9fafb; padding: 16px; text-align: center;">
          <p style="font-size: 12px; color: #999;">VoteSecure — Your vote, your voice.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"VoteSecure" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'VoteSecure - OTP Verification',
      html,
    });

    console.log('✅ Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = { sendOTPEmail, generateOTP };