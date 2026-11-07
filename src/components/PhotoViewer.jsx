import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

const MAX_SCALE = 5
const DOUBLE_TAP_SCALE = 2.5
const SWIPE_DISTANCE = 60

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * Visionneuse plein écran : pinch / molette / double-tap pour zoomer,
 * glisser pour se déplacer dans la photo zoomée, swipe horizontal
 * (à l'échelle 1) ou flèches pour changer de photo.
 */
export default function PhotoViewer({ photos, startIndex = 0, open, onClose, title }) {
  return createPortal(
    <AnimatePresence>
      {open && photos?.length > 0 && (
        <Viewer photos={photos} startIndex={startIndex} onClose={onClose} title={title} />
      )}
    </AnimatePresence>,
    document.body
  )
}

function Viewer({ photos, startIndex, onClose, title }) {
  const [index, setIndex] = useState(clamp(startIndex, 0, photos.length - 1))
  const [view, setViewState] = useState({ s: 1, x: 0, y: 0 })
  // Copie synchrone de `view` : les gestes enchaînent plusieurs évènements
  // avant le rendu suivant et doivent toujours partir de la dernière valeur.
  const viewRef = useRef(view)
  const setView = useCallback((next) => {
    const v = typeof next === 'function' ? next(viewRef.current) : next
    viewRef.current = v
    setViewState(v)
  }, [])
  const [animating, setAnimating] = useState(true)
  const stageRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const lastTap = useRef({ t: 0, x: 0, y: 0 })

  const count = photos.length

  const reset = useCallback(() => {
    setAnimating(true)
    setView({ s: 1, x: 0, y: 0 })
  }, [])

  const go = useCallback(
    (delta) => {
      if (count < 2) return
      setIndex((i) => (i + delta + count) % count)
      reset()
    },
    [count, reset]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [go, onClose])

  // Coordonnées relatives au centre de la scène
  const local = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect()
    return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2, w: r.width, h: r.height }
  }

  const bound = (v) => {
    const r = stageRef.current?.getBoundingClientRect()
    if (!r || v.s <= 1) return { s: Math.max(1, v.s), x: 0, y: 0 }
    const mx = ((v.s - 1) * r.width) / 2
    const my = ((v.s - 1) * r.height) / 2
    return { s: v.s, x: clamp(v.x, -mx, mx), y: clamp(v.y, -my, my) }
  }

  // Zoom vers `s` en gardant le point `p` (relatif au centre) immobile
  const zoomAt = (from, s, p) => {
    const k = s / from.s
    return bound({ s, x: p.x - (p.x - from.x) * k, y: p.y - (p.y - from.y) * k })
  }

  const startGesture = () => {
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      gesture.current = { type: 'pan', start: pts[0], view: viewRef.current, moved: false }
    } else if (pts.length >= 2) {
      const [a, b] = pts
      gesture.current = {
        type: 'pinch',
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        mid: local((a.x + b.x) / 2, (a.y + b.y) / 2),
        view: viewRef.current
      }
    }
  }

  const onPointerDown = (e) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // pointeur déjà relâché : rien à capturer
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setAnimating(false)
    startGesture()
  }

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]
    if (g.type === 'pinch' && pts.length >= 2) {
      const [a, b] = pts
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2)
      const s = clamp((g.view.s * dist) / g.dist, 1, MAX_SCALE)
      const zoomed = zoomAt(g.view, s, g.mid)
      setView(bound({ s, x: zoomed.x + (mid.x - g.mid.x), y: zoomed.y + (mid.y - g.mid.y) }))
    } else if (g.type === 'pan') {
      const dx = e.clientX - g.start.x
      const dy = e.clientY - g.start.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true
      if (g.view.s > 1) setView(bound({ s: g.view.s, x: g.view.x + dx, y: g.view.y + dy }))
      else setView({ s: 1, x: dx, y: 0 }) // aperçu du swipe
    }
  }

  const onPointerUp = (e) => {
    const g = gesture.current
    pointers.current.delete(e.pointerId)
    setAnimating(true)

    if (g?.type === 'pan' && pointers.current.size === 0) {
      const dx = e.clientX - g.start.x
      if (g.view.s <= 1) {
        if (dx <= -SWIPE_DISTANCE) return go(1)
        if (dx >= SWIPE_DISTANCE) return go(-1)
        setView({ s: 1, x: 0, y: 0 })
      }
      if (!g.moved) handleTap(e)
    }
    if (pointers.current.size > 0) startGesture()
    else gesture.current = null
  }

  const handleTap = (e) => {
    const now = Date.now()
    const prev = lastTap.current
    const isDouble = now - prev.t < 300 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 30
    lastTap.current = { t: isDouble ? 0 : now, x: e.clientX, y: e.clientY }
    if (!isDouble) return
    setView((v) => (v.s > 1 ? { s: 1, x: 0, y: 0 } : zoomAt(v, DOUBLE_TAP_SCALE, local(e.clientX, e.clientY))))
  }

  const onWheel = (e) => {
    setAnimating(false)
    const p = local(e.clientX, e.clientY)
    setView((v) => zoomAt(v, clamp(v.s * Math.exp(-e.deltaY * 0.002), 1, MAX_SCALE), p))
  }

  const zoomButton = (factor) => {
    setAnimating(true)
    setView((v) => zoomAt(v, clamp(v.s * factor, 1, MAX_SCALE), { x: 0, y: 0 }))
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      // Le portail remonte quand même les évènements React vers la carte parente :
      // on les arrête ici pour ne pas déclencher le drag/tap du swipe.
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Photos de ${title}` : 'Photos'}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 text-sm">
        <div className="min-w-0 truncate">
          {title && <span className="font-display text-base">{title}</span>}
          {count > 1 && (
            <span className="ml-2 text-white/60 tabular-nums">
              {index + 1} / {count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToolbarButton label="Dézoomer" onClick={() => zoomButton(1 / 1.6)} disabled={view.s <= 1}>
            −
          </ToolbarButton>
          <ToolbarButton label="Zoomer" onClick={() => zoomButton(1.6)} disabled={view.s >= MAX_SCALE}>
            +
          </ToolbarButton>
          <ToolbarButton label="Fermer" onClick={onClose}>
            ✕
          </ToolbarButton>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative flex-1 overflow-hidden"
        style={{ touchAction: 'none', cursor: view.s > 1 ? 'grab' : 'zoom-in' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          key={photos[index]}
          src={photos[index]}
          alt={title ? `${title} — photo ${index + 1}` : ''}
          referrerPolicy="no-referrer"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`,
            transition: animating ? 'transform 200ms ease-out' : 'none'
          }}
        />

        {count > 1 && view.s <= 1 && (
          <>
            <NavArrow side="left" onClick={() => go(-1)} />
            <NavArrow side="right" onClick={() => go(1)} />
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 justify-center px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] overflow-x-auto">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => {
                setIndex(i)
                reset()
              }}
              className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                i === index ? 'border-[var(--color-gold-light)]' : 'border-transparent opacity-50'
              }`}
            >
              <img src={src} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ToolbarButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center text-lg leading-none"
    >
      {children}
    </button>
  )
}

function NavArrow({ side, onClick }) {
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Photo précédente' : 'Photo suivante'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${
        side === 'left' ? 'left-3' : 'right-3'
      } w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 items-center justify-center text-xl`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
