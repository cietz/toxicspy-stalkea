const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");

const app = express();

// Railway injeta a variável PORT automaticamente
const PORT = process.env.PORT || 3000;

// API real do stalkea.ai
const REAL_API_BASE = process.env.REAL_API_BASE || "https://stalkea.ai/api";

// Headers mobile para bypass do cloaker
const MOBILE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://stalkea.ai/?utm_source=fb&utm_medium=cpc&utm_campaign=test",
  Origin: "https://stalkea.ai",
};

// CORS permissivo
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ HEALTH CHECK (Railway precisa) ============
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ PROXY DE IMAGENS LOCAL ============
app.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send("URL obrigatória");
    }

    const decodedUrl = decodeURIComponent(imageUrl);
    console.log(
      `🖼️ [PROXY] Buscando imagem: ${decodedUrl.substring(0, 80)}...`
    );

    const response = await axios.get(decodedUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
      timeout: 15000,
    });

    const contentType = response.headers["content-type"] || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400"); // Cache 24h
    res.send(response.data);
  } catch (error) {
    console.error(`❌ [PROXY] Erro:`, error.message);
    res.status(500).send("Erro ao buscar imagem");
  }
});

// ============ PROXY DINÂMICO PARA API REAL ============

// GET - Instagram API
app.get("/api/instagram.php", async (req, res) => {
  try {
    const { tipo, username, is_private } = req.query;

    if (!username) {
      return res.status(400).json({ error: "Username obrigatório" });
    }

    const cleanUsername = username.replace(/^@+/, "").trim();
    console.log(`📸 [API] Instagram ${tipo || "perfil"} - @${cleanUsername}`);

    const apiUrl = `${REAL_API_BASE}/instagram.php`;
    const params = {
      tipo: tipo || "perfil",
      username: cleanUsername,
    };

    if (is_private !== undefined) {
      params.is_private = is_private;
    }

    const response = await axios.get(apiUrl, {
      params,
      headers: MOBILE_HEADERS,
      timeout: 30000,
    });

    console.log(`✅ [API] Sucesso - ${response.status}`);

    // Log detalhado para busca_completa
    if (tipo === "busca_completa" && response.data) {
      const postsCount = response.data.posts?.length || 0;
      const perfisCount = response.data.lista_perfis_publicos?.length || 0;
      console.log(`   📊 Dados: ${perfisCount} perfis, ${postsCount} posts`);

      // 🔥 ENRIQUECER perfil_buscado com estatísticas do endpoint "perfil"
      if (response.data.perfil_buscado) {
        try {
          console.log(`   🔄 [API] Buscando estatísticas do perfil...`);
          const perfilResponse = await axios.get(apiUrl, {
            params: { tipo: "perfil", username: cleanUsername },
            headers: MOBILE_HEADERS,
            timeout: 15000,
          });

          if (perfilResponse.data) {
            // Mesclar estatísticas no perfil_buscado
            const stats = perfilResponse.data;
            response.data.perfil_buscado.follower_count =
              stats.follower_count || stats.seguidores || 0;
            response.data.perfil_buscado.following_count =
              stats.following_count || stats.seguindo || 0;
            response.data.perfil_buscado.media_count =
              stats.media_count || stats.posts || stats.publicacoes || 0;
            response.data.perfil_buscado.biography =
              stats.biography || stats.bio || "";
            response.data.perfil_buscado.external_url =
              stats.external_url || "";

            console.log(
              `   ✅ [API] Estatísticas obtidas: ${response.data.perfil_buscado.follower_count} seguidores, ${response.data.perfil_buscado.following_count} seguindo, ${response.data.perfil_buscado.media_count} posts`
            );
          }
        } catch (statsError) {
          console.log(
            `   ⚠️ [API] Não foi possível obter estatísticas: ${statsError.message}`
          );
        }

        console.log(
          `   🎯 [DEBUG] perfil_buscado COMPLETO:`,
          JSON.stringify(response.data.perfil_buscado, null, 2)
        );
      }

      // DEBUG: Mostrar primeiros 3 perfis COM STATS
      if (perfisCount > 0) {
        console.log(`   👥 [DEBUG] Primeiros perfis da lista_perfis_publicos:`);
        response.data.lista_perfis_publicos
          .slice(0, 3)
          .forEach((perfil, idx) => {
            console.log(
              `      ${idx + 1}. @${perfil.username} - followers: ${
                perfil.follower_count
              }, following: ${perfil.following_count}, posts: ${
                perfil.media_count
              }`
            );
          });
      }

      if (postsCount > 0) {
        console.log(
          `   🖼️  Post #1: ${response.data.posts[0].post.image_url?.substring(
            0,
            80
          )}...`
        );
        // DEBUG: Log estrutura completa dos posts
        console.log(
          `   🔍 [DEBUG] Estrutura posts:`,
          JSON.stringify(response.data.posts[0], null, 2).substring(0, 500)
        );
      }
    }

    res.json(response.data);
  } catch (error) {
    console.error(`❌ [API] Erro:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Erro ao buscar perfil",
      message: error.message,
      details: error.response?.data,
    });
  }
});

// GET - Leads Check Status
app.get("/api/leads.php", async (req, res) => {
  try {
    console.log(`📊 [API] Leads - Check Status`);

    const response = await axios.get(`${REAL_API_BASE}/leads.php`, {
      params: req.query,
      headers: MOBILE_HEADERS,
      timeout: 30000,
    });

    res.json(response.data);
  } catch (error) {
    console.error(`❌ [API] Erro leads:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Erro ao verificar lead",
      message: error.message,
    });
  }
});

// POST - Leads Save Search
app.post("/api/leads.php", async (req, res) => {
  try {
    console.log(`📝 [API] Leads - Save Search`);

    const response = await axios.post(`${REAL_API_BASE}/leads.php`, req.body, {
      params: req.query,
      headers: {
        ...MOBILE_HEADERS,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    res.json(response.data);
  } catch (error) {
    console.error(`❌ [API] Erro ao salvar lead:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Erro ao salvar lead",
      message: error.message,
    });
  }
});

// Proxy genérico para outras rotas da API
app.all("/api/*", async (req, res) => {
  try {
    const endpoint = req.path.replace("/api", "");
    const apiUrl = `${REAL_API_BASE}${endpoint}`;

    console.log(`🔄 [API] ${req.method} ${endpoint}`);

    const config = {
      method: req.method.toLowerCase(),
      url: apiUrl,
      headers: MOBILE_HEADERS,
      params: req.query,
      timeout: 30000,
    };

    if (["post", "put", "patch"].includes(config.method)) {
      config.data = req.body;
      config.headers["Content-Type"] = "application/json";
    }

    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error(`❌ [API] Erro:`, error.message);
    res.status(error.response?.status || 500).json({
      error: "Erro na API",
      message: error.message,
    });
  }
});

// ============ ARQUIVOS ESTÁTICOS ============
// Servir arquivos estáticos da raiz (onde está o index.html)
app.use(express.static(path.join(__dirname)));

// Fallback SPA - redireciona rotas não encontradas para index.html
app.get("*", (req, res) => {
  if (!req.path.includes(".")) {
    res.sendFile(path.join(__dirname, "index.html"));
  } else {
    res.status(404).send("Not found");
  }
});

// ============ START SERVER ============
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🚀 STALKEA.AI CLONE - Production Server                      ║
║   📍 Port: ${PORT}                                                 ║
║   🔄 API Real: ${REAL_API_BASE}                    ║
║   📱 Qualquer username busca dados reais dinamicamente         ║
║   🛡️ Headers mobile + UTM bypass automático                    ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
