'use client'

import { useRef, useEffect } from 'react'

export function DemoVideo(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = true
      video.setAttribute('playsinline', '')
      video.setAttribute('webkit-playsinline', '')
      video.play().catch(() => {})
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src="/demo.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      className="w-full max-h-[70vh] object-contain rounded-[6px] border border-[var(--border)]"
    />
  )
}
