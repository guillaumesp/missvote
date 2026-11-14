import { motion, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { photosOf } from '../utils/photos'
import PhotoViewer from './PhotoViewer'

export default function SwipeCard({ candidate, onSwipe, isTop, stackIndex = 0 }) {
  const controls = useAnimationControls()
  const cardRef = useRef(null)
  const [failed, setFailed] = useState({})
  const [photoIndex, setPhotoIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const photos = photosOf(candidate)
  const multi = photos.length > 1

  // Carrousel Embla : glisser horizontalement change de photo (jamais de vote)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: multi,
    watchDrag: isTop && multi
  })

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setPhotoIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaApi])

  // Tap (Embla bloque le clic après un glissement) :
  // bord gauche/droit = photo précédente/suivante, centre = zoom
  const handleClick = useCallback(
    (event) => {
      if (!isTop || !photos.length) return
      const rect = cardRef.current?.getBoundingClientRect()
      if (!rect) return
      const rel = (event.clientX - rect.left) / rect.width
      if (multi && rel < 0.3) emblaApi?.scrollPrev()
      else if (multi && rel > 0.7) emblaApi?.scrollNext()
      else setViewerOpen(true)
    },
    [isTop, multi, photos.length, emblaApi]
  )

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

  const offsetY = stackIndex * 8
  const scale = 1 - stackIndex * 0.04

  return (
    <motion.div
      ref={cardRef}
      className="absolute inset-0 select-none"
      style={{
        y: isTop ? 0 : offsetY,
        scale: isTop ? 1 : scale,
        zIndex: 100 - stackIndex,
      }}
      animate={controls}
      initial={false}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-gold">
        {/* Photos (carrousel Embla) */}
        <div className="absolute inset-0">
          {photos.length ? (
            <div className="h-full overflow-hidden" ref={emblaRef} onClick={handleClick}>
              <div className="flex h-full touch-pan-y">
                {photos.map((src, i) => (
                  <div key={src} className="relative flex-[0_0_100%] min-w-0 h-full">
                    {failed[i] ? (
                      <PlaceholderSilhouette />
                    ) : (
                      <img
                        src={src}
                        referrerPolicy="no-referrer"
                        alt={`${candidate.prenom} ${candidate.nom} – photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        draggable={false}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <PlaceholderSilhouette />
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

        {/* Indicateur de photos + bouton zoom */}
        {photos.length > 1 && (
          <div className="absolute top-2 inset-x-3 flex gap-1 pointer-events-none">
            {photos.map((src, i) => (
              <div
                key={src}
                className={`h-1 flex-1 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/35'}`}
              />
            ))}
          </div>
        )}
        {isTop && photos.length > 0 && (
          <button
            type="button"
            aria-label="Agrandir la photo"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setViewerOpen(true)
            }}
            className="absolute top-5 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60"
          >
            <ZoomIcon />
          </button>
        )}

        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-5 text-white pointer-events-none">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider mb-2 border border-[var(--color-gold-light)]/40 bg-black/40 backdrop-blur text-[var(--color-gold-light)]">
            {candidate.region}
          </div>
          <h2 className="font-display text-3xl leading-tight drop-shadow">
            {candidate.prenom} <span className="text-[var(--color-gold-light)]">{candidate.nom}</span>
          </h2>
          <div className="mt-1 text-sm text-white/80">
            {[candidate.age && `${candidate.age} ans`, candidate.taille && `${String(candidate.taille).replace('.', ',')} m`, candidate.ville]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {candidate.bio && (
            <p className="mt-2 text-xs text-white/70 line-clamp-2">{candidate.bio}</p>
          )}
          {candidate.instagram && (
            <a
              href={`https://instagram.com/${candidate.instagram}`}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="pointer-events-auto mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--color-gold-light)] hover:underline"
            >
              <InstagramIcon /> @{candidate.instagram}
            </a>
          )}
        </div>

      </div>
      {isTop && (
        <PhotoViewer
          open={viewerOpen}
          photos={photos}
          startIndex={photoIndex}
          title={`${candidate.prenom} ${candidate.nom}`}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </motion.div>
  )
}

function ZoomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5M11 8v6M8 11h6" />
    </svg>
  )
}

function PlaceholderSilhouette() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-border)]">
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
