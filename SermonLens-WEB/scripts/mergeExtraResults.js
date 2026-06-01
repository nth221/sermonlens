import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'src', 'data', 'extra_results');
const targetFile = path.join(rootDir, 'src', 'data', 'sermonData.json');

const CHOSEONG = ['G', 'K', 'N', 'D', 'T', 'R', 'M', 'B', 'P', 'S', 'S', 'O', 'J', 'JJ', 'CH', 'K', 'T', 'P', 'H'];

function getFirstAlphabet(name) {
  if (!name) return 'X';

  const firstChar = name.trim().charAt(0);
  if (!firstChar) return 'X';

  const code = firstChar.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const choseongIndex = Math.floor((code - 0xAC00) / 588);
    return CHOSEONG[choseongIndex] || 'X';
  }

  if (/[A-Za-z]/.test(firstChar)) {
    return firstChar.toUpperCase();
  }

  return 'X';
}

function maskChurch(churchName, channelId) {
  const firstAlpha = getFirstAlphabet(churchName || '');
  const tail = (channelId || '').length >= 2 ? channelId.slice(-2) : 'XX';
  return `${firstAlpha}-${tail}`;
}

function round2(value) {
  return Number(value.toFixed(2));
}

function computeStats(sermons) {
  const dimensions = [
    'public_theology',
    'prosperity_theology',
    'political_mobilization',
    'authoritarian_control',
  ];

  const stats = {};
  for (const dimension of dimensions) {
    const values = sermons.map(sermon => sermon.scores?.[dimension] ?? 0);
    const count = values.length;
    const mean = count ? values.reduce((sum, value) => sum + value, 0) / count : 0;
    const sorted = [...values].sort((a, b) => a - b);
    const median = count
      ? (count % 2 === 1
        ? sorted[(count - 1) / 2]
        : (sorted[count / 2 - 1] + sorted[count / 2]) / 2)
      : 0;
    const min = count ? Math.min(...values) : 0;
    const max = count ? Math.max(...values) : 0;
    const variance = count > 1
      ? values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (count - 1)
      : 0;

    stats[dimension] = {
      mean: round2(mean),
      median: Number.isInteger(median) ? median : round2(median),
      min,
      max,
      stdev: round2(Math.sqrt(variance)),
      count,
    };
  }

  return stats;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectJsonFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

if (!fs.existsSync(sourceDir)) {
  throw new Error(`Source directory not found: ${sourceDir}`);
}

const existingData = readJson(targetFile);
const existingByChurch = new Map(existingData.map(item => [item.church, item]));
const groupedByChurch = new Map();
let updatedChurchCount = 0;

for (const filePath of collectJsonFiles(sourceDir)) {
  const sermon = readJson(filePath);
  const churchId = maskChurch(sermon.church_name, sermon.channel_id);

  if (!groupedByChurch.has(churchId)) {
    groupedByChurch.set(churchId, {
      church: churchId,
      sermons: [],
    });
  }

  groupedByChurch.get(churchId).sermons.push({
    sourceFile: filePath,
    scores: sermon.scores || {},
  });
}

for (const [churchId, group] of groupedByChurch.entries()) {
  const existing = existingByChurch.get(churchId);
  const sourceSermons = group.sermons.map(sermon => ({
    scores: sermon.scores,
  }));

  const existingSermons = existing?.sermons || [];
  const sourceCount = sourceSermons.length;
  const existingTail = existingSermons.slice(-sourceCount);
  const isAlreadyMerged =
    existingSermons.length >= sourceCount &&
    existingTail.length === sourceCount &&
    existingTail.every((sermon, index) => {
      const sourceScores = sourceSermons[index].scores || {};
      const sermonScores = sermon.scores || {};
      return JSON.stringify(sermonScores) === JSON.stringify(sourceScores);
    });

  if (isAlreadyMerged) {
    continue;
  }

  updatedChurchCount += 1;

  const startIndex = existingSermons.length + 1;
  const mergedSermons = [...existingSermons];

  group.sermons.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile, 'en'));

  group.sermons.forEach((sermon, index) => {
    const sermonId = `${churchId}-${String(startIndex + index).padStart(4, '0')}`;
    mergedSermons.push({
      sermon_id: sermonId,
      scores: sermon.scores,
    });
  });

  const mergedEntry = {
    church: churchId,
    total_sermons: mergedSermons.length,
    dimension_stats: computeStats(mergedSermons),
    sermons: mergedSermons,
  };

  existingByChurch.set(churchId, mergedEntry);
}

const mergedData = existingData.map(item => existingByChurch.get(item.church) || item);
for (const [churchId, entry] of existingByChurch.entries()) {
  if (!existingData.some(item => item.church === churchId)) {
    mergedData.push(entry);
  }
}

mergedData.sort((a, b) => a.church.localeCompare(b.church, 'en'));

fs.writeFileSync(targetFile, `${JSON.stringify(mergedData, null, 2)}\n`);
console.log(`Updated ${updatedChurchCount} churches from ${sourceDir} into ${targetFile}`);
