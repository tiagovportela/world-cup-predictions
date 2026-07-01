// Canonical roster of the 32 teams that reached the knockout stage, with the
// Portuguese display names used throughout this app (Excel predictions,
// Firestore game docs) mapped to the English names football-data.org returns.

export const WORLDCUP_TEAMS = [
  { pt: 'Africa do Sul', en: 'South Africa' },
  { pt: 'Canada', en: 'Canada' },
  { pt: 'Brasil', en: 'Brazil' },
  { pt: 'Japao', en: 'Japan' },
  { pt: 'Alemanha', en: 'Germany' },
  { pt: 'Paraguai', en: 'Paraguay' },
  { pt: 'Paises Baixos', en: 'Netherlands' },
  { pt: 'Marrocos', en: 'Morocco' },
  { pt: 'Costa do Marfim', en: 'Ivory Coast' },
  { pt: 'Noruega', en: 'Norway' },
  { pt: 'França', en: 'France' },
  { pt: 'Suécia', en: 'Sweden' },
  { pt: 'Mexico', en: 'Mexico' },
  { pt: 'Equador', en: 'Ecuador' },
  { pt: 'Inglaterra', en: 'England' },
  { pt: 'Congo', en: 'Congo DR' },
  { pt: 'Belgica', en: 'Belgium' },
  { pt: 'Senegal', en: 'Senegal' },
  { pt: 'Estados Unidos', en: 'United States' },
  { pt: 'Bosnia', en: 'Bosnia-Herzegovina' },
  { pt: 'Espanha', en: 'Spain' },
  { pt: 'Austria', en: 'Austria' },
  { pt: 'Portugal', en: 'Portugal' },
  { pt: 'Croacia', en: 'Croatia' },
  { pt: 'Suiça', en: 'Switzerland' },
  { pt: 'Argélia', en: 'Algeria' },
  { pt: 'Australia', en: 'Australia' },
  { pt: 'Egito', en: 'Egypt' },
  { pt: 'Argentina', en: 'Argentina' },
  { pt: 'Cabo Verde', en: 'Cape Verde Islands' },
  { pt: 'Colombia', en: 'Colombia' },
  { pt: 'Gana', en: 'Ghana' },
]

export function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .trim()
}

function namesMatch(a, b) {
  return a.includes(b) || b.includes(a)
}

// Translate a Portuguese team name to its normalized English equivalent.
// Falls back to the normalized original if not in the roster.
export function toEnglish(ptName) {
  const n = normalize(ptName)
  const found = WORLDCUP_TEAMS.find(t => normalize(t.pt) === n)
  return normalize(found ? found.en : ptName)
}

// Translate an English team name (e.g. from football-data.org) to the
// proper-cased Portuguese display name used in this app. Falls back to the
// raw English name if no match is found. Empty/null input (e.g. a fixture
// whose bracket slot isn't decided yet) is returned as-is rather than
// matched — normalize('') is '', which is a substring of every team name
// and would otherwise "match" the first roster entry.
export function toPortuguese(enName) {
  if (!enName) return enName
  const n = normalize(enName)
  const found = WORLDCUP_TEAMS.find(t => namesMatch(normalize(t.en), n))
  return found ? found.pt : enName
}
