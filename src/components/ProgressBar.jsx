export default function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="px-5 pt-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
        <span>{done} / {total} candidates notées</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))'
          }}
        />
      </div>
    </div>
  )
}
