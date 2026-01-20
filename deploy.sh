#!/bin/bash

echo "🚀 Iniciando deploy..."

# Atualizar código do repositório
echo "📥 Baixando últimas alterações..."
git pull origin main

# Parar containers
echo "🛑 Parando containers..."
sudo docker-compose down

# Reconstruir imagem com novos arquivos
echo "🔨 Reconstruindo container..."
sudo docker-compose up -d --build

# Aguardar container iniciar
echo "⏳ Aguardando container iniciar..."
sleep 5

# Verificar status
echo "✅ Verificando status..."
sudo docker ps | grep stalkea-clone

# Mostrar logs
echo "📋 Últimas linhas do log:"
sudo docker logs --tail 20 stalkea-clone

echo ""
echo "🎉 Deploy concluído!"
echo "🌐 Site: https://toxicspy.com"
