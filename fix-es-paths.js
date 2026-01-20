const fs = require("fs");
const path = require("path");

// Arquivos principais para corrigir
const filesToFix = [
  "es/index.html",
  "es/chat1.html",
  "es/chat2.html",
  "es/chat3.html",
  "es/chat4.html",
  "es/pages/cta.html",
  "es/pages/feed.html",
  "es/pages/direct.html",
];

// Padrões de substituição
const replacements = [
  // Assets (CSS, JS, Imagens)
  { from: /href="assets\//g, to: 'href="../assets/' },
  { from: /href='assets\//g, to: "href='../assets/" },
  { from: /src="assets\//g, to: 'src="../assets/' },
  { from: /src='assets\//g, to: "src='../assets/" },

  // Scripts
  { from: /src="scripts\//g, to: 'src="../scripts/' },
  { from: /src='scripts\//g, to: "src='../scripts/" },

  // Styles
  { from: /href="styles\//g, to: 'href="../styles/' },
  { from: /href='styles\//g, to: "href='../styles/" },

  // Firewall
  { from: /href="firewall\//g, to: 'href="../firewall/' },
  { from: /href='firewall\//g, to: "href='../firewall/" },

  // Logo
  {
    from: /src="logo-vert-transparente\.png"/g,
    to: 'src="../logo-vert-transparente.png"',
  },
  {
    from: /src='logo-vert-transparente\.png'/g,
    to: "src='../logo-vert-transparente.png'",
  },

  // Pages (para arquivos na raiz /es/)
  { from: /href="pages\//g, to: 'href="pages/' }, // Mantém pages/ pois já está em /es/
  { from: /href='pages\//g, to: "href='pages/" },

  // Server.js API calls
  { from: /"\/api\//g, to: '"/api/' }, // API mantém absoluto
];

console.log("🔧 Ajustando caminhos para versão /es/...\n");

filesToFix.forEach((file) => {
  const filePath = path.join(__dirname, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  replacements.forEach(({ from, to }) => {
    const before = content;
    content = content.replace(from, to);
    if (before !== content) {
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ ${file}`);
  } else {
    console.log(`⏭️  ${file} (sem mudanças)`);
  }
});

console.log("\n✨ Concluído!");
