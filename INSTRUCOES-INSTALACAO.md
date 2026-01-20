# 🚀 Instalação Simplificada - toxicspy.com

## Passo 1: Upload dos Arquivos

1. **Webmin** → **Tools** → **File Manager**
2. Navegue até: `/home/toxicspy/public_html`
3. Faça upload de TODOS os arquivos desta pasta:
   - ✅ server.js
   - ✅ package.json
   - ✅ Procfile
   - ✅ railway.json
   - ✅ README.md
   - ✅ Todos os arquivos .html
   - ✅ Pasta assets/
   - ✅ Pasta pages/
   - ✅ Pasta scripts/
   - ✅ Pasta styles/
   - ✅ Pasta firewall/
   - ✅ setup-v2.sh

---

## Passo 2: Executar Instalação Automática

### Opção A - Via Cron Job (Recomendado)

1. **Webmin** → **System** → **Scheduled Cron Jobs**
2. Clique em **Create a new scheduled cron job**
3. Preencha:
   - **Execute cron job as**: `toxicspy`
   - **Active?**: `Yes`
   - **Command**:
   ```bash
   cd /home/toxicspy/public_html && chmod +x setup-v2.sh && ./setup-v2.sh > /tmp/install-log.txt 2>&1
   ```

   - **When to execute**: escolha "Simple schedule"
     - Minutos: `*/5` (a cada 5 minutos)
     - Ou escolha horário específico (ex: daqui 2 minutos)
4. Clique em **Create**
5. Aguarde executar
6. Depois vá em **Tools** → **File Manager** e abra o arquivo `/tmp/install-log.txt` para ver o resultado
7. **IMPORTANTE**: Depois que instalar, volte e DELETE o Cron Job para não executar novamente

### Opção B - Via SSH Client (Se preferir)

Baixe o **PuTTY**: https://www.putty.org/

1. Abra o PuTTY
2. Host: `144.91.92.66`
3. Login: `toxicspy`
4. Digite a senha
5. Cole os comandos:

```bash
cd /home/toxicspy/public_html
chmod +x setup-v2.sh
./setup-v2.sh
```

---

## Passo 3: Configurar Proxy no Virtualmin

1. **Virtualmin** → **toxicspy.com**
2. **Server Configuration** → **Website Options**
3. Procure por **"Proxy website for a different port"** ou **"Website redirects"**
4. Habilite e configure:
   - **Proxy to port**: `3000`
5. Clique em **Save Virtual Server**

---

## Passo 4: Testar

Acesse: http://toxicspy.com

✅ Deve aparecer seu site funcionando!

---

## 🔧 Comandos Úteis (se precisar depois)

Para ver se está rodando:

```bash
pm2 list
```

Para ver logs:

```bash
pm2 logs toxicspy-main
```

Para reiniciar:

```bash
pm2 restart toxicspy-main
```

---

## ⚠️ Problemas Comuns

**Site não carrega:**

- Verifique se o PM2 está rodando: vá no terminal e digite `pm2 list`
- Verifique se o proxy está configurado no Virtualmin
- Veja os logs: `pm2 logs toxicspy-main`

**Porta já em uso:**

- Mude a porta no script (de 3000 para 3001, 3002, etc)
