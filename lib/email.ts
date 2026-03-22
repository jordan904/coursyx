import { Resend } from 'resend'

// Server-only. Import only from /app/api/** routes.

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = 'Coursyx <noreply@coursyx.com>'
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || ''

export async function sendWelcomeEmail(userEmail: string) {
  const resend = getResend()
  if (!process.env.RESEND_API_KEY) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: 'Welcome to Coursyx',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #E8E3D5; background-color: #0D0F12;">
  <div style="margin-bottom: 32px;">
    <h1 style="font-size: 28px; font-weight: 400; margin: 0 0 8px 0; color: #E8E3D5;">Welcome to Coursyx</h1>
    <p style="font-size: 15px; color: #8A8F98; margin: 0;">Your account is ready. Here's how to get started.</p>
  </div>

  <div style="background-color: #161A1F; border: 1px solid #2A2E35; border-radius: 6px; padding: 24px; margin-bottom: 24px;">
    <h2 style="font-size: 18px; font-weight: 400; margin: 0 0 16px 0; color: #E8E3D5;">Three steps to your first course</h2>
    <div style="margin-bottom: 12px;">
      <span style="display: inline-block; width: 24px; height: 24px; background-color: #E8622A; border-radius: 50%; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700; color: white; margin-right: 10px;">1</span>
      <span style="font-size: 14px; color: #E8E3D5;">Upload a PDF, paste a YouTube link, or type your notes</span>
    </div>
    <div style="margin-bottom: 12px;">
      <span style="display: inline-block; width: 24px; height: 24px; background-color: #E8622A; border-radius: 50%; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700; color: white; margin-right: 10px;">2</span>
      <span style="font-size: 14px; color: #E8E3D5;">Review the AI-generated outline and approve it</span>
    </div>
    <div style="margin-bottom: 0;">
      <span style="display: inline-block; width: 24px; height: 24px; background-color: #E8622A; border-radius: 50%; text-align: center; line-height: 24px; font-size: 13px; font-weight: 700; color: white; margin-right: 10px;">3</span>
      <span style="font-size: 14px; color: #E8E3D5;">Copy your finished course into Skool Classroom</span>
    </div>
  </div>

  <div style="text-align: center; margin-bottom: 32px;">
    <a href="https://www.coursyx.com/dashboard" style="display: inline-block; padding: 12px 32px; background-color: #E8622A; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Go to Dashboard</a>
  </div>

  <div style="border-top: 1px solid #2A2E35; padding-top: 20px;">
    <p style="font-size: 13px; color: #8A8F98; margin: 0 0 4px 0;">Your free plan includes 2 courses with all features.</p>
    <p style="font-size: 13px; color: #8A8F98; margin: 0;">Need more? Upgrade anytime from your dashboard.</p>
  </div>

  <p style="font-size: 12px; color: #3D4148; margin-top: 32px;">Coursyx | AI Course Builder for Skool</p>
</div>
      `.trim(),
    })
  } catch (err) {
    console.error('[email] Failed to send welcome email:', err)
  }
}

export async function sendSignupNotification(userEmail: string) {
  const resend = getResend()
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `New Coursyx signup: ${userEmail}`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #333;">
  <h2 style="margin: 0 0 12px 0;">New signup</h2>
  <p style="margin: 0 0 4px 0;"><strong>Email:</strong> ${userEmail}</p>
  <p style="margin: 0; color: #666;"><strong>Time:</strong> ${new Date().toISOString()}</p>
</div>
      `.trim(),
    })
  } catch (err) {
    console.error('[email] Failed to send signup notification:', err)
  }
}
