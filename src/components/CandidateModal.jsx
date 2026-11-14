import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { photosOf } from '../utils/photos'
import PhotoViewer from './PhotoViewer'

export default function CandidateModal({ candidate, onClose }) {
  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-[430px] max-h-[100dvh] overflow-y-auto no-scrollbar bg-[var(--color-surface)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
            >
              ✕
            </button>
            <Gallery key={candidate.id} candidate={candidate} />
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-gold-light)] mb-1">
                {candidate.region}
              </div>
              <h3 className="font-display text-2xl">
                {candidate.prenom} {candidate.nom}
              </h3>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                {[candidate.age && `${candidate.age} ans`, candidate.taille && `${String(candidate.taille).replace('.', ',')} m`, candidate.ville]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              {candidate.bio && (
                <p className="mt-3 text-sm text-[var(--color-text)]/80">{candidate.bio}</p>
              )}
              {candidate.instagram && (
                <a
                  href={`https://instagram.com/${candidate.instagram}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-gold-light)] hover:underline"
                >
                  Instagram @{candidate.instagram}
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Gallery({ candidate }) {
  const photos = photosOf(candidate)
  const [index, setIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [broken, setBroken] = useState({})
  const visible = photos.filter((src) => !broken[src])
  const multi = visible.length > 1

  // Carrousel Embla : glisser pour changer de photo, toucher pour l'agrandir
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: multi, watchDrag: multi })

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on('select', onSelect).on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect).off('reInit', onSelect)
    }
  }, [emblaApi])

  if (!visible.length) {
    return (
      <div className="w-full aspect-[4/5] max-h-[60dvh] bg-gradient-to-b from-[var(--color-surface-2)] to-[var(--color-border)] flex items-center justify-center text-[var(--color-gold)] text-6xl font-display">
        {candidate.prenom?.[0]}
        {candidate.nom?.[0]}
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={emblaRef} className="w-full aspect-[4/5] max-h-[60dvh] overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {visible.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Agrandir la photo ${i + 1}`}
              // Embla bloque ce clic après un glissement : seul un vrai toucher ouvre le zoom
              onClick={() => {
                setIndex(i)
                setViewerOpen(true)
              }}
              className="flex-[0_0_100%] min-w-0 h-full cursor-zoom-in"
            >
              <img
                src={src}
                alt={`${candidate.prenom} ${candidate.nom} — photo ${i + 1}`}
                referrerPolicy="no-referrer"
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="w-full h-full object-cover select-none"
                onError={() => setBroken((b) => ({ ...b, [src]: true }))}
              />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Agrandir la photo"
        onClick={() => setViewerOpen(true)}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70"
      >
        <ZoomIcon />
      </button>

      {multi && (
        <>
          <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
            {visible.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
          <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs tabular-nums">
            {index + 1} / {visible.length}
          </div>
        </>
      )}

      <PhotoViewer
        open={viewerOpen}
        photos={visible}
        startIndex={index}
        title={`${candidate.prenom} ${candidate.nom}`}
        onClose={() => {
          setViewerOpen(false)
        }}
      />
    </div>
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
