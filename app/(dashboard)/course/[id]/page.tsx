import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ErrorBoundary } from '@/components/shared/error-boundary'
import { CourseEditor } from '@/components/course/course-editor'

export default async function CourseEditorPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  if (!/^[0-9a-f-]{36}$/.test(id)) {
    redirect('/dashboard')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Uses RLS-scoped client. Only returns courses owned by the authenticated user
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !course) {
    redirect('/dashboard')
  }

  return (
    <ErrorBoundary>
      <CourseEditor course={course} />
    </ErrorBoundary>
  )
}
