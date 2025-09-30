#!/bin/bash

# Script para corrigir todos os path aliases no backend

echo "Corrigindo imports com path aliases..."

cd backend/src

# Encontrar todos os arquivos TypeScript
find . -name "*.ts" -type f | while read file; do
    echo "Processando: $file"
    
    # Substituir @/config/ por ../config/ ou ./config/ dependendo da profundidade
    depth=$(echo "$file" | tr -cd '/' | wc -c)
    
    if [ $depth -eq 1 ]; then
        # Arquivo na raiz de src
        sed -i "s|from '@/config/|from './config/|g" "$file"
        sed -i "s|from '@/utils/|from './utils/|g" "$file"
        sed -i "s|from '@/services/|from './services/|g" "$file"
        sed -i "s|from '@/middleware/|from './middleware/|g" "$file"
        sed -i "s|from '@/routes/|from './routes/|g" "$file"
        sed -i "s|from '@/types/|from './types/|g" "$file"
        sed -i "s|from '@/controllers/|from './controllers/|g" "$file"
    else
        # Arquivo em subdiretório
        sed -i "s|from '@/config/|from '../config/|g" "$file"
        sed -i "s|from '@/utils/|from '../utils/|g" "$file"
        sed -i "s|from '@/services/|from '../services/|g" "$file"
        sed -i "s|from '@/middleware/|from '../middleware/|g" "$file"
        sed -i "s|from '@/routes/|from '../routes/|g" "$file"
        sed -i "s|from '@/types/|from '../types/|g" "$file"
        sed -i "s|from '@/controllers/|from '../controllers/|g" "$file"
    fi
done

echo "Correção concluída!"
