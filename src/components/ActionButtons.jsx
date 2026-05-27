import { NOTES, NOTE_ORDER } from '../utils/notes'

export default function ActionButtons({ onVote, disabled }) {
  return (
    <div className="flex items-center justify-center gap-4 px-6 py-4">
      {NOTE_ORDER.map((key) => {
        const n = NOTES[key]
        return (
          <button
            key={key}
            type="button"
            aria-label={n.label}
            disabled={disabled}
            onClick={() => onVote?.(key)}
            className="group relative w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-[var(--color-surface)] border border-[var(--color-border)] transition-transform active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: `0 6px 20px rgba(0,0,0,0.5), inset 0 0 0 1px ${n.hex}33` }}
          >
            <span
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: `radial-gradient(circle at center, ${n.hex}22, transparent 70%)` }}
            />
            <span className="relative">{n.emoji}</span>
          </button>
        )
      })}
    </div>
  )
}
