'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Upload, X, Loader2, FileText, Globe, Youtube, Type } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Navbar } from '@/components/shared/navbar'

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
  'Chinese',
] as const

const step1Schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be under 200 characters'),
  targetAudience: z.string().optional(),
  language: z.string(),
})

export default function NewCoursePage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [title, setTitle] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [language, setLanguage] = useState('English')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 2 fields
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [rawContent, setRawContent] = useState('')

  // Loading states
  const [extractingYoutube, setExtractingYoutube] = useState(false)
  const [scrapingUrl, setScrapingUrl] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Success indicators
  const [youtubeChars, setYoutubeChars] = useState(0)
  const [websiteChars, setWebsiteChars] = useState(0)

  // Dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const total = pdfFiles.length + acceptedFiles.length
      if (total > 3) {
        toast.error('Maximum 3 PDF files allowed.')
        return
      }
      setPdfFiles((prev) => [...prev, ...acceptedFiles])
    },
    [pdfFiles.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 3,
    maxSize: 10 * 1024 * 1024,
    onDropRejected: (rejections) => {
      for (const rejection of rejections) {
        for (const err of rejection.errors) {
          if (err.code === 'file-too-large') {
            toast.error('File too large. Maximum 10MB per file.')
          } else if (err.code === 'file-invalid-type') {
            toast.error('Invalid file type. Please upload a PDF.')
          } else {
            toast.error(err.message)
          }
        }
      }
    },
  })

  const removePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // Step 1 validation
  const handleContinue = () => {
    setErrors({})
    const result = step1Schema.safeParse({ title, targetAudience, language })
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setStep(2)
  }

  // YouTube extraction
  const handleExtractYoutube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Enter a YouTube URL first.')
      return
    }
    setExtractingYoutube(true)
    try {
      const response = await fetch('/api/extract-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to extract transcript.')
        // Do NOT clear rawContent on failure
        return
      }
      const text = data.text as string
      setYoutubeChars(text.length)
      setRawContent((prev) => (prev ? prev + '\n\n' + text : text))
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setExtractingYoutube(false)
    }
  }

  // Website scraping
  const handleScrapeUrl = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Enter a URL first.')
      return
    }
    setScrapingUrl(true)
    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to scrape URL.')
        // Do NOT clear rawContent on failure
        return
      }
      const text = data.text as string
      setWebsiteChars(text.length)
      setRawContent((prev) => (prev ? prev + '\n\n' + text : text))
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setScrapingUrl(false)
    }
  }

  // Paste text handler
  const handlePasteChange = (value: string) => {
    const truncated = value.slice(0, 80000)
    setPasteText(truncated)
  }

  // Calculate total characters
  const totalChars = (() => {
    let total = rawContent.length
    if (pasteText.trim()) {
      total += (rawContent ? 2 : 0) + pasteText.length
    }
    return total
  })()

  // Generate Outline
  const handleGenerateOutline = async () => {
    setGenerating(true)

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Session expired. Please sign in again.')
        router.push('/login')
        return
      }

      // Check course creation allowance (billing)
      const usageRes = await fetch('/api/billing/usage')
      if (usageRes.ok) {
        const usage = await usageRes.json()
        const limit = usage.lifetimeLimit ?? usage.monthlyLimit
        const used = usage.lifetimeLimit ? usage.lifetimeUsed : usage.monthlyUsed
        if (limit !== null && used >= limit && usage.credits <= 0) {
          toast.error(
            usage.plan === 'free'
              ? 'You\'ve reached the free plan limit. Upgrade to Pro to create more courses.'
              : `You've used all ${limit} courses this month. Upgrade or buy a single course to continue.`
          )
          setGenerating(false)
          return
        }
      }

      // Create course row
      const { data: course, error: insertError } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          title: title.trim(),
          target_audience: targetAudience.trim() || null,
          language,
          status: 'draft',
        })
        .select('id')
        .single()

      if (insertError || !course) {
        console.error('[new-course] insert failed:', JSON.stringify(insertError))
        toast.error(insertError?.message || insertError?.details || 'Failed to create course. Please try again.')
        setGenerating(false)
        return
      }

      const courseId = course.id
      let combinedContent = rawContent

      // Upload and parse each PDF
      for (const file of pdfFiles) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('courseId', courseId)

          const response = await fetch('/api/parse-document', {
            method: 'POST',
            body: formData,
          })
          const data = await response.json()

          if (!response.ok) {
            toast.error(data.error || `Failed to parse ${file.name}`)
            // Continue with other sources — do NOT return early
            continue
          }

          const text = data.text as string
          combinedContent = combinedContent
            ? combinedContent + '\n\n' + text
            : text
        } catch {
          toast.error(`Connection error while uploading ${file.name}.`)
        }
      }

      // Add paste text
      if (pasteText.trim()) {
        combinedContent = combinedContent
          ? combinedContent + '\n\n' + pasteText.trim()
          : pasteText.trim()
      }

      // Truncate to 80k chars total
      combinedContent = combinedContent.slice(0, 80000)

      if (!combinedContent.trim()) {
        toast.error('No source content provided. Add at least one source.')
        // Clean up the created course
        await supabase.from('courses').delete().eq('id', courseId)
        setGenerating(false)
        return
      }

      // Update course with raw_content
      const { error: updateError } = await supabase
        .from('courses')
        .update({ raw_content: combinedContent })
        .eq('id', courseId)

      if (updateError) {
        console.error('[new-course] update raw_content failed:', JSON.stringify(updateError))
        toast.error(updateError.message || updateError.details || 'Failed to save content. Please try again.')
        setGenerating(false)
        return
      }

      router.push('/course/' + courseId + '/outline')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar backHref="/dashboard" backLabel="Dashboard" />
      <div className="px-4 py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
          <span
            className={step === 1 ? 'text-[var(--foreground)] font-medium' : ''}
            aria-current={step === 1 ? 'step' : undefined}
          >
            Step 1 of 2
          </span>
          <span className="text-[var(--border)]">/</span>
          <span
            className={step === 2 ? 'text-[var(--foreground)] font-medium' : ''}
            aria-current={step === 2 ? 'step' : undefined}
          >
            Step 2 of 2
          </span>
        </div>

        <h1 className="font-heading text-4xl md:text-5xl mb-3">
          Build a new Skool course
        </h1>
        <p className="text-[var(--muted-foreground)] mb-10">
          {step === 1
            ? 'Start with the basics. You can change these later.'
            : 'Add your source material. Upload a PDF, grab a YouTube transcript, scrape a URL, or just paste your notes.'}
        </p>

        {/* STEP 1 — Course Details */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-up">
            <div className="space-y-2">
              <Label htmlFor="title">Course title</Label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Launch Your First Skool Community"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150 placeholder:text-[var(--muted-foreground)]"
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-500">
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-audience">Target audience</Label>
              <input
                id="target-audience"
                type="text"
                placeholder="e.g. Coaches and consultants new to online courses"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                aria-describedby={
                  errors.targetAudience ? 'audience-error' : undefined
                }
                className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150 placeholder:text-[var(--muted-foreground)]"
              />
              {errors.targetAudience && (
                <p id="audience-error" className="text-sm text-red-500">
                  {errors.targetAudience}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-transparent px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang} className="bg-[var(--card)]">
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleContinue}
              className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-[6px]"
              size="lg"
            >
              Continue
            </Button>
          </div>
        )}

        {/* STEP 2 — Source Material */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <Tabs defaultValue="pdf">
              <TabsList className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[6px] p-1">
                <TabsTrigger
                  value="pdf"
                  className="flex items-center gap-1.5 rounded-[4px] data-[active]:bg-[var(--muted)] text-sm"
                >
                  <FileText className="size-3.5" />
                  PDF Upload
                </TabsTrigger>
                <TabsTrigger
                  value="youtube"
                  className="flex items-center gap-1.5 rounded-[4px] data-[active]:bg-[var(--muted)] text-sm"
                >
                  <Youtube className="size-3.5" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger
                  value="website"
                  className="flex items-center gap-1.5 rounded-[4px] data-[active]:bg-[var(--muted)] text-sm"
                >
                  <Globe className="size-3.5" />
                  Website URL
                </TabsTrigger>
                <TabsTrigger
                  value="paste"
                  className="flex items-center gap-1.5 rounded-[4px] data-[active]:bg-[var(--muted)] text-sm"
                >
                  <Type className="size-3.5" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              {/* PDF Upload Tab */}
              <TabsContent value="pdf" className="mt-4">
                <div className="rounded-[6px] border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <div className="space-y-2">
                    <Label>Upload PDF files</Label>
                    <p className="text-xs text-[var(--muted-foreground)]">Up to 3 files, 10MB each</p>
                  </div>
                  <div
                    {...getRootProps()}
                    className={`rounded-[6px] border-2 border-dashed transition-colors duration-150 p-6 text-center cursor-pointer ${
                      isDragActive
                        ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                        : 'border-[var(--border)] hover:border-[var(--muted-foreground)]'
                    }`}
                  >
                    <input {...getInputProps()} aria-label="Upload PDF files" />
                    <Upload className="mx-auto size-6 text-[var(--muted-foreground)] mb-2" />
                    <p className="text-sm text-[var(--foreground)]">
                      {isDragActive
                        ? 'Drop your PDF here'
                        : 'Drag and drop PDFs here, or click to browse'}
                    </p>
                  </div>

                  {pdfFiles.length > 0 && (
                    <div className="space-y-2">
                      {pdfFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center gap-2 rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                        >
                          <FileText className="size-4 text-[var(--accent)] shrink-0" />
                          <span className="text-sm text-[var(--foreground)] truncate flex-1">
                            {file.name}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)] shrink-0">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                          <button
                            type="button"
                            onClick={() => removePdf(index)}
                            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors duration-150"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* YouTube Tab */}
              <TabsContent value="youtube" className="mt-4">
                <div className="rounded-[6px] border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube video URL</Label>
                    <p className="text-xs text-[var(--muted-foreground)]">Paste a YouTube link to extract the transcript automatically</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="youtube-url"
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1 h-11 rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150 placeholder:text-[var(--muted-foreground)]"
                    />
                    <Button
                      onClick={handleExtractYoutube}
                      disabled={extractingYoutube}
                      variant="outline"
                      className="shrink-0 rounded-[6px] h-11"
                    >
                      {extractingYoutube ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Extracting...
                        </>
                      ) : (
                        'Extract Transcript'
                      )}
                    </Button>
                  </div>
                  {youtubeChars > 0 && (
                    <p className="text-sm text-green-500">
                      Extracted {youtubeChars.toLocaleString()} characters
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Website URL Tab */}
              <TabsContent value="website" className="mt-4">
                <div className="rounded-[6px] border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website-url">Website URL</Label>
                    <p className="text-xs text-[var(--muted-foreground)]">Paste any URL to scrape its content as source material</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="website-url"
                      type="url"
                      placeholder="https://example.com/article"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="flex-1 h-11 rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150 placeholder:text-[var(--muted-foreground)]"
                    />
                    <Button
                      onClick={handleScrapeUrl}
                      disabled={scrapingUrl}
                      variant="outline"
                      className="shrink-0 rounded-[6px] h-11"
                    >
                      {scrapingUrl ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Scraping...
                        </>
                      ) : (
                        'Scrape Content'
                      )}
                    </Button>
                  </div>
                  {websiteChars > 0 && (
                    <p className="text-sm text-green-500">
                      Extracted {websiteChars.toLocaleString()} characters
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Paste Text Tab */}
              <TabsContent value="paste" className="mt-4">
                <div className="rounded-[6px] border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paste-text">Paste your content</Label>
                    <p className="text-xs text-[var(--muted-foreground)]">Paste notes, a transcript, an article, or any text you want to turn into a course</p>
                  </div>
                  <textarea
                    id="paste-text"
                    placeholder="Paste your content here..."
                    value={pasteText}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    rows={8}
                    className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--background)] px-3 py-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors duration-150 placeholder:text-[var(--muted-foreground)] resize-y"
                  />
                  <p className="text-xs text-[var(--muted-foreground)] text-right">
                    {pasteText.length.toLocaleString()} / 80,000 characters
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Total character count */}
            <div className="rounded-[6px] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Total:{' '}
                <span className="text-[var(--foreground)] font-medium">
                  {totalChars.toLocaleString()}
                </span>{' '}
                / 80,000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setStep(1)}
                variant="ghost"
                className="rounded-[6px]"
              >
                Back
              </Button>
              <Button
                onClick={handleGenerateOutline}
                disabled={generating}
                className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white rounded-[6px]"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating course...
                  </>
                ) : (
                  'Generate Outline'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </main>
  )
}
