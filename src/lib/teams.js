// Canonical roster of the 32 teams that reached the knockout stage, with the
// Portuguese display names used throughout this app (Excel predictions,
// Firestore game docs) mapped to the English names football-data.org returns.

// `iso` is the ISO 3166-1 alpha-2 code used to build the flag emoji.
// England has no ISO code of its own (it isn't a sovereign country) — GB
// (Union Jack) is used as a pragmatic stand-in.
export const WORLDCUP_TEAMS = [
  { pt: 'Africa do Sul', en: 'South Africa', iso: 'ZA' },
  { pt: 'Canada', en: 'Canada', iso: 'CA' },
  { pt: 'Brasil', en: 'Brazil', iso: 'BR' },
  { pt: 'Japao', en: 'Japan', iso: 'JP' },
  { pt: 'Alemanha', en: 'Germany', iso: 'DE' },
  { pt: 'Paraguai', en: 'Paraguay', iso: 'PY' },
  { pt: 'Paises Baixos', en: 'Netherlands', iso: 'NL' },
  { pt: 'Marrocos', en: 'Morocco', iso: 'MA' },
  { pt: 'Costa do Marfim', en: 'Ivory Coast', iso: 'CI' },
  { pt: 'Noruega', en: 'Norway', iso: 'NO' },
  { pt: 'França', en: 'France', iso: 'FR' },
  { pt: 'Suécia', en: 'Sweden', iso: 'SE' },
  { pt: 'Mexico', en: 'Mexico', iso: 'MX' },
  { pt: 'Equador', en: 'Ecuador', iso: 'EC' },
  { pt: 'Inglaterra', en: 'England', iso: 'GB' },
  { pt: 'Congo', en: 'Congo DR', iso: 'CD' },
  { pt: 'Belgica', en: 'Belgium', iso: 'BE' },
  { pt: 'Senegal', en: 'Senegal', iso: 'SN' },
  { pt: 'Estados Unidos', en: 'United States', iso: 'US' },
  { pt: 'Bosnia', en: 'Bosnia-Herzegovina', iso: 'BA' },
  { pt: 'Espanha', en: 'Spain', iso: 'ES' },
  { pt: 'Austria', en: 'Austria', iso: 'AT' },
  { pt: 'Portugal', en: 'Portugal', iso: 'PT' },
  { pt: 'Croacia', en: 'Croatia', iso: 'HR' },
  { pt: 'Suiça', en: 'Switzerland', iso: 'CH' },
  { pt: 'Argélia', en: 'Algeria', iso: 'DZ' },
  { pt: 'Australia', en: 'Australia', iso: 'AU' },
  { pt: 'Egito', en: 'Egypt', iso: 'EG' },
  { pt: 'Argentina', en: 'Argentina', iso: 'AR' },
  { pt: 'Cabo Verde', en: 'Cape Verde Islands', iso: 'CV' },
  { pt: 'Colombia', en: 'Colombia', iso: 'CO' },
  { pt: 'Gana', en: 'Ghana', iso: 'GH' },
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

// ISO 3166-1 alpha-2 code -> flag emoji (two regional indicator symbols).
function isoToFlagEmoji(iso) {
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
}

// Flag emoji for a team name (Portuguese or English). Falls back to a
// neutral flag when the team isn't recognized (e.g. a "TBD" placeholder).
export function getFlag(teamName) {
  const n = normalize(teamName)
  const found = WORLDCUP_TEAMS.find(t => normalize(t.pt) === n || namesMatch(normalize(t.en), n))
  return found ? isoToFlagEmoji(found.iso) : '🏳️'
}
