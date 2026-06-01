import fs from 'fs';
import path from 'path';

const sourceDir = 'C:\\Users\\jyjoo\\Desktop\\SermonLens\\C-Picker\\data\\step06_a\\results_combined';
const targetDir = path.join(process.cwd(), 'src', 'data');
const targetFile = path.join(targetDir, 'sermonData.json');

// ─── Masking Logic (mirrors masking.js) ──────────────────────────────────────
const CHOSEONG = [
  'G', 'K', 'N', 'D', 'T', 'R', 'M', 'B', 'P', 'S', 'S', 'O', 'J', 'JJ', 'CH', 'K', 'T', 'P', 'H'
];

function getFirstAlphabet(name) {
  if (!name) return 'X';
  const cleanName = name.trim().replace(/^[^a-zA-Z가-힣]+/, '');
  if (!cleanName) return 'X';
  const firstChar = cleanName.charAt(0);
  const code = firstChar.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const choseongIndex = Math.floor((code - 0xAC00) / 588);
    return CHOSEONG[choseongIndex] || 'X';
  }
  if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase();
  return 'X';
}

/**
 * church_name + channel_id → "초성-ID끝2자리" (예: S-hw)
 */
function maskChurch(churchName, channelId) {
  const firstAlpha = getFirstAlphabet(churchName || '');
  const tail = (channelId || '').length >= 2 ? channelId.slice(-2) : 'XX';
  return `${firstAlpha}-${tail}`;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));
const aggregatedData = [];

for (const file of files) {
  const filePath = path.join(sourceDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Build masked church ID from church_name + channel_id
    const maskedChurchId = maskChurch(data.church_name, data.channel_id);

    // Anonymize each sermon in the nested sermons array
    const maskedSermons = (data.sermons || []).map((sermon, idx) => {
      const maskedSermonId = `${maskedChurchId}-${String(idx + 1).padStart(4, '0')}`;
      return {
        sermon_id: maskedSermonId,   // masked sequential ID
        scores: sermon.scores        // keep only the scores, drop video_id & title
      };
    });

    aggregatedData.push({
      church: maskedChurchId,               // masked church ID
      total_sermons: data.total_sermons,
      dimension_stats: data.dimension_stats,
      sermons: maskedSermons
    });

  } catch (e) {
    console.error(`Error parsing ${file}:`, e.message);
  }
}

fs.writeFileSync(targetFile, JSON.stringify(aggregatedData, null, 2));
console.log(`Aggregated ${aggregatedData.length} churches into ${targetFile} (fully anonymized)`);
