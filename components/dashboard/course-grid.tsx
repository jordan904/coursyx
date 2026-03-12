'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/dashboard/course-card'

type Course = {
  id: string
  title: string
  status: string
  cover_image_url: string | null
  target_audience: string | null
  status_updated_at: string
  created_at: string
}

export function CourseGrid({ courses }: { courses: Course[] }) {
  const router = useRouter()

  const handleDelete = () => {
    router.refresh()
  }

  const handleDuplicate = () => {
    router.refresh()
  }

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <BookOpen className="size-12 text-muted-foreground" />
        <h2 className="mt-4 font-heading text-2xl text-foreground">No courses yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload a PDF, paste a link, or drop in your notes to get started.
        </p>
        <Link href="/course/new" className="mt-6">
          <Button
            className="rounded-[6px] bg-accent text-white hover:bg-accent/90"
            style={{ transitionDuration: '150ms' }}
          >
            Build your first course
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <div
          key={course.id}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <CourseCard
            course={course}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        </div>
      ))}
    </div>
  )
}
