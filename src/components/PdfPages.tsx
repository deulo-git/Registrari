import { useEffect, useRef, useState } from 'react'

/**
 * Every page of a PDF, stacked as canvases. Mobile browsers (iOS Safari, the
 * installed PWA) only show the first page of a PDF inside an <iframe>, so we
 * draw them ourselves with pdf.js (loaded on demand).
 */
export function PdfPages({ url, className }: { url: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    let alive = true
    let doc: { destroy: () => Promise<void> } | undefined
    const host = box.current
    if (!host) return
    host.replaceChildren()
    setState('loading')
    ;(async () => {
      const [pdfjs, worker] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ])
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      const task = pdfjs.getDocument({ url })
      const pdf = await task.promise
      doc = pdf
      if (!alive) return
      const width = host.clientWidth || 320
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n)
        if (!alive) return
        const base = page.getViewport({ scale: 1 })
        const vp = page.getViewport({ scale: (width / base.width) * dpr })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(vp.width)
        canvas.height = Math.floor(vp.height)
        canvas.className = 'pdf-page'
        host.appendChild(canvas)
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise
        if (n === 1) setState('ok')
      }
    })().catch(() => { if (alive) setState('error') })
    return () => { alive = false; void doc?.destroy() }
  }, [url])

  return (
    <div className={'pdf-pages ' + (className ?? '')}>
      <div ref={box} className="pdf-pages-inner" />
      {state === 'loading' && <div className="dv-skel" />}
      {state === 'error' && <a className="dv-msg" href={url} target="_blank" rel="noreferrer">PDF ↗</a>}
    </div>
  )
}
