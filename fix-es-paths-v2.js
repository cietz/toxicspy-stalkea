const fs = require("fs");
const path = require("path");

// Arquivos a processar
const files = [
  "es/index.html",
  "es/pages/direct.html",
  "es/pages/feed.html",
  "es/pages/cta.html",
];

// Padrões de substituição
const replacements = [
  // Corrigir pages/ para ./pages/
  {
    pattern: /(['"])pages\//g,
    replacement: "$1./pages/",
    description: "pages/ → ./pages/",
  },
  // Corrigir scripts/ para ./scripts/
  {
    pattern: /(['"])scripts\//g,
    replacement: "$1./scripts/",
    description: "scripts/ → ./scripts/",
  },
  // Corrigir styles/ para ./styles/
  {
    pattern: /(['"])styles\//g,
    replacement: "$1./styles/",
    description: "styles/ → ./styles/",
  },
  // Corrigir assets/ para ./assets/
  {
    pattern: /(['"])assets\//g,
    replacement: "$1./assets/",
    description: "assets/ → ./assets/",
  },
  // Corrigir firewall/ para ./firewall/
  {
    pattern: /(['"])firewall\//g,
    replacement: "$1./firewall/",
    description: "firewall/ → ./firewall/",
  },
  // Corrigir chat1-4.html para ./chat1-4.html
  {
    pattern: /(['"])chat([1-4])\.html/g,
    replacement: "$1./chat$2.html",
    description: "chatX.html → ./chatX.html",
  },
];

console.log("🔧 Iniciando correção de caminhos nos arquivos /es/...\n");

files.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filePath} não encontrado, pulando...`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let changes = [];

  replacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      const count = matches.length;
      content = content.replace(pattern, replacement);
      changes.push(`  - ${description} (${count}x)`);
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ ${filePath}`);
    changes.forEach((change) => console.log(change));
    console.log("");
  } else {
    console.log(`⏭️  ${filePath} - sem mudanças`);
  }
});

console.log("✨ Concluído!");
