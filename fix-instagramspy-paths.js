const fs = require("fs");

const filePath = "pages/instagramspy/index.html";
let content = fs.readFileSync(filePath, "utf8");

// Substituir todos os caminhos absolutos para relativos
content = content.replace(
  /window\.location\.href = "\/pages\/register\/login\.html"/g,
  'window.location.href = "../register/login.html"',
);
content = content.replace(
  /window\.location\.href = "\/pages\/dashboard\/"/g,
  'window.location.href = "../dashboard/"',
);
content = content.replace(
  /window\.location\.href = "\/pages\/buycredits\/"/g,
  'window.location.href = "../buycredits/"',
);

fs.writeFileSync(filePath, content, "utf8");

console.log("✅ Caminhos corrigidos no instagramspy!");
