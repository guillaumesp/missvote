import { useCallback, useSyncExternalStore } from 'react'

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

// Store unique partagé par tous les composants : un vote émis sur l'écran
// Swipe met immédiatement à jour la navigation et l'écran Résultats.
let current = readVotes()
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

function setVotes(next) {
  current = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // stockage indisponible : on garde les votes en mémoire
  }
  emit()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return current
}

// Synchronisation entre onglets
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      current = readVotes()
      emit()
    }
  })
}

export function useVotes() {
  const votes = useSyncExternalStore(subscribe, getSnapshot)

  const vote = useCallback((candidateId, note) => {
    setVotes({ ...current, [candidateId]: note })
  }, [])

  const editVote = vote

  const removeVote = useCallback((candidateId) => {
    const next = { ...current }
    delete next[candidateId]
    setVotes(next)
  }, [])

  const resetVotes = useCallback(() => {
    setVotes({})
  }, [])

  return { votes, vote, editVote, removeVote, resetVotes }
}
