import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeCard from '../components/SwipeCard'
import ActionButtons from '../components/ActionButtons'
import ProgressBar from '../components/ProgressBar'
import data from '../assets/candidates.json'
import { useVotes } from '../hooks/useVotes'

export default function SwipeScreen() {
  const { votes, vote, resetVotes } = useVotes()

  const remaining = useMemo(
    () => data.candidates.filter((c) => !(c.id in votes)),
    [votes]
  )

  const top = remaining[0]
  const next = remaining[1]
  const done = data.candidates.length - remaining.length

  const handleVote = (note) => {
    if (!top) return
    // Trigger card fly-off; the SwipeCard records the vote via callback
    window.dispatchEvent(
      new CustomEvent('missvote:swipe', { detail: { id: top.id, note } })
    )
  }

  const handleSwiped = (candidate, note) => {
    vote(candidate.id, note)
  }

  return (
    <div
      className="flex flex-col h-[100dvh] overflow-hidden"
      style={{ paddingBottom: 'calc(58px + env(safe-area-inset-bottom))' }}
    >
      <header className="px-5 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-gold-light)] leading-none">
          {data.edition}
        </div>
      </header>

      <ProgressBar done={done} total={data.candidates.length} />

      <div className="flex-1 min-h-0 relative px-5 mt-3">
        {top ? (
          <div className="relative w-full h-full max-w-[400px] mx-auto">
            <AnimatePresence>
              {next && (
                <SwipeCard
                  key={next.id}
                  candidate={next}
                  isTop={false}
                  stackIndex={1}
                />
              )}
              <SwipeCard
                key={top.id}
                candidate={top}
                isTop
                onSwipe={handleSwiped}
              />
            </AnimatePresence>
          </div>
        ) : (
          <EmptyState onReset={resetVotes} />
        )}
      </div>

      {top && <ActionButtons onVote={handleVote} />}
    </div>
  )
}

function EmptyState({ onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col items-center justify-center text-center px-6"
    >
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="font-display text-2xl mb-2">
        Toutes les candidates ont été notées
      </h2>
      <p className="text-sm text-[var(--color-text-muted)] mb-8 max-w-xs">
        Bravo ! Tu peux consulter ton classement ou tout recommencer.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          to="/results"
          className="py-3 rounded-xl text-center font-medium"
          style={{
            background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))',
            color: 'var(--color-text)'
          }}
        >
          Voir les résultats
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="py-3 rounded-xl text-sm border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]"
        >
          Recommencer
        </button>
      </div>
    </motion.div>
  )
}
