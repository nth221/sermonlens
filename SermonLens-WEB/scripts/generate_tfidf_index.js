import fs from 'fs';
import path from 'path';

const tfidfDir = './public/tfidf';
const churchDir = path.join(tfidfDir, 'church');
const sermonBaseDir = path.join(tfidfDir, 'sermon');

const index = {
  churches: [],
  sermons: {}
};

// 1. Get church list
const churchFiles = fs.readdirSync(churchDir).filter(f => f.endsWith('.json'));
for (const file of churchFiles) {
  const churchId = file.replace('.json', '');
  index.churches.push(churchId);
  
  // 2. Get sermons for this church
  const churchSermonDir = path.join(sermonBaseDir, churchId);
  if (fs.existsSync(churchSermonDir)) {
    const sermonFiles = fs.readdirSync(churchSermonDir).filter(f => f.endsWith('.json'));
    index.sermons[churchId] = sermonFiles.map(f => f.replace('.json', ''));
  } else {
    index.sermons[churchId] = [];
  }
}

fs.writeFileSync(path.join(tfidfDir, 'index.json'), JSON.stringify(index, null, 2));
console.log('Index generated with', index.churches.length, 'churches');
