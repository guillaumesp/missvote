import { AnimatePresence, motion } from 'framer-motion'
import { NOTES, NOTE_ORDER } from '../utils/notes'

export default function EditVoteModal({ candidate, currentVote, onClose, onSelect }) {
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
            <div className="flex gap-4 p-5 pb-3">
              <Mini candidate={candidate} />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-gold-light)] mb-0.5">
                  {candidate.region}
                </div>
                <h3 className="font-display text-xl leading-tight truncate">
                  {candidate.prenom} {candidate.nom}
                </h3>
                <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {candidate.age} ans · {candidate.ville}
                </div>
              </div>
            </div>
            <div className="px-5 pb-2 text-xs text-[var(--color-text-muted)]">Choisis une note :</div>
            <div className="grid grid-cols-2 gap-2 p-5 pt-2">
              {NOTE_ORDER.map((key) => {
                const n = NOTES[key]
                const active = currentVote === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelect?.(key)}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95"
                    style={{
                      borderColor: active ? n.hex : 'var(--color-border)',
                      background: active ? `${n.hex}1a` : 'var(--color-surface-2)',
                      boxShadow: active ? `0 0 0 2px ${n.hex}55 inset` : 'none'
                    }}
                  >
                    <span className="text-xl">{n.emoji}</span>
                    <span className="text-sm font-medium" style={{ color: active ? n.hex : 'var(--color-text)' }}>
                      {n.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Mini({ candidate }) {
  return (
    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-border)] shrink-0 bg-[var(--color-surface-2)]">
      {candidate.photo ? (
        <img
          src={candidate.photo}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      ) : null}
    </div>
  )
}
