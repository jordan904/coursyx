'use client'

import Script from 'next/script'

export function Hotjar() {
  const siteId = process.env.NEXT_PUBLIC_HOTJAR_ID
  if (!siteId || process.env.NODE_ENV !== 'production') return null

  return (
    <Script
      id="hotjar-contentsquare"
      strategy="afterInteractive"
      src={`https://t.contentsquare.net/uxa/${siteId}.js`}
    />
  )
}
