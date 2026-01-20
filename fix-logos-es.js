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

console.log("🔧 Atualizando tamanho das logos em espanhol...\n");

// Arquivos das páginas spy e buycredits em espanhol
const htmlFiles = findHtmlFiles("es/pages/v1");

let totalFiles = 0;
let totalChanges = 0;

htmlFiles.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;
  let changes = 0;

  // Atualizar .header-title img de 27px ou 28px para 50px
  if (
    content.includes(".header-title img {") &&
    content.includes("height: 27px")
  ) {
    content = content.replace(
      /\.header-title img \{([^}]*?)height: 27px/g,
      ".header-title img {$1height: 50px",
    );
    changes++;
  }

  if (
    content.includes(".header-title img {") &&
    content.includes("height: 28px")
  ) {
    content = content.replace(
      /\.header-title img \{([^}]*?)height: 28px/g,
      ".header-title img {$1height: 50px",
    );
    changes++;
  }

  // Atualizar .logo de 27px para 50px (dashboard)
  if (content.includes(".logo {") && content.includes("height: 27px")) {
    content = content.replace(
      /\.logo \{([^}]*?)height: 27px/g,
      ".logo {$1height: 50px",
    );
    changes++;
  }

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
