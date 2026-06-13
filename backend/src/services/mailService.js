const transporter = require('../config/mail');

/**
 * Sends a one-time passcode (OTP) email
 * @param {string} to Destination email address
 * @param {string} code Numeric OTP code
 * @param {string} purpose Purpose of OTP (e.g. Register, Login, Reset)
 */
const sendOTPEmail = async (to, code, purpose = 'Verification') => {
  const subject = `MediHist - ${purpose} OTP Verification`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC;">
      <h2 style="color: #2563EB; margin-top: 0;">MediHist Security</h2>
      <p style="font-size: 16px; color: #1E293B;">Hello,</p>
      <p style="font-size: 16px; color: #1E293B;">You requested an authentication code for <strong>${purpose}</strong>. Please use the passcode below to verify your identity.</p>
      <div style="background-color: #EEF2F6; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1E293B; margin: 24px 0;">
        ${code}
      </div>
      <p style="font-size: 14px; color: #64748B;">This code is valid for 10 minutes. If you did not initiate this request, please change your password immediately.</p>
      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94A3B8; text-align: center;">MediHist Inc. — Centralized Patient Portal</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"MediHist Portal" <security@medihist.local>',
      to,
      subject,
      html
    });
    return info;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error.message);
    throw new Error('Email delivery failed');
  }
};

/**
 * Notifies a doctor/caregiver that access has been granted
 * @param {string} to Doctor's/Caregiver's email
 * @param {string} patientName Name of patient granting access
 * @param {string} expiryDate Expiration timestamp
 */
const sendAccessGrantedEmail = async (to, patientName, expiryDate) => {
  const subject = `MediHist - Clinical Access Granted by ${patientName}`;
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #F8FAFC;">
      <h2 style="color: #2563EB; margin-top: 0;">MediHist Access Authorization</h2>
      <p style="font-size: 16px; color: #1E293B;">Respected Practitioner,</p>
      <p style="font-size: 16px; color: #1E293B;">Patient <strong>${patientName}</strong> has authorized clinical access to their digital medical history dashboard.</p>
      <p style="font-size: 16px; color: #1E293B;">This authorization is scheduled to remain active until: <strong>${new Date(expiryDate).toLocaleString()}</strong>.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:5173/records" style="background-color: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Access Medical Records</a>
      </div>
      <p style="font-size: 14px; color: #64748B;">You can log in using your doctor credentials to view the timeline, add clinical consultation logs, or upload scripts.</p>
      <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94A3B8; text-align: center;">MediHist Inc. — Centralized Patient Portal</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"MediHist Portal" <records@medihist.local>',
      to,
      subject,
      html
    });
    return info;
  } catch (error) {
    console.error('❌ Failed to send access notification email:', error.message);
    throw new Error('Email delivery failed');
  }
};

module.exports = {
  sendOTPEmail,
  sendAccessGrantedEmail
};
