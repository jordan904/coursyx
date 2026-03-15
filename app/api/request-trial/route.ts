import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(50),
  community: z.string().max(200).optional(),
  niche: z.string().max(200).optional(),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, email, phone, community, niche } = parsed.data

  // Send via Resend if available, otherwise log for retrieval
  const resendKey = process.env.RESEND_API_KEY

  if (resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Coursyx <onboarding@resend.dev>',
          to: 'jordan@novaworksdigital.ca',
          subject: `Trial Request: ${name}`,
          text: [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Skool Community: ${community || 'Not provided'}`,
            `Niche: ${niche || 'Not provided'}`,
            '',
            `Submitted: ${new Date().toISOString()}`,
          ].join('\n'),
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('[request-trial] Resend error:', err)
        // Fall through to log-based fallback
      } else {
        return Response.json({ ok: true })
      }
    } catch (err) {
      console.error('[request-trial] Resend failed:', err)
    }
  }

  // Fallback: log to server console so submissions are never lost
  console.log('[request-trial] NEW SUBMISSION:', JSON.stringify({
    name,
    email,
    phone,
    community: community || '',
    niche: niche || '',
    timestamp: new Date().toISOString(),
  }))

  return Response.json({ ok: true })
}
