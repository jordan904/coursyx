'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type Course = {
  id: string
  title: string
  status: string
  cover_image_url: string | null
  target_audience: string | null
  status_updated_at: string
  created_at: string
}

function getDisplayStatus(course: Course): string {
  if (
    course.status === 'generating' &&
    Date.now() - new Date(course.status_updated_at).getTime() > 10 * 60 * 1000
  ) {
    return 'failed'
  }
  return course.status
}

function isStuckGenerating(course: Course): boolean {
  return (
    course.status === 'generating' &&
    Date.now() - new Date(course.status_updated_at).getTime() > 10 * 60 * 1000
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    draft: { bg: 'bg-[#3D4148]', text: 'text-[#8A8F98]', label: 'Draft' },
    outline: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Outline' },
    generating: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Generating', pulse: true },
    complete: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Complete' },
    failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
  }

  const c = config[status] ?? config.draft

  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text} ${c.pulse ? 'animate-pulse' : ''}`}
    >
      {c.label}
    </span>
  )
}

export function CourseCard({
  course,
  onDelete,
  onDuplicate,
}: {
  course: Course
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const displayStatus = getDisplayStatus(course)
  const stuck = isStuckGenerating(course)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/course/${course.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete course.')
        return
      }
      toast.success('Course deleted.')
      onDelete()
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/course/${course.id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        toast.error('Failed to duplicate course.')
        return
      }
      toast.success('Course duplicated.')
      onDuplicate()
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setDuplicating(false)
    }
  }

  const editHref = stuck
    ? `/course/${course.id}/generating`
    : `/course/${course.id}`

  return (
    <div className="overflow-hidden rounded-[6px] border border-border bg-card transition-colors hover:border-muted" style={{ transitionDuration: '150ms' }}>
      {/* Cover image or gradient placeholder */}
      <div className="relative aspect-video w-full overflow-hidden">
        {course.cover_image_url ? (
          <>
            <Image
              src={course.cover_image_url}
              alt={`Cover image for ${course.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <h3 className="absolute bottom-2 left-3 right-3 font-heading text-sm leading-tight text-white drop-shadow-lg line-clamp-2">
              {course.title}
            </h3>
          </>
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(135deg, #161A1F 0%, #E8622A20 50%, #161A1F 100%)',
            }}
          />
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg leading-tight text-foreground line-clamp-2">
            {course.title}
          </h3>
          <StatusBadge status={displayStatus} />
        </div>

        {stuck && (
          <Link
            href={`/course/${course.id}/generating`}
            className="mt-2 inline-block text-xs text-red-400 underline underline-offset-2 hover:text-red-300"
            style={{ transitionDuration: '150ms' }}
          >
            Try Again
          </Link>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          <Link href={editHref} className="flex-1">
            <Button
              variant="outline"
              className="w-full rounded-[6px] border-border text-foreground hover:bg-muted"
              style={{ transitionDuration: '150ms' }}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDuplicate}
            disabled={duplicating}
            aria-label="Duplicate course"
            className="text-muted-foreground hover:text-foreground"
            style={{ transitionDuration: '150ms' }}
          >
            <Copy className="size-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete course"
                  className="text-muted-foreground hover:text-red-400"
                  style={{ transitionDuration: '150ms' }}
                />
              }
            >
              <Trash2 className="size-4" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this course?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &ldquo;{course.title}&rdquo; and all its content. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-[6px] bg-red-500 text-white hover:bg-red-600"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
