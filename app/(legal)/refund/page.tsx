import { Navbar } from '@/components/shared/navbar'

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Navbar backHref="/" backLabel="Home" />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-heading text-4xl mb-2">Refund Policy</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-10">Last updated: March 23, 2026</p>

        <div className="space-y-8 text-sm text-[var(--foreground)] leading-relaxed">
          <section>
            <h2 className="font-heading text-xl mb-3">Subscription Plans</h2>
            <p className="mb-3">If you are not satisfied with your Coursyx subscription, you may request a full refund within 7 days of your initial purchase. After the 7-day window, refunds are not available for the current billing period, but you may cancel your subscription at any time to prevent future charges.</p>
            <p>To cancel your subscription, use the Manage Billing button in your dashboard, which opens the Paddle customer portal where you can cancel directly.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">Pay Per Course Credits</h2>
            <p>One-time course credit purchases ($15 each) are non-refundable once the credit has been used to generate a course. If you purchased a credit but have not yet used it, you may request a refund within 7 days of purchase.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">Annual Plans</h2>
            <p>Annual plan subscribers may request a prorated refund within 30 days of purchase if the Service does not meet their expectations. After 30 days, annual plans are non-refundable but you may continue using the Service until the end of your billing period.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">How to Request a Refund</h2>
            <p>To request a refund, contact us through the Help & Support form in your dashboard. Include your account email and the reason for your refund request. We will process approved refunds within 5 to 10 business days through Paddle.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">Service Issues</h2>
            <p>If you experience technical issues that prevent you from using the Service, contact us through the Help & Support form. We will work to resolve the issue or provide a refund at our discretion.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl mb-3">Chargebacks</h2>
            <p>If you have a billing concern, please contact us before initiating a chargeback with your bank. We are committed to resolving billing issues promptly and fairly.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
