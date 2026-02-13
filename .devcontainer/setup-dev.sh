#!/bin/bash
# Executar manualmente se o postCreateCommand do devcontainer não rodou
set -e
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
echo "Instalação concluída. Rode: npm run dev"
