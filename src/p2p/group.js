import { useSyncExternalStore } from 'react'
import { joinRoom, selfId } from 'trystero'

import data from '../assets/candidates.json'
import { NOTES } from '../utils/notes'
import { getVotes, subscribeVotes } from '../hooks/useVotes'

/**
 * Groupe pair-à-pair, sans serveur applicatif.
 *
 * Chaque appareil se connecte directement aux autres en WebRTC (maillage
 * complet). Il n'y a pas d'hôte : chaque pair garde la liste des pairs
 * connectés et leurs votes, et diffuse lui-même son profil. Quand quelqu'un
 * se déconnecte, les autres continuent sans lui ; il n'y a donc pas de
 * relais à élire.
 *
 * La mise en relation initiale (échange des offres WebRTC, chiffrées)
 * passe par des relais Nostr publics via Trystero. Une fois connectés, les
 * pairs échangent leurs données directement.
 */

const APP_ID = `digitalways-missvote-${data.annee}`
const PROFILE_KEY = 'missVote_profile'
const HEARTBEAT_MS = 10_000
const PEER_TIMEOUT_MS = 35_000
const RECONNECT_CHECK_MS = 20_000
// Un seul salon pour toute l'app : tous les utilisateurs connectés se voient
const ROOM_ID = 'salon-principal'
export const PSEUDO_MAX = 24

const candidateIds = new Set(data.candidates.map((c) => c.id))

function readProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
    if (p && typeof p.pseudo === 'string' && p.pseudo.trim()) {
      return { pseudo: p.pseudo.trim().slice(0, PSEUDO_MAX) }
    }
  } catch {
    // stockage indisponible ou corrompu
  }
  return null
}

function writeProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_KEY)
  } catch {
    // stockage indisponible : le profil reste en mémoire pour cette session
  }
}

// Ne garde que des données valides venant d'un pair (personne n'est de confiance)
function sanitize(payload) {
  if (!payload || typeof payload !== 'object') return null
  const pseudo = typeof payload.pseudo === 'string' ? payload.pseudo.trim().slice(0, PSEUDO_MAX) : ''
  if (!pseudo) return null
  const votes = {}
  if (payload.votes && typeof payload.votes === 'object') {
    for (const [id, note] of Object.entries(payload.votes)) {
      if (candidateIds.has(id) && Object.hasOwn(NOTES, note)) votes[id] = note
    }
  }
  return { pseudo, votes }
}

// ---- Store ----

let state = {
  profile: readProfile(),
  status: 'idle', // 'idle' | 'searching' | 'connected'
  peers: {} // peerId -> { pseudo, votes, seen }
}
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useGroup() {
  return useSyncExternalStore(subscribe, () => state)
}

// ---- Connexion ----

let room = null
let sendProfile = null
let timers = []
let unsubscribeVotes = null
let lastPeerSeenAt = 0

function myPayload() {
  return { pseudo: state.profile?.pseudo, votes: getVotes() }
}

function upsertPeer(peerId, profile) {
  const peers = { ...state.peers, [peerId]: { ...profile, seen: Date.now() } }
  lastPeerSeenAt = Date.now()
  setState({ peers, status: 'connected' })
}

function removePeer(peerId) {
  if (!(peerId in state.peers)) return
  const peers = { ...state.peers }
  delete peers[peerId]
  setState({ peers, status: Object.keys(peers).length ? 'connected' : 'searching' })
}

function broadcast() {
  if (!sendProfile || !state.profile) return
  try {
    sendProfile(myPayload())
  } catch {
    // canal fermé pendant une reconnexion : le prochain battement réessaiera
  }
}

function connect() {
  const { profile } = state
  if (!profile || room) return

  room = joinRoom(
    { appId: APP_ID, relayConfig: { warnOnRelayFailure: false } },
    ROOM_ID
  )
  const action = room.makeAction('profile')
  sendProfile = (payload, opts) => action.send(payload, opts)

  action.onMessage = (payload, { peerId }) => {
    const p = sanitize(payload)
    if (p) upsertPeer(peerId, p)
  }

  // Un nouveau venu reçoit tout de suite notre profil
  room.onPeerJoin = (peerId) => {
    try {
      action.send(myPayload(), { target: peerId })
    } catch {
      // le pair est reparti entre-temps
    }
  }
  room.onPeerLeave = removePeer

  setState({ status: 'searching', peers: {} })
  lastPeerSeenAt = Date.now()

  // Nos votes changent : on les diffuse (regroupés pour ne pas saturer)
  let debounce = null
  unsubscribeVotes = subscribeVotes(() => {
    clearTimeout(debounce)
    debounce = setTimeout(broadcast, 250)
  })

  timers = [
    // Battement de cœur : maintient les profils à jour même si un message s'est perdu
    setInterval(broadcast, HEARTBEAT_MS),
    // Retire les pairs muets (onglet fermé brutalement, réseau coupé…)
    setInterval(() => {
      const now = Date.now()
      Object.entries(state.peers).forEach(([id, p]) => {
        if (now - p.seen > PEER_TIMEOUT_MS) removePeer(id)
      })
    }, 5_000),
    // Personne depuis un moment alors que d'autres pairs étaient là : on se reconnecte
    setInterval(() => {
      if (!Object.keys(state.peers).length && Date.now() - lastPeerSeenAt > RECONNECT_CHECK_MS * 3) {
        reconnect()
      }
    }, RECONNECT_CHECK_MS)
  ]
  timers.debounce = () => clearTimeout(debounce)
}

function disconnect() {
  timers.forEach(clearInterval)
  timers.debounce?.()
  timers = []
  unsubscribeVotes?.()
  unsubscribeVotes = null
  sendProfile = null
  try {
    room?.leave()
  } catch {
    // déjà fermée
  }
  room = null
}

function reconnect() {
  if (!state.profile) return
  disconnect()
  connect()
}

export function joinGroup(pseudo) {
  const profile = { pseudo: String(pseudo).trim().slice(0, PSEUDO_MAX) }
  if (!profile.pseudo) return
  writeProfile(profile)
  setState({ profile })
  // Déjà connecté : un simple changement de pseudo est diffusé aux autres
  if (room) broadcast()
  else connect()
}

export function leaveGroup() {
  disconnect()
  writeProfile(null)
  setState({ profile: null, status: 'idle', peers: {} })
}

export { selfId }

if (typeof window !== 'undefined') {
  // Reconnexion automatique au chargement si un pseudo est enregistré
  if (state.profile) connect()

  // Retour du réseau : on repart sur une connexion propre
  window.addEventListener('online', () => setTimeout(reconnect, 1_000))
  // Retour sur l'onglet (mobile mis en veille) : on se signale tout de suite
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') broadcast()
  })
  // Fermeture / mise en cache de la page : on prévient les autres pairs,
  // et on revient si le navigateur restaure la page depuis son cache
  window.addEventListener('pagehide', disconnect)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted && state.profile) {
      setState({ peers: {} })
      connect()
    }
  })
}
