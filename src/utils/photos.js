// Toutes les photos d'une candidate : `photos` (galerie) sinon `photo` seule.
export function photosOf(candidate) {
  if (!candidate) return []
  if (Array.isArray(candidate.photos) && candidate.photos.length) return candidate.photos
  return candidate.photo ? [candidate.photo] : []
}
