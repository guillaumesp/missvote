import { useCallback, useEffect, useState } from 'react'

import data from '../assets/candidates.json'

// Une clé par édition : les votes d'une année ne se mélangent pas à la suivante
// (les ids 001, 002… sont réutilisés d'une édition à l'autre).
const STORAGE_KEY = `missVote_votes_${data.annee}`

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
