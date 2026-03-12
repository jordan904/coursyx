'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
          <h1 className="font-heading text-3xl text-foreground">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-[6px]"
            >
              Try Again
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-[6px]">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
