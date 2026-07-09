const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'internarea', 'src');
const apiUtilsPath = path.join(srcDir, 'utils', 'api.ts');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, function(filePath) {
  if (filePath === apiUtilsPath) return; // Skip api.ts itself
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Calculate relative path from this file's directory to apiUtilsPath
  const fileDir = path.dirname(filePath);
  let relativeApiDir = path.relative(fileDir, path.dirname(apiUtilsPath));
  // Convert Windows backslashes to forward slashes for imports
  relativeApiDir = relativeApiDir.split(path.sep).join('/');
  
  if (relativeApiDir === '') {
    relativeApiDir = '.';
  } else if (!relativeApiDir.startsWith('.')) {
    relativeApiDir = './' + relativeApiDir;
  }
  const relativeApiPath = `${relativeApiDir}/api`;

  if (content.includes('http://localhost:5000') || content.includes('axios.')) {
    // Replace the axios import with our custom api import
    if (content.includes('import axios from "axios"') || content.includes("import axios from 'axios'")) {
      content = content.replace(/import axios from ["']axios["'];?/g, `import api from "${relativeApiPath}";`);
      changed = true;
    }

    // Replace the axios.METHOD("http://localhost:5000...") calls
    const methods = ['get', 'post', 'put', 'delete'];
    
    methods.forEach(method => {
      // For double quotes
      let regexDouble = new RegExp(`axios\\.${method}\\("http:\\/\\/localhost:5000`, 'g');
      if (regexDouble.test(content)) {
        content = content.replace(regexDouble, `api.${method}("`);
        changed = true;
      }
      
      // For backticks
      let regexBacktick = new RegExp(`axios\\.${method}\\(\`http:\\/\\/localhost:5000`, 'g');
      if (regexBacktick.test(content)) {
        content = content.replace(regexBacktick, `api.${method}(\``);
        changed = true;
      }
    });
    
    // In case there are stray axios uses without the full URL like axios.get("/api/...")
    // (though our prior check showed they all had http://localhost:5000)
    if (content.includes('axios.get') || content.includes('axios.post') || content.includes('axios.put') || content.includes('axios.delete')) {
      content = content.replace(/axios\.(get|post|put|delete)/g, 'api.$1');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
