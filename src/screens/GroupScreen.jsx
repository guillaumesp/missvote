import { useMemo, useState } from 'react'
import data from '../assets/candidates.json'
import CandidateModal from '../components/CandidateModal'
import { NoteBadge } from '../components/ResultsTable'
import { useVotes } from '../hooks/useVotes'
import { NOTES, NOTE_ORDER } from '../utils/notes'
import {
  DEFAULT_ROOM,
  PSEUDO_MAX,
  joinGroup,
  leaveGroup,
  normalizeRoom,
  selfId,
  useGroup
} from '../p2p/group'

// Points utilisés pour le classement du groupe
const POINTS = { super_like: 3, like: 2, moyen: 1, moche: 0 }
const MAX_POINTS = 3

export default function GroupScreen() {
  const group = useGroup()
  const { votes } = useVotes()
  const [editing, setEditing] = useState(false)

  if (!group.profile || editing) {
    return (
      <JoinForm
        initial={group.profile}
        onCancel={group.profile ? () => setEditing(false) : null}
        onJoin={(pseudo, room) => {
          joinGroup(pseudo, room)
          setEditing(false)
        }}
      />
    )
  }

  return <GroupView group={group} myVotes={votes} onEdit={() => setEditing(true)} />
}

function Header({ children }) {
  return (
    <header className="px-5 pt-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-light)]">
        {data.edition}
      </div>
      <h1 className="font-display text-2xl mt-0.5">{children}</h1>
    </header>
  )
}

function JoinForm({ initial, onJoin, onCancel }) {
  const [pseudo, setPseudo] = useState(initial?.pseudo || '')
  const [room, setRoom] = useState(initial && initial.room !== DEFAULT_ROOM ? initial.room : '')
  const valid = pseudo.trim().length > 0

  return (
    <div className="pb-[80px]">
      <Header>Groupe</Header>
      <form
        className="px-5 mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onJoin(pseudo, room)
        }}
      >
        <p className="text-sm text-[var(--color-text-muted)]">
          Choisis un pseudo pour comparer tes notes en direct avec les personnes connectées en même temps que toi.
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Pseudo</span>
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={PSEUDO_MAX}
            autoFocus
            autoComplete="nickname"
            placeholder="Ex. Julie"
            className="px-3 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-gold)] placeholder:text-[var(--color-text-muted)]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Code du salon <span className="normal-case tracking-normal">(facultatif)</span>
          </span>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            maxLength={32}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={DEFAULT_ROOM}
            className="px-3 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm outline-none focus:border-[var(--color-gold)] placeholder:text-[var(--color-text-muted)]"
          />
          <span className="text-xs text-[var(--color-text-muted)]">
            Sans code, tu rejoins le salon public. Avec un code (ex. <em>famille-dupont</em>), seules les
            personnes qui ont le même code te verront.
            {room && normalizeRoom(room) !== room.trim() && (
              <> Code utilisé : <strong>{normalizeRoom(room)}</strong></>
            )}
          </span>
        </label>

        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-sm border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{
              background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))',
              color: 'var(--color-text)'
            }}
          >
            {initial ? 'Enregistrer' : 'Rejoindre'}
          </button>
        </div>
      </form>
    </div>
  )
}

function GroupView({ group, myVotes, onEdit }) {
  const [view, setView] = useState('group') // 'group' | peerId
  const [modalCandidate, setModalCandidate] = useState(null)

  const members = useMemo(() => {
    const others = Object.entries(group.peers)
      .map(([id, p]) => ({ id, pseudo: p.pseudo, votes: p.votes, me: false }))
      .sort((a, b) => a.pseudo.localeCompare(b.pseudo))
    return [{ id: selfId, pseudo: group.profile.pseudo, votes: myVotes, me: true }, ...others]
  }, [group.peers, group.profile.pseudo, myVotes])

  // Si la personne affichée se déconnecte, on revient au classement du groupe
  const selected = members.find((m) => m.id === view)
  const current = selected ? view : 'group'

  return (
    <div className="pb-[80px]">
      <Header>Groupe</Header>

      <div className="px-5 mt-3 flex items-center gap-2 text-xs">
        <StatusPill status={group.status} count={members.length} />
        <span className="text-[var(--color-text-muted)] truncate">
          Salon <strong className="text-[var(--color-text)]">{group.profile.room}</strong>
        </span>
        <div className="ml-auto flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={leaveGroup}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
          >
            Quitter
          </button>
        </div>
      </div>

      <div className="px-4 mt-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-1">
          <Chip active={current === 'group'} onClick={() => setView('group')}>
            👥 Groupe
          </Chip>
          {members.map((m) => (
            <Chip key={m.id} active={current === m.id} onClick={() => setView(m.id)}>
              {m.me ? `${m.pseudo} (moi)` : m.pseudo}
              <span className="ml-1 opacity-60 tabular-nums">{Object.keys(m.votes).length}</span>
            </Chip>
          ))}
        </div>
      </div>

      {members.length === 1 && (
        <p className="mx-5 mt-4 p-3 rounded-xl bg-[var(--color-surface-2)] text-xs text-[var(--color-text-muted)]">
          {group.status === 'searching'
            ? 'Recherche des autres participants… Ils apparaîtront ici dès qu’ils ouvriront l’onglet Groupe avec le même code de salon.'
            : 'Personne d’autre n’est connecté pour l’instant.'}
        </p>
      )}

      <div className="mt-3 px-3">
        {current === 'group' ? (
          <GroupRanking members={members} onOpen={setModalCandidate} />
        ) : (
          <PersonRanking member={selected} onOpen={setModalCandidate} />
        )}
      </div>

      <CandidateModal candidate={modalCandidate} onClose={() => setModalCandidate(null)} />
    </div>
  )
}

function StatusPill({ status, count }) {
  const connected = status === 'connected'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border shrink-0"
      style={{
        borderColor: connected ? '#3DAF7255' : 'var(--color-border)',
        background: connected ? '#3DAF7215' : 'transparent'
      }}
    >
      <span
        className={`w-2 h-2 rounded-full ${connected ? '' : 'animate-pulse'}`}
        style={{ background: connected ? '#3DAF72' : 'var(--color-gold-light)' }}
      />
      <span className="tabular-nums">
        {count} connecté{count > 1 ? 's' : ''}
      </span>
    </span>
  )
}

function GroupRanking({ members, onOpen }) {
  const rows = useMemo(() => {
    return data.candidates
      .map((c) => {
        const counts = Object.fromEntries(NOTE_ORDER.map((k) => [k, 0]))
        let total = 0
        let n = 0
        members.forEach((m) => {
          const note = m.votes[c.id]
          if (!note) return
          counts[note] += 1
          total += POINTS[note]
          n += 1
        })
        return { candidate: c, counts, n, avg: n ? total / n : null }
      })
      .sort((a, b) => {
        if (a.avg === null || b.avg === null) return a.avg === null ? (b.avg === null ? 0 : 1) : -1
        return b.avg - a.avg || b.n - a.n || a.candidate.prenom.localeCompare(b.candidate.prenom)
      })
  }, [members])

  let rank = 0
  let prev = null
  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {rows.map((r, i) => {
        // Ex aequo : même moyenne et même nombre de votes = même rang
        const key = r.avg === null ? null : `${r.avg}-${r.n}`
        if (key !== prev) rank = i + 1
        prev = key
        return (
          <Row key={r.candidate.id} rank={r.avg === null ? null : rank} candidate={r.candidate} onOpen={onOpen}>
            {r.avg === null ? (
              <span className="text-xs text-[var(--color-text-muted)]/60 italic">Pas encore noté</span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-14 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(r.avg / MAX_POINTS) * 100}%`,
                        background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-7 text-right">
                    {((r.avg / MAX_POINTS) * 10).toFixed(1).replace('.', ',')}
                  </span>
                </div>
                <div className="flex gap-1.5 text-[10px] text-[var(--color-text-muted)] tabular-nums">
                  {NOTE_ORDER.filter((k) => r.counts[k]).map((k) => (
                    <span key={k}>
                      {NOTES[k].emoji}
                      {r.counts[k]}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Row>
        )
      })}
    </ul>
  )
}

function PersonRanking({ member, onOpen }) {
  const rows = useMemo(
    () =>
      data.candidates
        .map((c) => ({ candidate: c, note: member.votes[c.id] || null }))
        .sort((a, b) => {
          const av = a.note ? NOTES[a.note].order : 99
          const bv = b.note ? NOTES[b.note].order : 99
          return av - bv || a.candidate.prenom.localeCompare(b.candidate.prenom)
        }),
    [member]
  )

  let rank = 0
  let prev = null
  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {rows.map((r, i) => {
        if (r.note !== prev) rank = i + 1
        prev = r.note
        return (
          <Row key={r.candidate.id} rank={r.note ? rank : null} candidate={r.candidate} onOpen={onOpen}>
            <NoteBadge note={r.note} />
          </Row>
        )
      })}
    </ul>
  )
}

function Row({ rank, candidate, onOpen, children }) {
  return (
    <li className="grid grid-cols-[24px_36px_minmax(0,1fr)_auto] gap-2 items-center px-2 py-2.5">
      <span className="text-xs text-[var(--color-text-muted)] tabular-nums text-right">{rank ?? '–'}</span>
      <button
        type="button"
        onClick={() => onOpen(candidate)}
        aria-label={`Voir ${candidate.prenom} ${candidate.nom}`}
        className="w-9 h-9 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)]"
      >
        {candidate.photo && (
          <img
            src={candidate.photo}
            referrerPolicy="no-referrer"
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
      </button>
      <button type="button" onClick={() => onOpen(candidate)} className="min-w-0 text-left leading-tight">
        <div className="text-sm truncate">
          {candidate.prenom} <span className="text-[var(--color-text-muted)]">{candidate.nom}</span>
        </div>
        <div className="text-xs text-[var(--color-text-muted)] truncate">{candidate.region}</div>
      </button>
      {children}
    </li>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap"
      style={{
        background: active ? 'var(--color-gold)' : 'transparent',
        borderColor: active ? 'var(--color-gold)' : 'var(--color-border)'
      }}
    >
      {children}
    </button>
  )
}
