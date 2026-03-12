import Link from 'next/link'

const features = [
  { title: 'Upload anything', description: 'PDFs, YouTube links, URLs, or paste your notes directly.' },
  { title: 'Built for Skool', description: 'Every output formatted for Skool Classroom — zero reformatting.' },
  { title: 'Copy and paste ready', description: 'Modules, lessons, and action items ready to drop in.' },
  { title: 'AI cover images', description: 'Professional course covers generated with one click.' },
  { title: 'Quiz and script generator', description: 'Knowledge checks and video scripts for every lesson.' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-7 space-y-8">
            <h1
              className="font-heading text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight animate-fade-up"
            >
              Turn your knowledge into a Skool course in minutes
            </h1>
            <p
              className="text-lg md:text-xl text-[var(--muted-foreground)] max-w-xl animate-fade-up"
              style={{ animationDelay: '80ms' }}
            >
              Coursyx takes your PDF, YouTube link, or pasted notes and builds a complete
              Skool Classroom with modules, quizzes, video scripts, and a cover
              image — ready to paste in under two minutes.
            </p>
            <div
              className="animate-fade-up"
              style={{ animationDelay: '160ms' }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 px-8 bg-[var(--accent)] text-white font-medium rounded-[6px] hover:opacity-90 transition-opacity duration-150"
              >
                Start Building Free
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="p-5 border border-[var(--border)] rounded-[6px] bg-[var(--card)] animate-fade-up"
                style={{ animationDelay: `${240 + i * 80}ms` }}
              >
                <h3 className="font-heading text-xl mb-1">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
