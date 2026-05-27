import * as XLSX from 'xlsx'
import { noteMeta } from './notes'

export function exportToExcel(candidates, votes, editionLabel = 'Miss France') {
  const rows = candidates.map((c, i) => {
    const v = votes[c.id]
    const m = v ? noteMeta(v) : null
    return {
      'N°': i + 1,
      Prénom: c.prenom,
      Nom: c.nom,
      Région: c.region,
      Âge: c.age,
      Ville: c.ville,
      Instagram: c.instagram ? `@${c.instagram}` : '',
      Note: m ? m.label : '—'
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 4 },
    { wch: 14 },
    { wch: 18 },
    { wch: 22 },
    { wch: 5 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 }
  ]

  // Color rows by note (Sheet.js community fills aren't always honored, but
  // we set them so xlsx-friendly viewers / Excel display them).
  const colorByNote = {
    super_like: 'FFC9A84C',
    like: 'FF3DAF72',
    moyen: 'FF6B6B6B',
    moche: 'FFC0392B'
  }
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let R = 1; R <= range.e.r; ++R) {
    const candidate = candidates[R - 1]
    const v = votes[candidate.id]
    const fillColor = colorByNote[v]
    if (!fillColor) continue
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C })
      if (!ws[addr]) continue
      ws[addr].s = {
        fill: { patternType: 'solid', fgColor: { rgb: fillColor } },
        font: { color: { rgb: 'FFFFFFFF' }, bold: false }
      }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Notes')
  const filename = `${editionLabel.replace(/\s+/g, '_')}_notes.xlsx`
  XLSX.writeFile(wb, filename)
}
