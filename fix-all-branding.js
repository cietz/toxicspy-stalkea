const fs = require('fs');
const path = require('path');

// Função recursiva para encontrar arquivos HTML
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

console.log('🔧 Substituindo APENAS títulos e textos visíveis de Stalkea.ai por ToxicSpy...\n');

// Encontrar todos os arquivos HTML
const htmlFiles = [
  ...findHtmlFiles('.'),
].filter(f => !f.includes('node_modules'));

let totalFiles = 0;
let totalChanges = 0;

htmlFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // 1. Substituir em tags <title> (o que aparece na aba do navegador)
  const titleMatches = content.match(/<title>.*?Stalkea\.ai.*?<\/title>/gi);
  if (titleMatches) {
    content = content.replace(/<title>(.*?)Stalkea\.ai(.*?)<\/title>/gi, '<title>$1ToxicSpy$2</title>');
    changes += titleMatches.length;
  }

  // 2. Substituir em alt de imagens
  const altMatches = content.match(/alt=".*?Stalkea\.ai.*?"/gi);
  if (altMatches) {
    content = content.replace(/alt="(.*?)Stalkea\.ai(.*?)"/gi, 'alt="$1ToxicSpy$2"');
    changes += altMatches.length;
  }

  // 3. Substituir textos visíveis (sem mexer em URLs)
  // "Seja um membro VIP do Stalkea.ai" -> "Seja um membro VIP do ToxicSpy"
  const textMatches = content.match(/(?<!https:\/\/)(?<!href=")(?<!\.)(Stalkea\.ai)(?!\/)/g);
  if (textMatches) {
    content = content.replace(/(?<!https:\/\/)(?<!href=")(?<!\.)(Stalkea\.ai)(?!\/)/g, 'ToxicSpy');
    changes += textMatches.length;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath.replace(/\\/g, '/')} (${changes} alterações)`);
    totalFiles++;
    totalChanges += changes;
  }
});

console.log(`\n✨ Concluído! ${totalFiles} arquivos modificados com ${totalChanges} alterações totais.`);
console.log('⚠️  URLs de API e links canonical NÃO foram alterados (seguro).');

