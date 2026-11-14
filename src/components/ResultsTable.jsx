import { useState } from 'react'
import { NOTES } from '../utils/notes'

// L'entête et les lignes partagent la même grille pour rester alignées.
// L'app fait au plus 430 px de large : une seule grille compacte pour toutes les tailles.
const GRID = 'grid grid-cols-[36px_minmax(0,1.2fr)_minmax(0,1fr)_72px_32px] gap-2'

const COLS = [
  { key: 'photo', label: '', sortable: false },
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
      <div className={`${GRID} px-2 py-2 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] border-b border-[var(--color-border)]`}>
        {COLS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => c.sortable && toggleSort(c.key)}
            className={`text-left whitespace-nowrap ${c.sortable ? 'cursor-pointer hover:text-[var(--color-gold-light)]' : ''}`}
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
            className={`${GRID} items-center px-2 py-2.5`}
          >
            <button
              type="button"
              onClick={() => onOpenPhoto?.(row.candidate)}
              className="w-9 h-9 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]"
            >
              {row.candidate.photo ? (
                <img
                  src={row.candidate.photo}
                  referrerPolicy="no-referrer"
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ) : null}
            </button>
            <div className="min-w-0 text-sm leading-tight">
              <div className="truncate">{row.candidate.prenom}</div>
              <div className="truncate text-[var(--color-text-muted)] text-xs">{row.candidate.nom}</div>
            </div>
            <div className="min-w-0 text-xs text-[var(--color-text-muted)] truncate">
              {row.candidate.region}
            </div>
            <NoteBadge note={row.note} />
            <button
              type="button"
              aria-label={`Modifier la note de ${row.candidate.prenom} ${row.candidate.nom}`}
              onClick={() => onEdit?.(row.candidate)}
              className="h-8 flex items-center justify-center rounded-md border border-[var(--color-border)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold-light)]"
            >
              <PencilIcon />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
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
      <span>{meta.short}</span>
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
