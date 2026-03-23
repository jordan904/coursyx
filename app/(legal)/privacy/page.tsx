import { Navbar } from '@/components/shared/navbar'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar backHref="/" backLabel="Home" />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-heading text-4xl mb-2">Privacy Notice</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-10">Last updated: March 23, 2026</p>

        <div className="space-y-8 text-sm text-[var(--foreground)] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl mb-3">1. Information We Collect</h2>
            <p className="mb-3"><strong>Account information:</strong> When you create an account, we collect your email address and a hashed password. We do not store passwords in plain text.</p>
            <p className="mb-3"><strong>Content you upload:</strong> PDFs, text, YouTube URLs, and website URLs you provide as source material for course generation. This content is processed by AI to generate your courses and is stored in your account.</p>
            <p><strong>Usage data:</strong> We collect information about how you use the Service, including course creation counts and feature usage, for billing and product improvement purposes.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">2. How We Use Your Information</h2>
            <p>We use your information to: provide and maintain the Service; process payments through Paddle; generate AI course content from your source material; send transactional emails (welcome email, billing notifications); improve the Service based on usage patterns.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">3. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services that may process your data:</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--muted-foreground)]">
              <li><strong>Supabase:</strong> Database and authentication hosting</li>
              <li><strong>Anthropic (Claude):</strong> AI content generation</li>
              <li><strong>Paddle:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Application hosting</li>
              <li><strong>fal.ai:</strong> AI cover image generation</li>
              <li><strong>Firecrawl:</strong> Website content extraction</li>
              <li><strong>Supadata:</strong> YouTube transcript extraction</li>
              <li><strong>Resend:</strong> Transactional email delivery</li>
              <li><strong>Google Analytics:</strong> Anonymous usage analytics</li>
              <li><strong>Hotjar:</strong> Anonymous session analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">4. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase with row-level security policies ensuring you can only access your own data. All API communications are encrypted via HTTPS. Server-side API keys are never exposed to the client.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">5. Data Retention</h2>
            <p>Your account data and course content are retained as long as your account is active. If you delete your account, your data will be removed within 30 days. Deleted courses are soft-deleted and fully removed after 30 days.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">6. Your Rights</h2>
            <p>You have the right to: access your personal data; correct inaccurate data; delete your account and associated data; export your course content at any time. To exercise these rights, contact us through the Help & Support form in your dashboard.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">7. Cookies</h2>
            <p>We use essential cookies for authentication (Supabase session cookies). Third-party analytics tools (Google Analytics, Hotjar) may set their own cookies for anonymous usage tracking.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">8. Children</h2>
            <p>The Service is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">9. Changes to This Notice</h2>
            <p>We may update this privacy notice from time to time. We will notify you of significant changes via email or through the Service.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">10. Contact</h2>
            <p>For privacy-related questions, contact us through the Help & Support form in your dashboard.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
