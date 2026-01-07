# Stalkea.ai Clone

Clone funcional do Stalkea.ai com proxy dinâmico para API real.

## 🚀 Deploy no Railway

### Opção 1: Via GitHub (Recomendado)

1. Faça push da pasta `cloned-site` para um repositório GitHub
2. Acesse [railway.app](https://railway.app)
3. Clique em **New Project** → **Deploy from GitHub repo**
4. Selecione seu repositório
5. Railway detecta automaticamente o Node.js e faz deploy

### Opção 2: Via Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Na pasta cloned-site, iniciar projeto
cd cloned-site
railway init

# Deploy
railway up
```

## ⚙️ Variáveis de Ambiente (Opcionais)

No painel do Railway, você pode configurar:

| Variável        | Descrição                                          | Default                |
| --------------- | -------------------------------------------------- | ---------------------- |
| `PORT`          | Porta do servidor (Railway define automaticamente) | 3000                   |
| `REAL_API_BASE` | URL base da API real                               | https://stalkea.ai/api |

## 📁 Estrutura do Projeto

```
cloned-site/
├── server.js          # Servidor Express (API + Static)
├── package.json       # Dependências
├── railway.json       # Configuração Railway
├── Procfile           # Comando de start
├── index.html         # Página principal
├── pages/             # Páginas HTML (feed, direct, cta)
├── assets/            # Imagens, CSS, fontes
├── scripts/           # JavaScript
└── styles/            # CSS
```

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar servidor
npm start

# Acesse http://localhost:3000
```

## 📋 Endpoints da API

| Endpoint                 | Descrição                                        |
| ------------------------ | ------------------------------------------------ |
| `GET /health`            | Health check (Railway usa para verificar status) |
| `GET /proxy-image?url=`  | Proxy de imagens do Instagram                    |
| `GET /api/instagram.php` | Busca perfis do Instagram                        |
| `GET /api/leads.php`     | Verifica status de leads                         |
| `POST /api/leads.php`    | Salva dados de leads                             |
| `* /api/*`               | Proxy genérico para outras rotas                 |

## ✅ Checklist pré-deploy

- [x] `package.json` na raiz
- [x] `server.js` configurado
- [x] `PORT` usando variável de ambiente
- [x] Health check endpoint (`/health`)
- [x] `.gitignore` configurado
- [x] `railway.json` para configuração específica

## 🛠️ Troubleshooting

### Erro de CORS

O servidor já está configurado com CORS permissivo (`origin: "*"`).

### Imagens não carregam

Verifique se o endpoint `/proxy-image` está funcionando. As imagens do Instagram expiram após algumas horas.

### Deploy falha

Verifique os logs no Railway Dashboard. Certifique-se que todas as dependências estão no `package.json`.
