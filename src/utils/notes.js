export const NOTES = {
  super_like: {
    key: 'super_like',
    label: 'Super Like',
    short: 'Super',
    emoji: '⭐',
    color: 'var(--color-super-like)',
    hex: '#C9A84C',
    order: 0
  },
  like: {
    key: 'like',
    label: 'Like',
    short: 'Like',
    emoji: '💚',
    color: 'var(--color-like)',
    hex: '#3DAF72',
    order: 1
  },
  moyen: {
    key: 'moyen',
    label: 'Moyen',
    short: 'Moyen',
    emoji: '😐',
    color: 'var(--color-moyen)',
    hex: '#6B6B6B',
    order: 2
  },
  moche: {
    key: 'moche',
    label: 'Moche',
    short: 'Moche',
    emoji: '❌',
    color: 'var(--color-moche)',
    hex: '#C0392B',
    order: 3
  }
}

export const NOTE_ORDER = ['super_like', 'like', 'moyen', 'moche']

export function noteMeta(key) {
  return NOTES[key] || null
}
