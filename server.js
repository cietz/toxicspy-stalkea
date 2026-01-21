const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// ============ TURSO DATABASE CONNECTION ============
const turso = createClient({
  url: "libsql://teste-cietz.aws-us-east-2.turso.io",
  authToken:
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3Njg0MTcyMDYsImlkIjoiZjc3NWNiMWEtZDJhZC00MDE5LWJkYjMtZGQ5MWI5YTZjNDcyIiwicmlkIjoiMTQzNTE3MjQtNmZkMS00N2FjLWI2YzQtNzc1MTAxOTFmODdhIn0.mse2RkYCRYAOcwg_hPp3fYb0sgNAA-XVhBA-4qEDk7zxKp7VjJEU1kG1QxDajLsSorzOcNvoAQSHoM13eZc9BA",
});

const JWT_SECRET =
  process.env.JWT_SECRET || "stalkea-secret-key-change-in-production";

// Criar tabela de usuários e investigações se não existirem
async function initDatabase() {
  try {
    // Criar tabela base
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna credits se não existir
    try {
      await turso.execute(
        `ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 50`,
      );
      console.log("✅ Coluna 'credits' adicionada");
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    // Adicionar coluna xp se não existir
    try {
      await turso.execute(`ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0`);
      console.log("✅ Coluna 'xp' adicionada");
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    // Adicionar coluna metadata se não existir
    try {
      await turso.execute(
        `ALTER TABLE users ADD COLUMN metadata TEXT DEFAULT ''`,
      );
      console.log("✅ Coluna 'metadata' adicionada");
    } catch (e) {
      // Coluna já existe, ignorar erro
    }

    // Criar tabela de investigações
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS investigations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        target_username TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'in_progress',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log(
      "✅ Tabelas 'users' e 'investigations' criadas/verificadas no Turso",
    );
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error);
  }
}

initDatabase();

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

// ============ CACHE EM MEMÓRIA ============
const instagramCache = new Map();
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const IMAGE_CACHE_TTL = 30 * 60 * 1000; // 30 minutos para imagens

function getCachedData(key) {
  const cached = instagramCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`💾 [CACHE] Hit para ${key}`);
    return cached.data;
  }
  if (cached) {
    instagramCache.delete(key); // Expirado
  }
  return null;
}

function setCachedData(key, data) {
  instagramCache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 [CACHE] Salvo ${key}`);
  // Limpar cache antigo (max 100 entradas)
  if (instagramCache.size > 100) {
    const firstKey = instagramCache.keys().next().value;
    instagramCache.delete(firstKey);
  }
}

function getCachedImage(key) {
  const cached = imageCache.get(key);
  if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL) {
    return cached;
  }
  if (cached) {
    imageCache.delete(key);
  }
  return null;
}

function setCachedImage(key, data, contentType) {
  imageCache.set(key, { data, contentType, timestamp: Date.now() });
  // Limitar a 200 imagens em cache (evitar estouro de memória)
  if (imageCache.size > 200) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
}

// CORS permissivo
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ HEALTH CHECK (Railway precisa) ============
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ AUTH ROUTES (TURSO) ============

// Registro de usuário
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        error: "Todos os campos são obrigatórios",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "A senha deve ter no mínimo 6 caracteres",
      });
    }

    // Verificar se email já existe
    const existing = await turso.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email.toLowerCase()],
    });

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "Este e-mail já está em uso",
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Gerar ID único
    const userId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Inserir usuário com créditos e XP padrão
    await turso.execute({
      sql: `INSERT INTO users (id, full_name, email, password_hash, credits, xp) 
            VALUES (?, ?, ?, ?, 50, 0)`,
      args: [userId, fullName, email.toLowerCase(), passwordHash],
    });

    // Gerar JWT token
    const token = jwt.sign(
      { userId, email: email.toLowerCase(), fullName },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    console.log(`✅ [AUTH] Usuário registrado: ${email}`);

    res.json({
      success: true,
      message: "Conta criada com sucesso!",
      user: {
        id: userId,
        fullName,
        email: email.toLowerCase(),
        credits: 50,
        xp: 0,
      },
      token,
    });
  } catch (error) {
    console.error("❌ [AUTH] Erro ao registrar:", error);
    res.status(500).json({
      error: "Erro ao criar conta. Tente novamente.",
    });
  }
});

// Login de usuário
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "E-mail e senha são obrigatórios",
      });
    }

    // Buscar usuário
    const result = await turso.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email.toLowerCase()],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "E-mail ou senha incorretos",
      });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        error: "E-mail ou senha incorretos",
      });
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.full_name,
      },
      JWT_SECRET,
      { expiresIn: "30d" },
    );

    console.log(`✅ [AUTH] Login bem-sucedido: ${email}`);

    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("❌ [AUTH] Erro ao fazer login:", error);
    res.status(500).json({
      error: "Erro ao fazer login. Tente novamente.",
    });
  }
});

// Middleware para verificar token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = user;
    next();
  });
}

// Rota protegida de exemplo - Verificar usuário logado
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: "SELECT id, full_name, email, credits, xp, created_at FROM users WHERE id = ?",
      args: [req.user.userId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        credits: user.credits || 50,
        xp: user.xp || 0,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("❌ [AUTH] Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro ao buscar dados do usuário" });
  }
});

// ============ INVESTIGATIONS ROUTES ============

// Preços dos serviços em créditos
const SERVICE_PRICES = {
  Instagram: 35,
  WhatsApp: 40,
  Facebook: 45,
  Location: 60,
  Localização: 60,
  SMS: 30,
  Calls: 25,
  Chamadas: 25,
  Camera: 55,
  Câmera: 55,
  OtherNetworks: 70,
  "Outras Redes": 70,
  Detective: 50,
  Detetive: 50,
};

// Iniciar investigação (com cobrança de créditos)
app.post("/api/investigations/start", authenticateToken, async (req, res) => {
  try {
    const { serviceType, targetUsername } = req.body;

    if (!serviceType || !targetUsername) {
      return res.status(400).json({
        error: "Tipo de serviço e usuário alvo são obrigatórios",
      });
    }

    // Obter preço do serviço
    const price = SERVICE_PRICES[serviceType] || 50;

    // Buscar créditos atuais do usuário
    const userResult = await turso.execute({
      sql: "SELECT credits FROM users WHERE id = ?",
      args: [req.user.userId],
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const currentCredits = userResult.rows[0].credits || 0;

    // Verificar se tem créditos suficientes
    if (currentCredits < price) {
      return res.status(400).json({
        error: "Créditos insuficientes",
        required: price,
        current: currentCredits,
        message: `Você precisa de ${price} créditos para iniciar esta investigação. Você tem ${currentCredits} créditos.`,
      });
    }

    // Deduzir créditos
    const newCredits = currentCredits - price;
    await turso.execute({
      sql: "UPDATE users SET credits = ? WHERE id = ?",
      args: [newCredits, req.user.userId],
    });

    // Criar investigação
    const investigationId = `inv_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    await turso.execute({
      sql: `INSERT INTO investigations (id, user_id, service_type, target_username, progress, status) 
            VALUES (?, ?, ?, ?, 0, 'in_progress')`,
      args: [investigationId, req.user.userId, serviceType, targetUsername],
    });

    console.log(
      `💰 [CREDITS] Usuário ${req.user.userId} gastou ${price} créditos para ${serviceType}. Saldo: ${newCredits}`,
    );

    res.json({
      success: true,
      investigation: {
        id: investigationId,
        serviceType,
        targetUsername,
        progress: 0,
        status: "in_progress",
      },
      creditsUsed: price,
      creditsRemaining: newCredits,
    });
  } catch (error) {
    console.error("❌ [INVESTIGATIONS] Erro ao iniciar investigação:", error);
    res.status(500).json({ error: "Erro ao iniciar investigação" });
  }
});

// Buscar investigações ativas do usuário
app.get("/api/investigations/active", authenticateToken, async (req, res) => {
  try {
    const result = await turso.execute({
      sql: `SELECT * FROM investigations 
            WHERE user_id = ? AND status = 'in_progress' 
            ORDER BY created_at DESC`,
      args: [req.user.userId],
    });

    const investigations = result.rows.map((row) => ({
      id: row.id,
      serviceType: row.service_type,
      targetUsername: row.target_username,
      progress: row.progress || 0,
      status: row.status,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      investigations,
    });
  } catch (error) {
    console.error("❌ [INVESTIGATIONS] Erro ao buscar investigações:", error);
    res.status(500).json({ error: "Erro ao buscar investigações" });
  }
});

// Atualizar progresso da investigação
app.put(
  "/api/investigations/:id/progress",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;

      if (progress < 0 || progress > 100) {
        return res.status(400).json({
          error: "Progresso deve estar entre 0 e 100",
        });
      }

      await turso.execute({
        sql: `UPDATE investigations 
            SET progress = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?`,
        args: [progress, id, req.user.userId],
      });

      res.json({
        success: true,
        progress,
      });
    } catch (error) {
      console.error("❌ [INVESTIGATIONS] Erro ao atualizar progresso:", error);
      res.status(500).json({ error: "Erro ao atualizar progresso" });
    }
  },
);

// Completar ou cancelar investigação
app.put(
  "/api/investigations/:id/status",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          error: "Status inválido. Use 'completed' ou 'cancelled'",
        });
      }

      await turso.execute({
        sql: `UPDATE investigations 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ? AND user_id = ?`,
        args: [status, id, req.user.userId],
      });

      res.json({
        success: true,
        status,
      });
    } catch (error) {
      console.error("❌ [INVESTIGATIONS] Erro ao atualizar status:", error);
      res.status(500).json({ error: "Erro ao atualizar status" });
    }
  },
);

// Acelerar investigação (deduzir créditos)
app.post(
  "/api/investigations/:id/accelerate",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const ACCELERATION_COST = 30;

      // Buscar usuário
      const userResult = await turso.execute({
        sql: "SELECT credits FROM users WHERE id = ?",
        args: [req.user.userId],
      });

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const currentCredits = userResult.rows[0].credits || 0;

      if (currentCredits < ACCELERATION_COST) {
        return res.status(400).json({
          error: "Créditos insuficientes",
          currentCredits,
          required: ACCELERATION_COST,
        });
      }

      // Deduzir créditos
      await turso.execute({
        sql: "UPDATE users SET credits = credits - ? WHERE id = ?",
        args: [ACCELERATION_COST, req.user.userId],
      });

      // Completar investigação
      await turso.execute({
        sql: `UPDATE investigations 
              SET progress = 100, status = 'completed', updated_at = CURRENT_TIMESTAMP 
              WHERE id = ? AND user_id = ?`,
        args: [id, req.user.userId],
      });

      res.json({
        success: true,
        creditsRemaining: currentCredits - ACCELERATION_COST,
      });
    } catch (error) {
      console.error(
        "❌ [INVESTIGATIONS] Erro ao acelerar investigação:",
        error,
      );
      res.status(500).json({ error: "Erro ao acelerar investigação" });
    }
  },
);

// ============ COMPRA DE CRÉDITOS VIA PIX (MARCHABB API) ============
const MARCHABB_PUBLIC_KEY =
  "pk_YJl0fMP4j7PGAemvjkRFV_PcQBXotDd56PSNooXJf9thon91";
const MARCHABB_SECRET_KEY =
  "sk_EJXMXhMP7jBbriKR71iXozTLAUzUA3EgqF6XtWnWId8Wb9kI";

// Criar transação PIX
app.post("/api/credits/create-pix", authenticateToken, async (req, res) => {
  try {
    const { credits, amount } = req.body;

    if (!credits || !amount) {
      return res.status(400).json({
        error: "Credits e amount são obrigatórios",
      });
    }

    // Validar valores de pacotes
    const validPackages = {
      100: 29.9,
      600: 79.9,
      1500: 149.9,
      5000: 299.9,
      10000: 499.9,
    };

    if (!validPackages[credits] || validPackages[credits] !== amount) {
      return res.status(400).json({
        error: "Pacote de créditos inválido",
      });
    }

    // Buscar dados do usuário
    const userResult = await turso.execute({
      sql: "SELECT id, full_name, email FROM users WHERE id = ?",
      args: [req.user.userId],
    });

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = userResult.rows[0];

    // Criar autenticação Basic para Marchabb
    const auth = Buffer.from(
      `${MARCHABB_PUBLIC_KEY}:${MARCHABB_SECRET_KEY}`,
    ).toString("base64");

    // Valor em centavos
    const amountInCents = Math.round(amount * 100);

    // Payload para API Marchabb
    const payload = {
      amount: amountInCents,
      currency: "BRL",
      paymentMethod: "pix",
      installments: 1,
      postbackUrl: `${
        process.env.BASE_URL || "http://localhost:3000"
      }/api/credits/webhook`,
      metadata: JSON.stringify({
        userId: user.id,
        credits: credits,
        orderId: `stalkea_${Date.now()}`,
      }),
      externalRef: `stalkea_${user.id}_${Date.now()}`,
      items: [
        {
          title: `${credits.toLocaleString("pt-BR")} Créditos Stalkea.ai`,
          quantity: 1,
          tangible: false,
          unitPrice: amountInCents,
          externalRef: `credits_${credits}`,
        },
      ],
      customer: {
        name: user.full_name,
        email: user.email,
        document: {
          type: "cpf",
          number: "00000000000",
        },
      },
      pix: {
        expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    };

    console.log(`💳 [PIX] Criando transação PIX para ${user.email}...`);

    // Fazer requisição para API Marchabb
    const response = await axios.post(
      "https://api.marchabb.com/v1/transactions",
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const transaction = response.data;

    console.log(`✅ [PIX] Transação criada: ${transaction.id}`);

    // Retornar dados da transação
    res.json({
      success: true,
      transactionId: transaction.id,
      qrCode: transaction.pix?.qrcode || "",
      amount: amount,
      credits: credits,
      expirationDate: transaction.pix?.expirationDate,
      status: transaction.status,
    });
  } catch (error) {
    console.error(
      "❌ [PIX] Erro ao criar transação:",
      error.response?.data || error.message,
    );
    res.status(500).json({
      error: "Erro ao criar pagamento PIX",
      details: error.response?.data || error.message,
    });
  }
});

// Verificar status da transação PIX
app.get(
  "/api/credits/check-payment/:transactionId",
  authenticateToken,
  async (req, res) => {
    try {
      const { transactionId } = req.params;

      const auth = Buffer.from(
        `${MARCHABB_PUBLIC_KEY}:${MARCHABB_SECRET_KEY}`,
      ).toString("base64");

      // Buscar transação na API Marchabb
      const response = await axios.get(
        `https://api.marchabb.com/v1/transactions/${transactionId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            Accept: "application/json",
          },
        },
      );

      const transaction = response.data;

      // Se pagamento foi aprovado, adicionar créditos
      if (transaction.status === "paid" || transaction.status === "approved") {
        const metadata = JSON.parse(transaction.metadata || "{}");
        const credits = metadata.credits;
        const userId = metadata.userId;

        if (credits && userId === req.user.userId) {
          // Verificar se já não foram creditados antes
          const checkResult = await turso.execute({
            sql: "SELECT metadata FROM users WHERE id = ?",
            args: [userId],
          });

          const currentMetadata = checkResult.rows[0]?.metadata || "";

          if (!currentMetadata.includes(transactionId.toString())) {
            // Adicionar créditos
            await turso.execute({
              sql: "UPDATE users SET credits = credits + ?, metadata = ? WHERE id = ?",
              args: [credits, currentMetadata + "," + transactionId, userId],
            });

            console.log(
              `✅ [PIX] ${credits} créditos adicionados para usuário ${userId}`,
            );
          }
        }
      }

      res.json({
        success: true,
        status: transaction.status,
        paid:
          transaction.status === "paid" || transaction.status === "approved",
      });
    } catch (error) {
      console.error(
        "❌ [PIX] Erro ao verificar pagamento:",
        error.response?.data || error.message,
      );
      res.status(500).json({
        error: "Erro ao verificar status do pagamento",
        details: error.response?.data || error.message,
      });
    }
  },
);

// Webhook para receber notificações da Marchabb
app.post("/api/credits/webhook", async (req, res) => {
  try {
    const notification = req.body;
    console.log(`🔔 [WEBHOOK] Notificação recebida:`, notification);

    const transaction = notification.data;

    if (transaction.status === "paid" || transaction.status === "approved") {
      const metadata = JSON.parse(transaction.metadata || "{}");
      const credits = metadata.credits;
      const userId = metadata.userId;

      if (credits && userId) {
        // Verificar se já não foram creditados
        const checkResult = await turso.execute({
          sql: "SELECT metadata FROM users WHERE id = ?",
          args: [userId],
        });

        const currentMetadata = checkResult.rows[0]?.metadata || "";

        if (!currentMetadata.includes(transaction.id.toString())) {
          // Adicionar créditos
          await turso.execute({
            sql: "UPDATE users SET credits = credits + ?, metadata = ? WHERE id = ?",
            args: [credits, currentMetadata + "," + transaction.id, userId],
          });

          console.log(
            `✅ [WEBHOOK] ${credits} créditos adicionados via webhook para usuário ${userId}`,
          );
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ [WEBHOOK] Erro ao processar webhook:", error);
    res.status(500).json({ error: "Erro ao processar webhook" });
  }
});

// ============ PROXY DE IMAGENS LOCAL (COM CACHE) ============
app.get("/proxy-image", async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send("URL obrigatória");
    }

    const decodedUrl = decodeURIComponent(imageUrl);

    // Verificar cache primeiro
    const cached = getCachedImage(decodedUrl);
    if (cached) {
      res.set("Content-Type", cached.contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.set("X-Cache", "HIT");
      return res.send(cached.data);
    }

    const response = await axios.get(decodedUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.instagram.com/",
      },
      timeout: 8000, // Timeout menor
    });

    const contentType = response.headers["content-type"] || "image/jpeg";

    // Salvar no cache
    setCachedImage(decodedUrl, response.data, contentType);

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("X-Cache", "MISS");
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

    const cleanUsername = username.replace(/^@+/, "").trim().toLowerCase();
    const cacheKey = `${tipo || "perfil"}_${cleanUsername}`;

    // Verificar cache primeiro
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    console.log(`📸 [API] Instagram ${tipo || "perfil"} - @${cleanUsername}`);
    const startTime = Date.now();

    const apiUrl = `${REAL_API_BASE}/instagram.php`;
    const params = {
      tipo: tipo || "perfil",
      username: cleanUsername,
    };

    if (is_private !== undefined) {
      params.is_private = is_private;
    }

    // Para busca_completa, fazer as duas chamadas em PARALELO
    if (tipo === "busca_completa") {
      const [buscaResponse, perfilResponse] = await Promise.all([
        axios.get(apiUrl, {
          params,
          headers: MOBILE_HEADERS,
          timeout: 20000,
        }),
        axios
          .get(apiUrl, {
            params: { tipo: "perfil", username: cleanUsername },
            headers: MOBILE_HEADERS,
            timeout: 10000,
          })
          .catch(() => null), // Não falhar se perfil der erro
      ]);

      const responseData = buscaResponse.data;

      // Mesclar estatísticas se disponível
      if (responseData.perfil_buscado && perfilResponse?.data) {
        const stats = perfilResponse.data;
        responseData.perfil_buscado.follower_count =
          stats.follower_count || stats.seguidores || 0;
        responseData.perfil_buscado.following_count =
          stats.following_count || stats.seguindo || 0;
        responseData.perfil_buscado.media_count =
          stats.media_count || stats.posts || stats.publicacoes || 0;
        responseData.perfil_buscado.biography =
          stats.biography || stats.bio || "";
        responseData.perfil_buscado.external_url = stats.external_url || "";
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ [API] Sucesso em ${elapsed}ms`);

      // Salvar no cache
      setCachedData(cacheKey, responseData);

      return res.json(responseData);
    }

    // Para outros tipos, chamada simples
    const response = await axios.get(apiUrl, {
      params,
      headers: MOBILE_HEADERS,
      timeout: 15000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ [API] Sucesso em ${elapsed}ms`);

    // Salvar no cache
    setCachedData(cacheKey, response.data);

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
