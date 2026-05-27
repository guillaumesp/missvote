import { useState } from 'react'
import { NOTES } from '../utils/notes'

const COLS = [
  { key: 'photo', label: '', sortable: false, width: 'w-12' },
  { key: 'name', label: 'Candidate', sortable: true },
  { key: 'region', label: 'Région', sortable: true },
  { key: 'note', label: 'Note', sortable: true },
  { key: 'action', label: '', sortable: false }
]

export default function ResultsTable({ rows, onOpenPhoto, onEdit }) {
  const [sort, setSort] = useState({ key: 'note', dir: 'asc' })

  const sorted = [...rows].sort((a, b) => sortRows(a, b, sort))

  const toggleSort = (key) => {
    setSort((s) => {
      if (s.key !== key) return { key, dir: 'asc' }
      return { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    })
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-[var(--color-text-muted)]">
        Aucune note pour l'instant
      </div>
    )
  }

  return (
    <div className="px-3">
      <div className="grid grid-cols-[40px_1fr_90px_90px_60px] gap-2 px-2 py-2 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
        {COLS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => c.sortable && toggleSort(c.key)}
            className={`text-left ${c.sortable ? 'cursor-pointer hover:text-[var(--color-gold-light)]' : ''}`}
          >
            {c.label}
            {c.sortable && sort.key === c.key && (
              <span className="ml-1">{sort.dir === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {sorted.map((row) => (
          <li
            key={row.candidate.id}
            className="grid grid-cols-[40px_1fr_90px_90px_60px] gap-2 items-center px-2 py-2.5"
          >
            <button
              type="button"
              onClick={() => onOpenPhoto?.(row.candidate)}
              className="w-10 h-10 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            >
              {row.candidate.photo ? (
                <img
                  src={row.candidate.photo}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : null}
            </button>
            <div className="min-w-0">
              <div className="text-sm truncate">
                {row.candidate.prenom} <span className="text-[var(--color-text-muted)]">{row.candidate.nom}</span>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] truncate sm:hidden">
                {row.candidate.region}
              </div>
            </div>
            <div className="text-xs text-[var(--color-text-muted)] truncate hidden sm:block">
              {row.candidate.region}
            </div>
            <NoteBadge note={row.note} />
            <button
              type="button"
              onClick={() => onEdit?.(row.candidate)}
              className="text-[11px] px-2 py-1 rounded-md border border-[var(--color-border)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-light)]"
            >
              Modifier
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NoteBadge({ note }) {
  if (!note) {
    return (
      <span className="text-xs text-[var(--color-text-muted)]/60 italic">—</span>
    )
  }
  const meta = NOTES[note]
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium"
      style={{
        background: `${meta.hex}22`,
        color: meta.hex,
        border: `1px solid ${meta.hex}55`
      }}
    >
      <span className="text-[10px]">{meta.emoji}</span>
      <span className="hidden sm:inline">{meta.label}</span>
      <span className="sm:hidden">{meta.short}</span>
    </span>
  )
}

function sortRows(a, b, sort) {
  const dir = sort.dir === 'asc' ? 1 : -1
  if (sort.key === 'name') {
    return a.candidate.prenom.localeCompare(b.candidate.prenom) * dir
  }
  if (sort.key === 'region') {
    return a.candidate.region.localeCompare(b.candidate.region) * dir
  }
  if (sort.key === 'note') {
    const av = a.note ? NOTES[a.note].order : 99
    const bv = b.note ? NOTES[b.note].order : 99
    if (av !== bv) return (av - bv) * dir
    return a.candidate.prenom.localeCompare(b.candidate.prenom)
  }
  return 0
}
