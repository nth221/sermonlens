import churchNameMap from '../data/original/churchNameMap.json';

const CHOSEONG = [
  'G', 'K', 'N', 'D', 'T', 'R', 'M', 'B', 'P', 'S', 'S', 'O', 'J', 'JJ', 'CH', 'K', 'T', 'P', 'H'
];

/**
 * Extracts the first alphabet letter from a given Korean string.
 * It takes the first character. If it's Korean, it maps to Choseong alphabet.
 * If it's English, it returns the uppercase letter.
 */
function getFirstAlphabet(name) {
  if (!name) return 'X';
  const firstChar = name.charAt(0);
  const code = firstChar.charCodeAt(0);
  
  // Hangul Syllable
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const choseongIndex = Math.floor((code - 0xAC00) / 588);
    return CHOSEONG[choseongIndex] || 'X';
  }
  
  // English Letter or other
  if (/[a-zA-Z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }
  
  return 'X';
}

export function isChurchNameRevealMode() {
  if (typeof window === 'undefined') return false;

  const pathSegments = window.location.pathname
    .split('/')
    .map(segment => segment.toLowerCase())
    .filter(Boolean);
  const params = new URLSearchParams(window.location.search);

  return (
    pathSegments.includes('screte') ||
    pathSegments.includes('secret') ||
    params.get('reveal') === '1'
  );
}

export function getChurchDisplayName(churchName, reveal = isChurchNameRevealMode()) {
  if (!churchName) return '알 수 없는 교회';
  if (reveal && churchNameMap[churchName]?.name) {
    return churchNameMap[churchName].name;
  }
  if (churchName.includes('교회')) return churchName;
  return `${churchName} 교회`;
}

/**
 * Returns the public-facing church label. On /screte, /secret, or ?reveal=1,
 * it resolves masked ids (e.g., "O-Sg") to the original church name.
 */
export function maskChurchName(churchName) {
  return getChurchDisplayName(churchName);
}

/**
 * Safely returns the sermon title.
 * Since the data is already masked (e.g., "O-Sg-0001"), 
 * we just return it as is.
 */
export function maskSermonTitle(sermonId) {
  return sermonId || '알 수 없는 설교';
}
