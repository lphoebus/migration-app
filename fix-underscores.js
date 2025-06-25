import fs from 'fs';
import path from 'path';
import replace from 'replace-in-file';

const assetsDir = './dist/assets';

// Rename files starting with an underscore
fs.readdirSync(assetsDir).forEach(file => {
  if (file.startsWith('_')) {
    const oldPath = path.join(assetsDir, file);
    const newPath = path.join(assetsDir, file.substring(1));
    fs.renameSync(oldPath, newPath);
  }
});

// Update references in all JS files in assets
const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
jsFiles.forEach(jsFile => {
  replace.sync({
    files: path.join(assetsDir, jsFile),
    from: /_([a-zA-Z0-9-]+\.js)/g,
    to: '$1',
  });
});