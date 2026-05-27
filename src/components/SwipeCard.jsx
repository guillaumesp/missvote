import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'
import { useEffect, useState } from 'react'
import { NOTES } from '../utils/notes'

const SWIPE_THRESHOLD = 110

// Map drag offset to active direction
function directionFor(x, y) {
  const absX = Math.abs(x)
  const absY = Math.abs(y)
  if (absX < 30 && absY < 30) return null
  if (absX > absY) return x > 0 ? 'like' : 'moche'
  return y > 0 ? 'moyen' : 'super_like'
}

export default function SwipeCard({ candidate, onSwipe, isTop, stackIndex = 0 }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const controls = useAnimationControls()
  const [imgError, setImgError] = useState(false)

  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18])

  // Overlay opacities for each direction
  const likeOp = useTransform([x, y], ([lx, ly]) =>
    lx > 0 && Math.abs(lx) > Math.abs(ly) ? Math.min(1, lx / SWIPE_THRESHOLD) : 0
  )
  const mocheOp = useTransform([x, y], ([lx, ly]) =>
    lx < 0 && Math.abs(lx) > Math.abs(ly) ? Math.min(1, -lx / SWIPE_THRESHOLD) : 0
  )
  const superOp = useTransform([x, y], ([lx, ly]) =>
    ly < 0 && Math.abs(ly) > Math.abs(lx) ? Math.min(1, -ly / SWIPE_THRESHOLD) : 0
  )
  const moyenOp = useTransform([x, y], ([lx, ly]) =>
    ly > 0 && Math.abs(ly) > Math.abs(lx) ? Math.min(1, ly / SWIPE_THRESHOLD) : 0
  )

  useEffect(() => {
    setImgError(false)
  }, [candidate?.id])

  const flyOff = async (note) => {
    const target = {
      like: { x: 800, y: 30 },
      moche: { x: -800, y: 30 },
      super_like: { x: 0, y: -900 },
      moyen: { x: 0, y: 900 }
    }[note]
    await controls.start({
      ...target,
      opacity: 0,
      transition: { duration: 0.35, ease: [0.32, 0.72, 0.35, 1] }
    })
    onSwipe?.(candidate, note)
  }

  // Allow parent to trigger animation via window event keyed by id
  useEffect(() => {
    if (!isTop) return
    const handler = (e) => {
      if (e.detail?.id !== candidate.id) return
      flyOff(e.detail.note)
    }
    window.addEventListener('missvote:swipe', handler)
    return () => window.removeEventListener('missvote:swipe', handler)
  }, [isTop, candidate?.id])

  const handleDragEnd = (_, info) => {
    const dir = directionFor(info.offset.x, info.offset.y)
    const passes =
      (dir === 'like' && info.offset.x > SWIPE_THRESHOLD) ||
      (dir === 'moche' && info.offset.x < -SWIPE_THRESHOLD) ||
      (dir === 'super_like' && info.offset.y < -SWIPE_THRESHOLD) ||
      (dir === 'moyen' && info.offset.y > SWIPE_THRESHOLD)
    if (passes) {
      flyOff(dir)
    } else {
      controls.start({ x: 0, y: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } })
    }
  }

  const offsetY = stackIndex * 8
  const scale = 1 - stackIndex * 0.04

  return (
    <motion.div
      className="absolute inset-0 select-none"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : offsetY,
        rotate: isTop ? rotate : 0,
        scale: isTop ? 1 : scale,
        zIndex: 100 - stackIndex,
        touchAction: 'none'
      }}
      drag={isTop}
      dragElastic={0.7}
      dragMomentum={false}
      onDragEnd={isTop ? handleDragEnd : undefined}
      animate={controls}
      initial={false}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-gold">
        {/* Photo */}
        <div className="absolute inset-0">
          {imgError || !candidate.photo ? (
            <PlaceholderSilhouette />
          ) : (
            <img
              src={candidate.photo}
              alt={`${candidate.prenom} ${candidate.nom}`}
              className="w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          )}
          {/* Bottom gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none"
            style={{
              background:
                'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 40%, rgba(10,10,10,0) 100%)'
            }}
          />
        </div>

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-[var(--color-text)]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider mb-2 border border-[var(--color-gold)]/40 bg-black/40 backdrop-blur text-[var(--color-gold-light)]">
            {candidate.region}
          </div>
          <h2 className="font-display text-3xl leading-tight drop-shadow">
            {candidate.prenom} <span className="text-[var(--color-gold-light)]">{candidate.nom}</span>
          </h2>
          <div className="mt-1 text-sm text-[var(--color-text)]/80">
            {candidate.age} ans · {candidate.ville}
          </div>
          {candidate.bio && (
            <p className="mt-2 text-xs text-[var(--color-text)]/70 line-clamp-2">{candidate.bio}</p>
          )}
          {candidate.instagram && (
            <a
              href={`https://instagram.com/${candidate.instagram}`}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--color-gold-light)] hover:underline"
            >
              <InstagramIcon /> @{candidate.instagram}
            </a>
          )}
        </div>

        {/* Direction overlays */}
        {isTop && (
          <>
            <DirectionalBadge
              opacity={likeOp}
              label="LIKE"
              emoji="💚"
              color={NOTES.like.hex}
              align="left"
            />
            <DirectionalBadge
              opacity={mocheOp}
              label="MOCHE"
              emoji="❌"
              color={NOTES.moche.hex}
              align="right"
            />
            <DirectionalBadge
              opacity={superOp}
              label="SUPER LIKE"
              emoji="⭐"
              color={NOTES.super_like.hex}
              align="top"
            />
            <DirectionalBadge
              opacity={moyenOp}
              label="MOYEN"
              emoji="😐"
              color={NOTES.moyen.hex}
              align="bottom"
            />
          </>
        )}
      </div>
    </motion.div>
  )
}

function DirectionalBadge({ opacity, label, emoji, color, align }) {
  const pos = {
    left: 'top-8 left-6 -rotate-12',
    right: 'top-8 right-6 rotate-12',
    top: 'top-8 left-1/2 -translate-x-1/2',
    bottom: 'bottom-32 left-1/2 -translate-x-1/2'
  }[align]
  return (
    <motion.div
      style={{ opacity, borderColor: color, color }}
      className={`absolute ${pos} px-4 py-1.5 rounded-md border-4 font-display text-2xl tracking-wider bg-black/30 backdrop-blur-sm pointer-events-none`}
    >
      <span className="mr-2">{emoji}</span>
      {label}
    </motion.div>
  )
}

function PlaceholderSilhouette() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
      <svg viewBox="0 0 200 240" className="w-1/2 h-1/2 opacity-40">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8C96B" />
            <stop offset="100%" stopColor="#C9A84C" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="80" r="45" fill="url(#g)" />
        <path
          d="M30 230c0-45 31-80 70-80s70 35 70 80z"
          fill="url(#g)"
        />
      </svg>
    </div>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
