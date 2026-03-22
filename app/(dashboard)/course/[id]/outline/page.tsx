'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'

type OutlineModule = {
  module_title: string
  lessons: string[]
}

function SortableModule({
  module,
  moduleIndex,
  onModuleTitleChange,
  onModuleTitleBlur,
  onLessonChange,
  onLessonBlur,
  onAddLesson,
  onRemoveLesson,
}: {
  module: OutlineModule
  moduleIndex: number
  onModuleTitleChange: (index: number, value: string) => void
  onModuleTitleBlur: () => void
  onLessonChange: (mIdx: number, lIdx: number, value: string) => void
  onLessonBlur: () => void
  onAddLesson: (mIdx: number) => void
  onRemoveLesson: (mIdx: number, lIdx: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `module-${moduleIndex}`,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#161A1F] border border-[#2A2E35] rounded-[6px] p-5 mb-4"
    >
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          className="cursor-grab text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150 touch-none"
          aria-label={`Reorder module ${moduleIndex + 1}`}
          {...attributes}
          {...listeners}
          aria-roledescription="sortable"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <span className="text-[#8A8F98] text-sm font-medium shrink-0">
          Module {moduleIndex + 1}
        </span>
        <input
          type="text"
          value={module.module_title}
          onChange={(e) => onModuleTitleChange(moduleIndex, e.target.value)}
          onBlur={onModuleTitleBlur}
          className="flex-1 bg-[#0D0F12] border border-[#2A2E35] rounded-[6px] px-3 py-2 text-[#E8E3D5] font-heading text-lg focus:outline-none focus:border-[#E8622A] transition-colors duration-150"
          aria-label={`Module ${moduleIndex + 1} title`}
        />
      </div>

      <div className="pl-8 space-y-2">
        {module.lessons.map((lesson, lessonIndex) => (
          <div key={lessonIndex} className="flex items-center gap-2">
            <span className="text-[#3D4148] text-xs shrink-0 w-6 text-right">
              {lessonIndex + 1}.
            </span>
            <input
              type="text"
              value={lesson}
              onChange={(e) =>
                onLessonChange(moduleIndex, lessonIndex, e.target.value)
              }
              onBlur={onLessonBlur}
              className="flex-1 bg-[#0D0F12] border border-[#2A2E35] rounded-[6px] px-3 py-2 text-[#E8E3D5] text-sm focus:outline-none focus:border-[#E8622A] transition-colors duration-150"
              aria-label={`Module ${moduleIndex + 1}, Lesson ${lessonIndex + 1} title`}
            />
            {module.lessons.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveLesson(moduleIndex, lessonIndex)}
                className="text-[#8A8F98] hover:text-red-400 transition-colors duration-150 p-1"
                aria-label={`Remove lesson ${lessonIndex + 1} from module ${moduleIndex + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => onAddLesson(moduleIndex)}
          className="flex items-center gap-1 text-[#8A8F98] hover:text-[#E8622A] text-sm transition-colors duration-150 mt-2"
        >
          <Plus className="w-4 h-4" />
          Add lesson
        </button>
      </div>
    </div>
  )
}

export default function OutlinePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string

  const [phase, setPhase] = useState<'generating' | 'editing' | 'error' | 'rate-limited' | 'timeout'>('generating')
  const [chars, setChars] = useState(0)
  const [outline, setOutline] = useState<OutlineModule[]>([])
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const saveOutline = useCallback(
    async (updatedOutline: OutlineModule[]) => {
      setSaving(true)
      try {
        await fetch(`/api/course/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outline_json: updatedOutline }),
        })
      } catch {
        toast.error('Failed to save outline changes.')
      } finally {
        setSaving(false)
      }
    },
    [courseId]
  )

  useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const response = await fetch('/api/generate-outline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId }),
        })

        if (response.status === 429) {
          setPhase('rate-limited')
          return
        }

        if (response.status === 400) {
          const data = await response.json()
          setErrorMessage(data.error || 'No source content found.')
          setPhase('error')
          return
        }

        if (!response.ok || !response.body) {
          setErrorMessage('Failed to generate outline. Please try again.')
          setPhase('error')
          return
        }

        const reader = response.body.getReader()
        let accumulated = ''
        let signal = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = new TextDecoder().decode(value)

          if (chunk.includes('__DONE__')) {
            signal = '__DONE__'
            const clean = chunk.replace('__DONE__', '')
            if (clean) {
              accumulated += clean
              if (!cancelled) setChars(accumulated.length)
            }
          } else if (chunk.includes('__FAILED__')) {
            signal = '__FAILED__'
            const clean = chunk.replace('__FAILED__', '')
            if (clean) {
              accumulated += clean
              if (!cancelled) setChars(accumulated.length)
            }
          } else {
            accumulated += chunk
            if (!cancelled) setChars(accumulated.length)
          }
        }

        if (cancelled) return

        // Poll Supabase for status
        const supabase = createClient()
        let pollCount = 0
        const maxPolls = 60

        const poll = async (): Promise<void> => {
          if (cancelled || pollCount >= maxPolls) {
            if (pollCount >= maxPolls) {
              setPhase('timeout')
            }
            return
          }

          pollCount++

          const { data: course } = await supabase
            .from('courses')
            .select('status, outline_json')
            .eq('id', courseId)
            .single()

          if (cancelled) return

          if (course?.status === 'outline' && course.outline_json) {
            setOutline(course.outline_json as OutlineModule[])
            setPhase('editing')
            return
          }

          if (course?.status === 'failed' || signal === '__FAILED__') {
            setErrorMessage('Outline generation failed. Please try again.')
            setPhase('error')
            return
          }

          await new Promise((resolve) => setTimeout(resolve, 600))
          return poll()
        }

        await poll()
      } catch (err) {
        console.error('[outline] generation error:', err)
        if (!cancelled) {
          setErrorMessage('Connection error. Check your internet.')
          setPhase('error')
        }
      }
    }

    generate()

    return () => {
      cancelled = true
    }
  }, [courseId])

  const handleModuleTitleChange = (index: number, value: string) => {
    setOutline((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], module_title: value }
      return updated
    })
  }

  const handleLessonChange = (mIdx: number, lIdx: number, value: string) => {
    setOutline((prev) => {
      const updated = [...prev]
      const lessons = [...updated[mIdx].lessons]
      lessons[lIdx] = value
      updated[mIdx] = { ...updated[mIdx], lessons }
      return updated
    })
  }

  const handleBlur = () => {
    saveOutline(outline)
  }

  const handleAddLesson = (mIdx: number) => {
    setOutline((prev) => {
      const updated = [...prev]
      const lessons = [...updated[mIdx].lessons, 'New Lesson']
      updated[mIdx] = { ...updated[mIdx], lessons }
      return updated
    })
    // Defer save so state is updated
    setTimeout(() => {
      setOutline((current) => {
        saveOutline(current)
        return current
      })
    }, 0)
  }

  const handleRemoveLesson = (mIdx: number, lIdx: number) => {
    setOutline((prev) => {
      const updated = [...prev]
      if (updated[mIdx].lessons.length <= 1) return prev
      const lessons = updated[mIdx].lessons.filter((_, i) => i !== lIdx)
      updated[mIdx] = { ...updated[mIdx], lessons }
      return updated
    })
    setTimeout(() => {
      setOutline((current) => {
        saveOutline(current)
        return current
      })
    }, 0)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = outline.findIndex(
      (_, i) => `module-${i}` === active.id
    )
    const newIndex = outline.findIndex(
      (_, i) => `module-${i}` === over.id
    )

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(outline, oldIndex, newIndex)
    setOutline(reordered)
    saveOutline(reordered)
  }

  const handleGenerateCourse = async () => {
    setSaving(true)
    try {
      await fetch(`/api/course/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline_json: outline }),
      })
      router.push(`/course/${courseId}/generating`)
    } catch {
      toast.error('Failed to save outline. Please try again.')
      setSaving(false)
    }
  }

  // Generating state
  if (phase === 'generating') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="mb-6">
            <Loader2 className="w-10 h-10 text-[#E8622A] animate-spin mx-auto" />
          </div>
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Generating your course outline...
          </h1>
          <p className="text-[#8A8F98] text-sm mb-4">
            Analyzing your source material and creating a structured outline.
          </p>
          <div className="bg-[#161A1F] border border-[#2A2E35] rounded-[6px] px-4 py-3">
            <span className="text-[#8A8F98] text-sm">
              {chars.toLocaleString()} characters generated
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Rate limited
  if (phase === 'rate-limited') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Rate limit reached
          </h1>
          <p className="text-[#8A8F98] text-sm mb-6">
            You&apos;ve hit the outline generation limit. Try again in an hour.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Timeout
  if (phase === 'timeout') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Taking longer than expected
          </h1>
          <p className="text-[#8A8F98] text-sm mb-6">
            The outline is still being generated. Please check your dashboard in a few minutes.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Error state
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <h1 className="font-heading text-2xl text-[#E8E3D5] mb-3">
            Something went wrong
          </h1>
          <p className="text-[#8A8F98] text-sm mb-6">{errorMessage}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/course/new')}
              className="border border-[#2A2E35] text-[#E8E3D5] px-6 py-2.5 rounded-[6px] text-sm font-medium hover:border-[#3D4148] transition-colors duration-150"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Editing state
  return (
    <div className="min-h-screen bg-[#0D0F12]">
      <Navbar backHref="/dashboard" backLabel="Dashboard" />
      <div className="p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl text-[#E8E3D5] mb-2">
            Review your course outline
          </h1>
          <p className="text-[#8A8F98] text-sm">
            Edit module and lesson titles. Add, remove, or reorder before
            generating.
          </p>
          {saving && (
            <span className="text-[#8A8F98] text-xs mt-1 inline-block">
              Saving...
            </span>
          )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={outline.map((_, i) => `module-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {outline.map((module, index) => (
              <SortableModule
                key={`module-${index}`}
                module={module}
                moduleIndex={index}
                onModuleTitleChange={handleModuleTitleChange}
                onModuleTitleBlur={handleBlur}
                onLessonChange={handleLessonChange}
                onLessonBlur={handleBlur}
                onAddLesson={handleAddLesson}
                onRemoveLesson={handleRemoveLesson}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2A2E35]">
          <button
            onClick={() => router.push('/course/new')}
            className="text-[#8A8F98] hover:text-[#E8E3D5] text-sm transition-colors duration-150"
          >
            Start Over
          </button>
          <button
            onClick={handleGenerateCourse}
            disabled={saving}
            className="bg-[#E8622A] text-white px-6 py-2.5 rounded-[6px] text-sm font-medium hover:opacity-90 transition-opacity duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Looks good — Generate Full Course
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
