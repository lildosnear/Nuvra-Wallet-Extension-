// Mailer interface. The dev transport records messages in an
// outbox (and logs them) instead of sending real email; production
// swaps in a real provider (SES, Resend, SMTP) behind this shape.
export function createDevMailer() {
  const outbox = []
  return {
    outbox,
    async sendVerification(email, code) {
      outbox.push({ email, code, at: new Date().toISOString() })
      console.log(`[mailer:dev] verification code for ${email}: ${code}`)
    },
    async sendNotice(email, subject, body) {
      outbox.push({ email, subject, body, at: new Date().toISOString() })
      console.log(`[mailer:dev] notice for ${email}: ${subject}`)
    },
  }
}
