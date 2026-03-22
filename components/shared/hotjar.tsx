'use client'

import { useEffect } from 'react'

export function Hotjar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    const hjid = process.env.NEXT_PUBLIC_HOTJAR_ID
    if (!hjid) return

    import('@hotjar/browser').then(({ default: hotjar }) => {
      hotjar.init(Number(hjid), 6)
    })
  }, [])

  return null
}
