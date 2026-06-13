const nodemailer = require('nodemailer');

let transporter;

const createTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
    console.log('✅ SMTP Mailer configured.');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('ℹ️ SMTP credentials missing. Using console email logger fallback.');
    return {
      sendMail: async (options) => {
        console.log('\n--- 📧 DUMMY MAIL OUTBOX ---');
        console.log(`To:      ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Content: \n${options.text || options.html}`);
        console.log('----------------------------\n');
        return { messageId: `mock-id-${Date.now()}` };
      }
    };
  }
};

transporter = createTransporter();

module.exports = transporter;
