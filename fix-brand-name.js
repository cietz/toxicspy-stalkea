const fs = require("fs");
const path = require("path");

// Função recursiva para encontrar arquivos HTML
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

console.log("🔧 Substituindo Stalkea.ai por ToxicSpy nos títulos...\n");

// Encontrar todos os arquivos HTML
const htmlFiles = [
  ...findHtmlFiles("pages"),
  ...findHtmlFiles("es/pages"),
  "index.html",
  "es/index.html",
  "firewall/index.html",
  "es/firewall/index.html",
].filter((f) => fs.existsSync(f));

let totalFiles = 0;
let totalChanges = 0;

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;
  let changes = 0;

  // Substituir todas as variações de Stalkea.ai por ToxicSpy nos títulos
  const replacements = [
    { from: /<title>Stalkea\.ai - /g, to: "<title>ToxicSpy - " },
    { from: /<title>Stalkea\.ai/g, to: "<title>ToxicSpy" },
    { from: /Stalkea\.ai - /g, to: "ToxicSpy - " },
    // Também substituir em alt, meta tags, etc
    { from: /alt="Stalkea\.ai"/g, to: 'alt="ToxicSpy"' },
    {
      from: /content=".*?Stalkea\.ai/g,
      to: (match) => match.replace("Stalkea.ai", "ToxicSpy"),
    },
  ];

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      changes += matches.length;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ ${filePath.replace(/\\/g, "/")} (${changes} alterações)`);
    totalFiles++;
    totalChanges += changes;
  }
});

console.log(
  `\n✨ Concluído! ${totalFiles} arquivos modificados com ${totalChanges} alterações.`,
);
