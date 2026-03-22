'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  GripVertical,
  Settings,
  ChevronRight,
  ChevronDown,
  Copy,
  ImageIcon,
  FileText,
  MessageSquare,
  Video,
  Loader2,
  Menu,
  X,
  Trash2,
  RefreshCw,
  CheckCircle,
  Download,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type QuizQuestion = {
  question: string
  options: { a: string; b: string; c: string; d: string }
  correct: 'a' | 'b' | 'c' | 'd'
  explanation: string
}

type Lesson = {
  lesson_title: string
  body: string
  action_item: string
  script?: string | null
}

type Module = {
  module_title: string
  learning_outcomes: string[]
  quiz?: QuizQuestion[] | null
  discussion_post?: string | null
  lessons: Lesson[]
}

type Course = {
  id: string
  title: string
  target_audience: string | null
  language: string | null
  cover_image_url: string | null
  cover_image_history: string[] | null
  cover_image_count: number
  generated_json: Module[] | null
  status: string
}

// ─── SortableModuleItem ──────────────────────────────────────────────────────

function SortableModuleItem({
  module,
  index,
  isSelected,
  isExpanded,
  selectedLesson,
  onSelectModule,
  onSelectLesson,
  onToggleExpand,
}: {
  module: Module
  index: number
  isSelected: boolean
  isExpanded: boolean
  selectedLesson: number
  onSelectModule: () => void
  onSelectLesson: (lessonIdx: number) => void
  onToggleExpand: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `module-${index}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-1">
      <div
        className={`flex items-center gap-1 rounded-[6px] px-2 py-1.5 transition-colors duration-150 cursor-pointer ${
          isSelected ? 'bg-[#2A2E35]' : 'hover:bg-[#2A2E35]/50'
        }`}
        onClick={onSelectModule}
      >
        <button
          {...attributes}
          {...listeners}
          className="hidden md:flex shrink-0 cursor-grab text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
          aria-label={`Reorder module ${index + 1}`}
          aria-roledescription="sortable"
        >
          <GripVertical className="size-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          className="shrink-0 text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
          aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
        >
          {isExpanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
        <span className="text-sm text-[#E8E3D5] truncate flex-1">
          {module.module_title}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-7 mt-0.5 space-y-0.5">
          {module.lessons.map((lesson, lIdx) => (
            <button
              key={lIdx}
              onClick={() => onSelectLesson(lIdx)}
              className={`block w-full text-left text-xs px-2 py-1 rounded-[6px] truncate transition-colors duration-150 ${
                isSelected && selectedLesson === lIdx
                  ? 'bg-[#E8622A]/10 text-[#E8622A]'
                  : 'text-[#8A8F98] hover:text-[#E8E3D5] hover:bg-[#2A2E35]/50'
              }`}
            >
              {lesson.lesson_title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── CourseEditor ────────────────────────────────────────────────────────────

export function CourseEditor({ course }: { course: Course }) {
  const router = useRouter()
  const courseId = course.id

  // ─── State ─────────────────────────────────────────────────────────────────

  const [modules, setModules] = useState<Module[]>(() =>
    (course.generated_json as Module[]) ?? []
  )

  const [selectedModule, setSelectedModule] = useState(0)
  const [selectedLesson, setSelectedLesson] = useState(0)
  const [expandedModules, setExpandedModules] = useState<Set<number>>(
    () => new Set([0])
  )

  const currentLesson = modules[selectedModule]?.lessons?.[selectedLesson]
  const [bodyText, setBodyText] = useState(currentLesson?.body ?? '')
  const [actionText, setActionText] = useState(currentLesson?.action_item ?? '')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [showSettings, setShowSettings] = useState(false)
  const [expanding, setExpanding] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState(course.cover_image_url)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [includeTitleOnCover, setIncludeTitleOnCover] = useState(true)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [generatingScript, setGeneratingScript] = useState(false)
  const [generatingPost, setGeneratingPost] = useState(false)

  const [scriptModalOpen, setScriptModalOpen] = useState(false)
  const [activeScript, setActiveScript] = useState<string | null>(null)
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null)
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [activePost, setActivePost] = useState<string | null>(null)

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [coverHistory, setCoverHistory] = useState<string[]>(
    () => (course.cover_image_history as string[]) ?? []
  )
  const [coverImageCount, setCoverImageCount] = useState(course.cover_image_count ?? 0)
  const [coverPrompt, setCoverPrompt] = useState('')
  const [enrichmentExpanded, setEnrichmentExpanded] = useState(false)

  // Settings fields
  const [settingsTitle, setSettingsTitle] = useState(course.title)
  const [settingsAudience, setSettingsAudience] = useState(
    course.target_audience ?? ''
  )

  // ─── Enrichment maps (initialized from generated_json) ────────────────────

  const [quizMap, setQuizMap] = useState<Record<number, QuizQuestion[] | null>>(
    () => {
      const map: Record<number, QuizQuestion[] | null> = {}
      const mods = (course.generated_json as Module[]) ?? []
      mods.forEach((m, i) => {
        map[i] = m.quiz ?? null
      })
      return map
    }
  )

  const [postMap, setPostMap] = useState<Record<number, string | null>>(() => {
    const map: Record<number, string | null> = {}
    const mods = (course.generated_json as Module[]) ?? []
    mods.forEach((m, i) => {
      map[i] = m.discussion_post ?? null
    })
    return map
  })

  const [scriptMap, setScriptMap] = useState<Record<string, string | null>>(
    () => {
      const map: Record<string, string | null> = {}
      const mods = (course.generated_json as Module[]) ?? []
      mods.forEach((m, i) => {
        m.lessons.forEach((l, j) => {
          map[`${i}-${j}`] = l.script ?? null
        })
      })
      return map
    }
  )

  // ─── Refs ──────────────────────────────────────────────────────────────────

  const debounceRef = useRef<NodeJS.Timeout>()
  const actionDebounceRef = useRef<NodeJS.Timeout>()

  // ─── Sync body/action text when selected lesson changes ───────────────────

  useEffect(() => {
    const lesson = modules[selectedModule]?.lessons?.[selectedLesson]
    setBodyText(lesson?.body ?? '')
    setActionText(lesson?.action_item ?? '')
    setSaveState('idle')
  }, [selectedModule, selectedLesson, modules])

  // ─── DnD ──────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = parseInt(String(active.id).replace('module-', ''))
      const newIndex = parseInt(String(over.id).replace('module-', ''))

      const reordered = arrayMove(modules, oldIndex, newIndex)
      setModules(reordered)

      // Update selected module index if it was moved
      if (selectedModule === oldIndex) {
        setSelectedModule(newIndex)
      } else if (
        selectedModule > oldIndex &&
        selectedModule <= newIndex
      ) {
        setSelectedModule(selectedModule - 1)
      } else if (
        selectedModule < oldIndex &&
        selectedModule >= newIndex
      ) {
        setSelectedModule(selectedModule + 1)
      }

      // Rebuild enrichment maps for new order
      const newQuizMap: Record<number, QuizQuestion[] | null> = {}
      const newPostMap: Record<number, string | null> = {}
      const newScriptMap: Record<string, string | null> = {}
      reordered.forEach((m, i) => {
        newQuizMap[i] = m.quiz ?? null
        newPostMap[i] = m.discussion_post ?? null
        m.lessons.forEach((l, j) => {
          newScriptMap[`${i}-${j}`] = l.script ?? null
        })
      })
      setQuizMap(newQuizMap)
      setPostMap(newPostMap)
      setScriptMap(newScriptMap)

      // Save reordered modules to DB
      try {
        await fetch(`/api/course/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generated_json: reordered }),
        })
      } catch {
        toast.error('Connection error. Check your internet.')
      }
    },
    [modules, selectedModule, courseId]
  )

  // ─── Save lesson body (debounced) ─────────────────────────────────────────

  const handleBodyChange = (value: string) => {
    setBodyText(value)
    setSaveState('saving')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/course/${courseId}/lesson`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleIndex: selectedModule,
            lessonIndex: selectedLesson,
            body: value,
          }),
        })
        if (res.ok) {
          // Update local modules state too
          setModules((prev) => {
            const updated = JSON.parse(JSON.stringify(prev))
            updated[selectedModule].lessons[selectedLesson].body = value
            return updated
          })
          setSaveState('saved')
        } else {
          toast.error('Failed to save changes')
          setSaveState('idle')
        }
      } catch {
        toast.error('Connection error. Check your internet.')
        setSaveState('idle')
      }
    }, 2000)
  }

  // ─── Save action item (debounced) ─────────────────────────────────────────

  const handleActionChange = (value: string) => {
    setActionText(value)
    setSaveState('saving')
    clearTimeout(actionDebounceRef.current)
    actionDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/course/${courseId}/lesson`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleIndex: selectedModule,
            lessonIndex: selectedLesson,
            action_item: value,
          }),
        })
        if (res.ok) {
          setModules((prev) => {
            const updated = JSON.parse(JSON.stringify(prev))
            updated[selectedModule].lessons[selectedLesson].action_item = value
            return updated
          })
          setSaveState('saved')
        } else {
          toast.error('Failed to save changes')
          setSaveState('idle')
        }
      } catch {
        toast.error('Connection error. Check your internet.')
        setSaveState('idle')
      }
    }, 2000)
  }

  // ─── Download cover image with title baked in ────────────────────────────

  const handleDownloadCover = async () => {
    if (!coverImageUrl) return

    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = coverImageUrl
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject()
    })
    ctx.drawImage(img, 0, 0, 1280, 720)

    // Only add text overlay if the image was generated without a title
    if (!includeTitleOnCover) {
      // Dark gradient overlay on lower third
      const grad = ctx.createLinearGradient(0, 720, 0, 380)
      grad.addColorStop(0, 'rgba(0,0,0,0.9)')
      grad.addColorStop(0.6, 'rgba(0,0,0,0.5)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 380, 1280, 340)

      const title = course.title || 'Untitled Course'
      const maxWidth = 1140
      const x = 64
      let fontSize = 62

      // Scale font down for longer titles
      if (title.length > 80) fontSize = 40
      else if (title.length > 60) fontSize = 46
      else if (title.length > 40) fontSize = 52

      ctx.font = `800 ${fontSize}px "DM Sans", "Helvetica Neue", Arial, sans-serif`
      ctx.textBaseline = 'top'
      const lineHeight = fontSize * 1.15

      // Word-wrap
      const words = title.split(' ')
      const lines: string[] = []
      let currentLine = words[0]
      for (let i = 1; i < words.length; i++) {
        const test = currentLine + ' ' + words[i]
        if (ctx.measureText(test).width > maxWidth) {
          lines.push(currentLine)
          currentLine = words[i]
        } else {
          currentLine = test
        }
      }
      lines.push(currentLine)

      // Position text from bottom with padding
      const textBlockHeight = lines.length * lineHeight
      const startY = 690 - textBlockHeight

      // Draw text with stroke outline + shadow for readability on any background
      for (let i = 0; i < lines.length; i++) {
        const ly = startY + i * lineHeight

        // Layer 1: dark shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4

        // Layer 2: dark stroke outline
        ctx.strokeStyle = 'rgba(0,0,0,0.7)'
        ctx.lineWidth = 6
        ctx.lineJoin = 'round'
        ctx.strokeText(lines[i], x, ly)

        // Layer 3: white fill
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(lines[i], x, ly)
      }

      // Reset shadow
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        const filename = (course.title || 'course').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()
        a.download = `${filename}-cover.jpg`
        a.click()
        URL.revokeObjectURL(a.href)
        toast.success('Cover image downloaded!')
      },
      'image/jpeg',
      0.95
    )
  }

  // ─── Generate cover image ─────────────────────────────────────────────────

  const handleGenerateCoverImage = async () => {
    setGeneratingImage(true)
    try {
      const res = await fetch('/api/generate-cover-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, customPrompt: coverPrompt || undefined, includeTitle: includeTitleOnCover }),
      })
      if (res.status === 429) {
        toast.error("You've hit the limit. Try again in an hour.")
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. We\'re looking into it.')
        return
      }
      const data = await res.json()
      setCoverImageUrl(data.coverImageUrl)
      if (data.coverImageHistory) {
        setCoverHistory(data.coverImageHistory)
      }
      if (data.coverImageCount !== undefined) {
        setCoverImageCount(data.coverImageCount)
      }
      toast.success('Cover image generated!')
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setGeneratingImage(false)
    }
  }

  // ─── Generate quiz ────────────────────────────────────────────────────────

  const handleGenerateQuiz = async (force = false) => {
    if (!force && quizMap[selectedModule]) {
      setActiveQuiz(quizMap[selectedModule])
      setQuizModalOpen(true)
      return
    }
    setGeneratingQuiz(true)
    try {
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, moduleIndex: selectedModule }),
      })
      if (res.status === 429) {
        toast.error("You've hit the limit. Try again in an hour.")
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. We\'re looking into it.')
        return
      }
      const data = await res.json()
      setQuizMap((prev) => ({ ...prev, [selectedModule]: data.quiz }))
      // Also update the modules state so quiz persists in local state
      setModules((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[selectedModule].quiz = data.quiz
        return updated
      })
      setActiveQuiz(data.quiz)
      setQuizModalOpen(true)
      toast.success('Quiz generated!')
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setGeneratingQuiz(false)
    }
  }

  // ─── Generate video script ────────────────────────────────────────────────

  const handleGenerateScript = async (force = false) => {
    const key = `${selectedModule}-${selectedLesson}`
    if (!force && scriptMap[key]) {
      setActiveScript(scriptMap[key])
      setScriptModalOpen(true)
      return
    }
    setGeneratingScript(true)
    try {
      const res = await fetch('/api/generate-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleIndex: selectedModule,
          lessonIndex: selectedLesson,
        }),
      })
      if (res.status === 429) {
        toast.error("You've hit the limit. Try again in an hour.")
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. We\'re looking into it.')
        return
      }
      const data = await res.json()
      setScriptMap((prev) => ({ ...prev, [key]: data.script }))
      setModules((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[selectedModule].lessons[selectedLesson].script = data.script
        return updated
      })
      setActiveScript(data.script)
      setScriptModalOpen(true)
      toast.success('Video script generated!')
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setGeneratingScript(false)
    }
  }

  // ─── Generate discussion post ─────────────────────────────────────────────

  const handleGeneratePost = async (force = false) => {
    if (!force && postMap[selectedModule]) {
      setActivePost(postMap[selectedModule])
      setPostModalOpen(true)
      return
    }
    setGeneratingPost(true)
    try {
      const res = await fetch('/api/generate-discussion-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, moduleIndex: selectedModule }),
      })
      if (res.status === 429) {
        toast.error("You've hit the limit. Try again in an hour.")
        return
      }
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. We\'re looking into it.')
        return
      }
      const data = await res.json()
      setPostMap((prev) => ({ ...prev, [selectedModule]: data.post }))
      setModules((prev) => {
        const updated = JSON.parse(JSON.stringify(prev))
        updated[selectedModule].discussion_post = data.post
        return updated
      })
      setActivePost(data.post)
      setPostModalOpen(true)
      toast.success('Discussion post generated!')
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setGeneratingPost(false)
    }
  }

  // ─── Switch cover image from history ──────────────────────────────────────

  const handleSwitchCoverImage = async (url: string) => {
    setCoverImageUrl(url)
    try {
      await fetch(`/api/course/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_url: url }),
      })
    } catch {
      toast.error('Connection error. Check your internet.')
    }
  }

  // ─── Download enrichment as .txt ────────────────────────────────────────────

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatQuizText = (quiz: QuizQuestion[]) =>
    quiz
      .map(
        (q, i) =>
          `${i + 1}. ${q.question}\n   a) ${q.options.a}\n   b) ${q.options.b}\n   c) ${q.options.c}\n   d) ${q.options.d}\n   Correct: ${q.correct}) ${q.options[q.correct]}\n   ${q.explanation}`
      )
      .join('\n\n')

  // ─── Settings: save on blur ───────────────────────────────────────────────

  const handleSettingsSave = async (field: 'title' | 'target_audience', value: string) => {
    try {
      await fetch(`/api/course/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
    } catch {
      toast.error('Connection error. Check your internet.')
    }
  }

  // ─── Regenerate course ────────────────────────────────────────────────────

  const handleRegenerateCourse = async () => {
    try {
      await fetch(`/api/course/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          generated_json: null,
          outline_json: null,
        }),
      })
      router.push(`/course/${courseId}/outline`)
    } catch {
      toast.error('Connection error. Check your internet.')
    }
  }

  // ─── Delete course ────────────────────────────────────────────────────────

  const handleDeleteCourse = async () => {
    try {
      await fetch(`/api/course/${courseId}`, { method: 'DELETE' })
      router.push('/dashboard')
    } catch {
      toast.error('Connection error. Check your internet.')
    }
  }

  // ─── Expand lesson ───────────────────────────────────────────────────────

  const handleExpand = async () => {
    if (expanding) return
    setExpanding(true)
    try {
      const res = await fetch('/api/expand-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          moduleIndex: selectedModule,
          lessonIndex: selectedLesson,
          lessonBody: bodyText,
        }),
      })

      if (res.status === 429) {
        toast.error("You've hit the limit. Try again in an hour.")
        setExpanding(false)
        return
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Something went wrong. We\'re looking into it.')
        setExpanding(false)
        return
      }

      const reader = res.body!.getReader()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        accumulated += chunk
        setBodyText(accumulated)
      }

      // Save expanded text to DB after 2s debounce
      clearTimeout(debounceRef.current)
      setSaveState('saving')
      debounceRef.current = setTimeout(async () => {
        try {
          const patchRes = await fetch(`/api/course/${courseId}/lesson`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleIndex: selectedModule,
              lessonIndex: selectedLesson,
              body: accumulated,
            }),
          })
          if (patchRes.ok) {
            setModules((prev) => {
              const updated = JSON.parse(JSON.stringify(prev))
              updated[selectedModule].lessons[selectedLesson].body = accumulated
              return updated
            })
            setSaveState('saved')
          } else {
            toast.error('Failed to save changes')
            setSaveState('idle')
          }
        } catch {
          toast.error('Connection error. Check your internet.')
          setSaveState('idle')
        }
      }, 2000)
    } catch {
      toast.error('Connection error. Check your internet.')
    } finally {
      setExpanding(false)
    }
  }

  // ─── Copy for Skool ──────────────────────────────────────────────────────

  const handleCopyForSkool = () => {
    const lines: string[] = []

    modules.forEach((mod) => {
      lines.push(mod.module_title.toUpperCase())
      lines.push('By the end of this module, you will be able to:')
      mod.learning_outcomes.forEach((outcome) => {
        lines.push(`\u2022 ${outcome}`)
      })
      lines.push('')

      mod.lessons.forEach((lesson) => {
        lines.push(`**${lesson.lesson_title}**`)
        lines.push(lesson.body)
        lines.push('')
        lines.push(`\u2705 Action Item: ${lesson.action_item}`)
        lines.push('')
        lines.push('---')
        lines.push('')
      })

      if (mod.quiz && mod.quiz.length > 0) {
        lines.push('\uD83D\uDCDD MODULE QUIZ')
        mod.quiz.forEach((q, qIdx) => {
          lines.push(`${qIdx + 1}. ${q.question}`)
          lines.push(`   a) ${q.options.a}`)
          lines.push(`   b) ${q.options.b}`)
          lines.push(`   c) ${q.options.c}`)
          lines.push(`   d) ${q.options.d}`)
          lines.push(`   \u2713 Correct answer: ${q.correct}) ${q.options[q.correct]}`)
          lines.push(`   \uD83D\uDCA1 ${q.explanation}`)
          lines.push('')
        })
      }

      if (mod.discussion_post) {
        lines.push('\uD83D\uDCAC DISCUSSION PROMPT')
        lines.push(mod.discussion_post)
        lines.push('')
      }

      lines.push('\u2501'.repeat(42))
      lines.push('')
    })

    const text = lines.join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Copied! Paste directly into your Skool Classroom.')
  }

  // ─── Download as .txt ────────────────────────────────────────────────────

  const handleDownloadTxt = () => {
    const lines: string[] = []

    modules.forEach((mod) => {
      lines.push(mod.module_title.toUpperCase())
      lines.push('By the end of this module, you will be able to:')
      mod.learning_outcomes.forEach((outcome) => {
        lines.push(`\u2022 ${outcome}`)
      })
      lines.push('')

      mod.lessons.forEach((lesson) => {
        lines.push(`**${lesson.lesson_title}**`)
        lines.push(lesson.body)
        lines.push('')
        lines.push(`\u2705 Action Item: ${lesson.action_item}`)
        lines.push('')
        lines.push('---')
        lines.push('')
      })

      if (mod.quiz && mod.quiz.length > 0) {
        lines.push('\uD83D\uDCDD MODULE QUIZ')
        mod.quiz.forEach((q, qIdx) => {
          lines.push(`${qIdx + 1}. ${q.question}`)
          lines.push(`   a) ${q.options.a}`)
          lines.push(`   b) ${q.options.b}`)
          lines.push(`   c) ${q.options.c}`)
          lines.push(`   d) ${q.options.d}`)
          lines.push(`   \u2713 Correct answer: ${q.correct}) ${q.options[q.correct]}`)
          lines.push(`   \uD83D\uDCA1 ${q.explanation}`)
          lines.push('')
        })
      }

      if (mod.discussion_post) {
        lines.push('\uD83D\uDCAC DISCUSSION PROMPT')
        lines.push(mod.discussion_post)
        lines.push('')
      }

      lines.push('\u2501'.repeat(42))
      lines.push('')
    })

    const text = lines.join('\n')
    const slug = course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'course'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ─── Module selection helpers ─────────────────────────────────────────────

  const handleSelectModule = (idx: number) => {
    setSelectedModule(idx)
    setSelectedLesson(0)
    setExpandedModules((prev) => {
      const next = new Set(prev)
      next.add(idx)
      return next
    })
    setMobileDrawerOpen(false)
  }

  const handleSelectLesson = (moduleIdx: number, lessonIdx: number) => {
    setSelectedModule(moduleIdx)
    setSelectedLesson(lessonIdx)
    setMobileDrawerOpen(false)
  }

  const toggleExpand = (idx: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  // ─── Guard: no modules ────────────────────────────────────────────────────

  if (modules.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0D0F12] px-4">
        <FileText className="size-12 text-[#8A8F98]" />
        <h2 className="font-heading text-2xl text-[#E8E3D5]">
          No course content yet
        </h2>
        <p className="text-[#8A8F98]">
          Generate your course first, then come back to edit.
        </p>
        <Button
          onClick={() => router.push('/dashboard')}
          className="rounded-[6px] bg-[#E8622A] hover:bg-[#E8622A]/80"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const currentModule = modules[selectedModule]
  const currentLessonData = currentModule?.lessons?.[selectedLesson]
  const scriptKey = `${selectedModule}-${selectedLesson}`
  const hasQuiz = !!quizMap[selectedModule]
  const hasScript = !!scriptMap[scriptKey]
  const hasPost = !!postMap[selectedModule]

  // ─── Sidebar content (reused in drawer + desktop) ─────────────────────────

  // ─── Enrichment items for sidebar ─────────────────────────────────────────

  const enrichmentItems: { type: string; label: string; moduleIdx: number; lessonIdx?: number }[] = []
  modules.forEach((mod, mIdx) => {
    if (quizMap[mIdx]) {
      enrichmentItems.push({ type: 'quiz', label: `${mod.module_title} — Quiz`, moduleIdx: mIdx })
    }
    if (postMap[mIdx]) {
      enrichmentItems.push({ type: 'post', label: `${mod.module_title} — Discussion`, moduleIdx: mIdx })
    }
    mod.lessons.forEach((lesson, lIdx) => {
      if (scriptMap[`${mIdx}-${lIdx}`]) {
        enrichmentItems.push({ type: 'script', label: `${lesson.lesson_title} — Script`, moduleIdx: mIdx, lessonIdx: lIdx })
      }
    })
  })

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Back to Dashboard */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-4 py-3 text-sm text-[#8A8F98] hover:text-[#E8E3D5] border-b border-[#2A2E35] transition-colors duration-150"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Course title */}
      <div className="p-4 border-b border-[#2A2E35]">
        <h2 className="font-heading text-lg text-[#E8E3D5] truncate">
          {course.title}
        </h2>
      </div>

      {/* Cover image */}
      <div className="p-4 border-b border-[#2A2E35]">
        {coverImageUrl ? (
          <div className="relative aspect-video rounded-[6px] overflow-hidden mb-2">
            <Image
              src={coverImageUrl}
              alt="Course cover"
              fill
              className="object-cover"
              sizes="280px"
            />
          </div>
        ) : (
          <div className="aspect-video rounded-[6px] bg-gradient-to-br from-[#E8622A]/20 to-[#161A1F] mb-2 flex items-center justify-center">
            <p className="text-[#8A8F98] text-xs text-center px-4">Generate a cover image below</p>
          </div>
        )}
        <input
          type="text"
          value={coverPrompt}
          onChange={(e) => setCoverPrompt(e.target.value)}
          placeholder="Optional: describe a style or mood..."
          className="w-full px-2 py-1.5 mb-2 bg-[#0D0F12] border border-[#2A2E35] rounded-[6px] text-[#E8E3D5] text-xs outline-none focus:border-[#E8622A] transition-colors duration-150 placeholder:text-[#8A8F98]/60"
        />
        <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeTitleOnCover}
            onChange={(e) => setIncludeTitleOnCover(e.target.checked)}
            className="accent-[#E8622A] size-3.5 rounded"
          />
          <span className="text-[11px] text-[#8A8F98]">Include course title on image</span>
        </label>
        <div className="flex gap-2 mb-2">
          <Button
            onClick={handleGenerateCoverImage}
            disabled={generatingImage || coverImageCount >= 3}
            variant="outline"
            className={`flex-1 rounded-[6px] text-xs${coverImageCount >= 3 ? ' opacity-50' : ''}`}
          >
            {coverImageCount >= 3 ? (
              '3/3 — Limit reached'
            ) : generatingImage ? (
              <>
                <Loader2 className="size-3 animate-spin mr-1" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="size-3 mr-1" />
                {coverImageUrl ? 'Regenerate' : 'Generate Cover'}
              </>
            )}
          </Button>
          {coverImageUrl && (
            <Button
              onClick={handleDownloadCover}
              variant="outline"
              className="rounded-[6px] text-xs"
              aria-label="Download cover image"
            >
              <Download className="size-3 mr-1" />
              Download
            </Button>
          )}
        </div>
        <p className="text-[10px] text-[#8A8F98] leading-snug mb-2">
          {includeTitleOnCover
            ? 'Your course title will be rendered directly on the cover image. Download and upload to Skool as-is.'
            : 'Cover will be generated without text. Use Download to get a version with your title added.'}
        </p>
        {coverHistory.length > 1 && (
          <div className="mt-2">
            <p className="text-[10px] text-[#8A8F98] mb-1">
              {coverImageCount}/3 images used
            </p>
            <div className="flex gap-1.5 overflow-x-auto">
              {coverHistory.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSwitchCoverImage(url)}
                  className={`relative shrink-0 w-12 h-8 rounded overflow-hidden border transition-colors duration-150 ${
                    url === coverImageUrl
                      ? 'border-[#E8622A]'
                      : 'border-[#2A2E35] hover:border-[#8A8F98]'
                  }`}
                  aria-label={`Switch to cover image ${idx + 1}`}
                >
                  <Image
                    src={url}
                    alt={`Cover ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={modules.map((_, i) => `module-${i}`)}
            strategy={verticalListSortingStrategy}
          >
            {modules.map((mod, i) => (
              <SortableModuleItem
                key={`module-${i}`}
                module={mod}
                index={i}
                isSelected={selectedModule === i}
                isExpanded={expandedModules.has(i)}
                selectedLesson={selectedLesson}
                onSelectModule={() => handleSelectModule(i)}
                onSelectLesson={(lIdx) => handleSelectLesson(i, lIdx)}
                onToggleExpand={() => toggleExpand(i)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <p className="text-[10px] text-[#8A8F98] text-center mt-2 md:hidden">
          Reorder modules on desktop
        </p>
      </div>

      {/* Enrichment section */}
      {enrichmentItems.length > 0 && (
        <div className="border-t border-[#2A2E35]">
          <button
            onClick={() => setEnrichmentExpanded(!enrichmentExpanded)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
          >
            {enrichmentExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            <Sparkles className="size-3" />
            Enrichment ({enrichmentItems.length})
          </button>
          {enrichmentExpanded && (
            <div className="px-2 pb-2 space-y-0.5">
              {enrichmentItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      if (item.type === 'quiz') {
                        setActiveQuiz(quizMap[item.moduleIdx]!)
                        setQuizModalOpen(true)
                      } else if (item.type === 'post') {
                        setActivePost(postMap[item.moduleIdx]!)
                        setPostModalOpen(true)
                      } else if (item.type === 'script') {
                        setActiveScript(scriptMap[`${item.moduleIdx}-${item.lessonIdx}`]!)
                        setScriptModalOpen(true)
                      }
                    }}
                    className="flex-1 flex items-center gap-1.5 text-xs text-[#8A8F98] hover:text-[#E8E3D5] px-2 py-1 rounded-[6px] hover:bg-[#2A2E35]/50 transition-colors duration-150 truncate text-left"
                  >
                    {item.type === 'quiz' && <FileText className="size-3 shrink-0" />}
                    {item.type === 'post' && <MessageSquare className="size-3 shrink-0" />}
                    {item.type === 'script' && <Video className="size-3 shrink-0" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (item.type === 'quiz') {
                        downloadTextFile(
                          formatQuizText(quizMap[item.moduleIdx]!),
                          `quiz-module-${item.moduleIdx + 1}.txt`
                        )
                      } else if (item.type === 'post') {
                        downloadTextFile(
                          postMap[item.moduleIdx]!,
                          `discussion-module-${item.moduleIdx + 1}.txt`
                        )
                      } else if (item.type === 'script') {
                        downloadTextFile(
                          scriptMap[`${item.moduleIdx}-${item.lessonIdx}`]!,
                          `script-m${item.moduleIdx + 1}-l${(item.lessonIdx ?? 0) + 1}.txt`
                        )
                      }
                    }}
                    className="shrink-0 p-1 text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
                    aria-label={`Download ${item.label}`}
                  >
                    <Download className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings gear */}
      <div className="p-3 border-t border-[#2A2E35]">
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 text-sm text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
          aria-label="Course settings"
        >
          <Settings className="size-4" />
          Settings
        </button>
      </div>
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-[#0D0F12]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-[#2A2E35] bg-[#161A1F]">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-label="Modules"
          onKeyDown={(e) => { if (e.key === 'Escape') setMobileDrawerOpen(false) }}
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-[#161A1F] border-t border-[#2A2E35] rounded-t-xl overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-[#2A2E35]">
              <span className="text-sm font-medium text-[#E8E3D5]">Modules</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close modules drawer"
                autoFocus
              >
                <X className="size-5 text-[#8A8F98]" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Mobile "Modules" button */}
      <button
        onClick={() => setMobileDrawerOpen(true)}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden flex items-center gap-2 px-4 py-2 bg-[#161A1F] border border-[#2A2E35] rounded-[6px] text-sm text-[#E8E3D5] shadow-lg"
        aria-label="Open modules list"
      >
        <Menu className="size-4" />
        Modules
      </button>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {showSettings ? (
          /* ─── Settings panel ─────────────────────────────────────────── */
          <div
            className="max-w-2xl mx-auto p-6 space-y-6"
            role="dialog"
            aria-label="Course Settings"
            onKeyDown={(e) => { if (e.key === 'Escape') setShowSettings(false) }}
          >
            <div className="flex items-center justify-between">
              <h1 className="font-heading text-2xl text-[#E8E3D5]">
                Course Settings
              </h1>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#8A8F98] hover:text-[#E8E3D5] transition-colors duration-150"
                aria-label="Close settings"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-title" className="block text-sm text-[#8A8F98] mb-1">
                  Course Title
                </label>
                <input
                  id="settings-title"
                  type="text"
                  value={settingsTitle}
                  onChange={(e) => setSettingsTitle(e.target.value)}
                  onBlur={() => handleSettingsSave('title', settingsTitle)}
                  className="w-full px-3 py-2 bg-[#161A1F] border border-[#2A2E35] rounded-[6px] text-[#E8E3D5] text-sm outline-none focus:border-[#E8622A] transition-colors duration-150"
                />
              </div>
              <div>
                <label htmlFor="settings-audience" className="block text-sm text-[#8A8F98] mb-1">
                  Target Audience
                </label>
                <input
                  id="settings-audience"
                  type="text"
                  value={settingsAudience}
                  onChange={(e) => setSettingsAudience(e.target.value)}
                  onBlur={() =>
                    handleSettingsSave('target_audience', settingsAudience)
                  }
                  className="w-full px-3 py-2 bg-[#161A1F] border border-[#2A2E35] rounded-[6px] text-[#E8E3D5] text-sm outline-none focus:border-[#E8622A] transition-colors duration-150"
                />
              </div>
            </div>

            <div className="border-t border-[#2A2E35] pt-6 space-y-3">
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="outline" className="w-full rounded-[6px]" />
                  }
                >
                  <RefreshCw className="size-4 mr-2" />
                  Regenerate Course
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will discard all generated content and take you back to
                      the outline step. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRegenerateCourse}
                      className="bg-[#E8622A] hover:bg-[#E8622A]/80"
                    >
                      Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      className="w-full rounded-[6px]"
                    />
                  }
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Course
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete course?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this course and all its content.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteCourse}
                      className="bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          /* ─── Editor panel ───────────────────────────────────────────── */
          <div className="max-w-3xl mx-auto p-6">
            {/* Breadcrumb + save state + copy */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-[#8A8F98] min-w-0">
                <span className="truncate max-w-[120px]">
                  {currentModule?.module_title}
                </span>
                <ChevronRight className="size-3 shrink-0" />
                <span className="truncate max-w-[160px] text-[#E8E3D5]">
                  {currentLessonData?.lesson_title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {saveState === 'saving' && (
                  <span className="text-xs text-[#8A8F98] flex items-center gap-1">
                    <Loader2 className="size-3 animate-spin" />
                    Saving...
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="size-3" />
                    Saved
                  </span>
                )}
                <Button
                  onClick={handleCopyForSkool}
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                >
                  <Copy className="size-3 mr-1" />
                  Copy for Skool
                </Button>
                <Button
                  onClick={handleDownloadTxt}
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                >
                  <Download className="size-3 mr-1" />
                  Download .txt
                </Button>
              </div>
            </div>

            {/* Lesson title */}
            <h1 className="font-heading text-2xl text-[#E8E3D5] mb-6">
              {currentLessonData?.lesson_title}
            </h1>

            {/* Body textarea */}
            <div className="mb-4">
              <label htmlFor="lesson-body" className="block text-sm text-[#8A8F98] mb-1">
                Lesson Content
              </label>
              <textarea
                id="lesson-body"
                value={bodyText}
                onChange={(e) => handleBodyChange(e.target.value)}
                disabled={expanding}
                rows={12}
                className="w-full px-3 py-2 bg-[#161A1F] border border-[#2A2E35] rounded-[6px] text-[#E8E3D5] text-sm outline-none focus:border-[#E8622A] transition-colors duration-150 resize-y min-h-[200px] disabled:opacity-60"
              />
            </div>

            {/* Expand button */}
            <div className="mb-4">
              <Button
                onClick={handleExpand}
                disabled={expanding || !bodyText}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                {expanding ? (
                  <>
                    <Loader2 className="size-3 animate-spin mr-1" />
                    Expanding...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3 mr-1" />
                    Expand This Lesson
                  </>
                )}
              </Button>
            </div>

            {/* Action item */}
            <div className="mb-6">
              <label htmlFor="action-item" className="block text-sm text-[#8A8F98] mb-1">
                Action Item
              </label>
              <input
                id="action-item"
                type="text"
                value={actionText}
                onChange={(e) => handleActionChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#161A1F] border border-[#2A2E35] rounded-[6px] text-[#E8E3D5] text-sm outline-none focus:border-[#E8622A] transition-colors duration-150"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-[#2A2E35] my-6" />

            {/* Enrichment buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                onClick={() => handleGenerateScript()}
                disabled={generatingScript}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                {generatingScript ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <Video className="size-3 mr-1" />
                )}
                {hasScript ? 'View Script' : 'Generate Video Script'}
              </Button>

              <Button
                onClick={() => handleGenerateQuiz()}
                disabled={generatingQuiz}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                {generatingQuiz ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <FileText className="size-3 mr-1" />
                )}
                {hasQuiz ? 'View Quiz' : 'Generate Quiz'}
              </Button>

              <Button
                onClick={() => handleGeneratePost()}
                disabled={generatingPost}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                {generatingPost ? (
                  <Loader2 className="size-3 animate-spin mr-1" />
                ) : (
                  <MessageSquare className="size-3 mr-1" />
                )}
                {hasPost ? 'View Discussion Post' : 'Generate Discussion Post'}
              </Button>
            </div>

            {/* Learning outcomes */}
            {currentModule?.learning_outcomes &&
              currentModule.learning_outcomes.length > 0 && (
                <div className="bg-[#161A1F] border border-[#2A2E35] rounded-[6px] p-4">
                  <h3 className="text-sm font-medium text-[#E8E3D5] mb-2">
                    Learning Outcomes
                  </h3>
                  <ul className="space-y-1">
                    {currentModule.learning_outcomes.map((outcome, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-[#8A8F98] flex items-start gap-2"
                      >
                        <span className="text-[#E8622A] mt-0.5 shrink-0">
                          \u2022
                        </span>
                        {outcome}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}
      </main>

      {/* ─── Script Modal ──────────────────────────────────────────────────── */}
      <Dialog open={scriptModalOpen} onOpenChange={setScriptModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#161A1F] border-0 sm:border sm:border-[#2A2E35]">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#E8E3D5]">
              Video Script
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto sm:max-h-[60vh]">
            <pre className="whitespace-pre-wrap text-sm text-[#E8E3D5] leading-relaxed">
              {activeScript}
            </pre>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (activeScript) {
                    navigator.clipboard.writeText(activeScript)
                    toast.success('Script copied!')
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Copy className="size-3 mr-1" />
                Copy
              </Button>
              <Button
                onClick={() => {
                  if (activeScript) {
                    downloadTextFile(activeScript, `video-script.txt`)
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Download className="size-3 mr-1" />
                Download
              </Button>
            </div>
            <Button
              onClick={() => {
                setScriptModalOpen(false)
                handleGenerateScript(true)
              }}
              disabled={generatingScript}
              variant="outline"
              size="sm"
              className="rounded-[6px]"
            >
              <RefreshCw className="size-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      {/* ─── Quiz Modal ────────────────────────────────────────────────────── */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#161A1F] border-0 sm:border sm:border-[#2A2E35]">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#E8E3D5]">
              Module Quiz
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto sm:max-h-[60vh] space-y-4">
            {activeQuiz?.map((q, qIdx) => (
              <div
                key={qIdx}
                className="bg-[#0D0F12] border border-[#2A2E35] rounded-[6px] p-3"
              >
                <p className="text-sm font-medium text-[#E8E3D5] mb-2">
                  {qIdx + 1}. {q.question}
                </p>
                <div className="space-y-1 ml-2">
                  {(['a', 'b', 'c', 'd'] as const).map((key) => (
                    <p
                      key={key}
                      className={`text-sm ${
                        key === q.correct
                          ? 'text-green-400'
                          : 'text-[#8A8F98]'
                      }`}
                    >
                      {key}) {q.options[key]}
                      {key === q.correct && ' \u2713'}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-[#8A8F98] mt-2 italic">
                  {q.explanation}
                </p>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (activeQuiz) {
                    navigator.clipboard.writeText(formatQuizText(activeQuiz))
                    toast.success('Quiz copied!')
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Copy className="size-3 mr-1" />
                Copy
              </Button>
              <Button
                onClick={() => {
                  if (activeQuiz) {
                    downloadTextFile(formatQuizText(activeQuiz), `quiz.txt`)
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Download className="size-3 mr-1" />
                Download
              </Button>
            </div>
            <Button
              onClick={() => {
                setQuizModalOpen(false)
                handleGenerateQuiz(true)
              }}
              disabled={generatingQuiz}
              variant="outline"
              size="sm"
              className="rounded-[6px]"
            >
              <RefreshCw className="size-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>

      {/* ─── Discussion Post Modal ─────────────────────────────────────────── */}
      <Dialog open={postModalOpen} onOpenChange={setPostModalOpen}>
        <DialogContent className="sm:max-w-lg bg-[#161A1F] border-0 sm:border sm:border-[#2A2E35]">
          <DialogHeader>
            <DialogTitle className="font-heading text-[#E8E3D5]">
              Discussion Post
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto sm:max-h-[60vh]">
            <p className="text-sm text-[#E8E3D5] leading-relaxed whitespace-pre-wrap">
              {activePost}
            </p>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (activePost) {
                    navigator.clipboard.writeText(activePost)
                    toast.success('Discussion post copied!')
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Copy className="size-3 mr-1" />
                Copy
              </Button>
              <Button
                onClick={() => {
                  if (activePost) {
                    downloadTextFile(activePost, `discussion-post.txt`)
                  }
                }}
                variant="outline"
                size="sm"
                className="rounded-[6px]"
              >
                <Download className="size-3 mr-1" />
                Download
              </Button>
            </div>
            <Button
              onClick={() => {
                setPostModalOpen(false)
                handleGeneratePost(true)
              }}
              disabled={generatingPost}
              variant="outline"
              size="sm"
              className="rounded-[6px]"
            >
              <RefreshCw className="size-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <DialogClose />
        </DialogContent>
      </Dialog>
    </div>
  )
}
