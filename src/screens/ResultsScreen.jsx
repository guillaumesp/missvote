import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ResultsTable from '../components/ResultsTable'
import CandidateModal from '../components/CandidateModal'
import EditVoteModal from '../components/EditVoteModal'
import ResetConfirmModal from '../components/ResetConfirmModal'
import data from '../assets/candidates.json'
import { useVotes } from '../hooks/useVotes'
import { NOTES, NOTE_ORDER } from '../utils/notes'
import { exportToExcel } from '../utils/exportExcel'

export default function ResultsScreen() {
  const { votes, editVote, resetVotes } = useVotes()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | note key | 'none'
  const [photoCandidate, setPhotoCandidate] = useState(null)
  const [editCandidate, setEditCandidate] = useState(null)
  const [resetOpen, setResetOpen] = useState(false)
  const navigate = useNavigate()

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.candidates
      .map((c) => ({ candidate: c, note: votes[c.id] || null }))
      .filter((r) => {
        if (filter !== 'all') {
          if (filter === 'none' && r.note) return false
          if (filter !== 'none' && r.note !== filter) return false
        }
        if (!q) return true
        return (
          r.candidate.prenom.toLowerCase().includes(q) ||
          r.candidate.nom.toLowerCase().includes(q) ||
          r.candidate.region.toLowerCase().includes(q)
        )
      })
  }, [votes, search, filter])

  const handleConfirmReset = () => {
    resetVotes()
    setResetOpen(false)
    navigate('/')
  }

  return (
    <div className="pb-[80px]">
      <header className="px-5 pt-5">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
          {data.edition}
        </div>
        <h1 className="font-display text-2xl mt-0.5">Mes notes</h1>
      </header>

      <div className="px-5 mt-4 flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, région...)"
          className="flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-gold)] placeholder:text-[var(--color-text-muted)]"
        />
      </div>

      <div className="px-4 mt-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-1">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="Toutes" />
          {NOTE_ORDER.map((key) => {
            const n = NOTES[key]
            return (
              <Chip
                key={key}
                active={filter === key}
                onClick={() => setFilter(key)}
                label={`${n.emoji} ${n.label}`}
                color={n.hex}
              />
            )
          })}
          <Chip active={filter === 'none'} onClick={() => setFilter('none')} label="— Non noté" />
        </div>
      </div>

      <div className="px-5 mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => exportToExcel(data.candidates, votes, data.edition)}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))',
            color: 'var(--color-text)'
          }}
        >
          Exporter Excel
        </button>
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
        >
          Réinitialiser
        </button>
      </div>

      <div className="mt-5">
        <ResultsTable
          rows={rows}
          onOpenPhoto={setPhotoCandidate}
          onEdit={setEditCandidate}
        />
      </div>

      <CandidateModal
        candidate={photoCandidate}
        onClose={() => setPhotoCandidate(null)}
      />

      <EditVoteModal
        candidate={editCandidate}
        currentVote={editCandidate ? votes[editCandidate.id] : null}
        onClose={() => setEditCandidate(null)}
        onSelect={(note) => {
          if (editCandidate) editVote(editCandidate.id, note)
          setEditCandidate(null)
        }}
      />

      <ResetConfirmModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}

function Chip({ active, onClick, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap"
      style={{
        background: active ? (color ? `${color}22` : 'var(--color-gold)') : 'transparent',
        color: active ? (color || 'var(--color-text)') : 'var(--color-text)',
        borderColor: active ? (color || 'var(--color-gold)') : 'var(--color-border)'
      }}
    >
      {label}
    </button>
  )
}
