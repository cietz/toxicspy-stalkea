const fs = require("fs");
const path = require("path");

console.log("🔧 Corrigindo todos os caminhos nos arquivos /es/...\n");

// Função para encontrar arquivos HTML recursivamente
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== "node_modules") {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith(".html")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Encontrar todos os arquivos HTML em /es/
const htmlFiles = findHtmlFiles("es");

console.log(`📁 Encontrados ${htmlFiles.length} arquivos HTML\n`);

let totalFiles = 0;
let totalChanges = 0;

htmlFiles.forEach((filePath) => {
  const normalizedPath = filePath.replace(/\\/g, "/");
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;
  let fileChanges = 0;

  // Determinar o nível de profundidade do arquivo
  const depth = normalizedPath.split("/").length - 2; // -2 para excluir 'es' e o nome do arquivo
  const prefix = depth > 0 ? "../".repeat(depth) : "./";

  // 1. Corrigir caminhos absolutos /pages/, /assets/, etc para relativos
  const absolutePatterns = [
    { from: /href="\/pages\//g, to: `href="${prefix}pages/` },
    { from: /src="\/pages\//g, to: `src="${prefix}pages/` },
    { from: /href="\/assets\//g, to: `href="${prefix}assets/` },
    { from: /src="\/assets\//g, to: `src="${prefix}assets/` },
    { from: /href="\/scripts\//g, to: `href="${prefix}scripts/` },
    { from: /src="\/scripts\//g, to: `src="${prefix}scripts/` },
    { from: /href="\/styles\//g, to: `href="${prefix}styles/` },
    { from: /src="\/styles\//g, to: `src="${prefix}styles/` },
    { from: /href="\/firewall\//g, to: `href="${prefix}firewall/` },
    { from: /src="\/firewall\//g, to: `src="${prefix}firewall/` },
    // window.location.href com caminhos absolutos
    {
      from: /window\.location\.href\s*=\s*["']\/pages\//g,
      to: `window.location.href = "${prefix}pages/`,
    },
    {
      from: /window\.location\.href\s*=\s*["']\/assets\//g,
      to: `window.location.href = "${prefix}assets/`,
    },
  ];

  absolutePatterns.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      fileChanges += matches.length;
    }
  });

  // 2. Corrigir caminhos sem ./ ou ../ no início
  if (depth === 0) {
    // Arquivo na raiz de /es/
    const rootPatterns = [
      { from: /(['"])pages\//g, to: "$1./pages/" },
      { from: /(['"])assets\//g, to: "$1./assets/" },
      { from: /(['"])scripts\//g, to: "$1./scripts/" },
      { from: /(['"])styles\//g, to: "$1./styles/" },
      { from: /(['"])firewall\//g, to: "$1./firewall/" },
      { from: /(['"])chat([1-4])\.html/g, to: "$1./chat$2.html" },
    ];

    rootPatterns.forEach(({ from, to }) => {
      const matches = content.match(from);
      if (matches) {
        content = content.replace(from, to);
        fileChanges += matches.length;
      }
    });
  }

  // 3. Corrigir href="direct.html" para href="./direct.html" (links na mesma pasta)
  const sameDirectoryPattern = /href="([a-z]+\.html)"/g;
  const matches = content.matchAll(sameDirectoryPattern);
  for (const match of matches) {
    if (
      !match[1].startsWith("./") &&
      !match[1].startsWith("../") &&
      !match[1].startsWith("http")
    ) {
      content = content.replace(`href="${match[1]}"`, `href="./${match[1]}"`);
      fileChanges++;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ ${normalizedPath} (${fileChanges} alterações)`);
    totalFiles++;
    totalChanges += fileChanges;
  }
});

console.log(
  `\n✨ Concluído! ${totalFiles} arquivos modificados com ${totalChanges} alterações no total.`,
);
