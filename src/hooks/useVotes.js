import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'missVote_votes'

function readVotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeVotes(votes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
}

export function useVotes() {
  const [votes, setVotes] = useState(readVotes)

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setVotes(readVotes())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const vote = useCallback((candidateId, note) => {
    setVotes((prev) => {
      const next = { ...prev, [candidateId]: note }
      writeVotes(next)
      return next
    })
  }, [])

  const editVote = useCallback((candidateId, note) => {
    vote(candidateId, note)
  }, [vote])

  const removeVote = useCallback((candidateId) => {
    setVotes((prev) => {
      const next = { ...prev }
      delete next[candidateId]
      writeVotes(next)
      return next
    })
  }, [])

  const resetVotes = useCallback(() => {
    writeVotes({})
    setVotes({})
  }, [])

  return { votes, vote, editVote, removeVote, resetVotes }
}
