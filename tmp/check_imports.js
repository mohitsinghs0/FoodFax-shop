const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath));
    } else if (file.endsWith('.dart')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getFiles('lib');
let missingImports = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const match = line.match(/^import\s+['"]([^'"]+)['"]/);
    if (match) {
      const importPath = match[1];
      if (!importPath.startsWith('package:') && !importPath.startsWith('dart:')) {
        const targetPath = path.resolve(path.dirname(file), importPath);
        if (!fs.existsSync(targetPath)) {
          console.error(`In ${file}:${idx + 1}: Missing ${importPath} -> ${targetPath}`);
          missingImports++;
        }
      }
    }
  });
});

console.log('Finished checking relative imports. Missing imports count:', missingImports);
