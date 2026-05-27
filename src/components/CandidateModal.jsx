import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

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
            className="relative w-full max-w-[430px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-t-3xl sm:rounded-3xl overflow-hidden"
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
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-[var(--color-text)] hover:bg-black/70"
            >
              ✕
            </button>
            <PhotoOrPlaceholder candidate={candidate} />
            <div className="p-5">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-gold-light)] mb-1">
                {candidate.region}
              </div>
              <h3 className="font-display text-2xl">
                {candidate.prenom} {candidate.nom}
              </h3>
              <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                {candidate.age} ans · {candidate.ville}
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

function PhotoOrPlaceholder({ candidate }) {
  const [err, setErr] = useState(false)
  if (err || !candidate.photo) {
    return (
      <div className="w-full aspect-[4/5] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center text-[var(--color-gold)] text-6xl font-display">
        {candidate.prenom?.[0]}
        {candidate.nom?.[0]}
      </div>
    )
  }
  return (
    <img
      src={candidate.photo}
      alt={`${candidate.prenom} ${candidate.nom}`}
      className="w-full aspect-[4/5] object-cover"
      onError={() => setErr(true)}
    />
  )
}
