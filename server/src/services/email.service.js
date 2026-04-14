const nodemailer = require('nodemailer')
const { env } = require('../config/env')

let cachedTransporter

function hasSmtpConfiguration() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS)
}

function getTransporter() {
  if (cachedTransporter !== undefined) {
    return cachedTransporter
  }

  if (!hasSmtpConfiguration()) {
    cachedTransporter = null
    return cachedTransporter
  }

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  })

  return cachedTransporter
}

async function sendEmail({ to, subject, text, html }) {
  const transporter = getTransporter()

  if (!transporter) {
    console.info('[MAIL-MOCK] Email transport is not configured', {
      to,
      subject,
      preview: text || html,
    })
    return {
      mocked: true,
    }
  }

  return transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  })
}

async function sendResetPasswordEmail({
  recipientEmail,
  recipientName,
  resetLink,
}) {
  return sendEmail({
    to: recipientEmail,
    subject: 'FitAI Password Reset Request',
    text: `Hi ${recipientName},\n\nReset your FitAI password with this link: ${resetLink}\n\nIf you did not request a reset, you can ignore this message.`,
    html: `<p>Hi ${recipientName},</p><p>Reset your FitAI password using this secure link:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request a reset, you can ignore this email.</p>`,
  })
}

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
}
