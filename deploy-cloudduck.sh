#!/bin/bash

# CloudDuck Production Deployment Script
# nerede.com.tr domain için web-admin uygulamasını başlatır

echo "🚀 nerede Web Admin - CloudDuck Deployment Başlatılıyor..."

# Web admin dizinine git
cd /domains/neredeapp.com.tr/public_html/web-admin

# Node modules kontrolü
if [ ! -d "node_modules" ]; then
    echo "📦 Node modules yükleniyor..."
    npm install --production
fi

# Production build
echo "🔨 Production build yapılıyor..."
npm run build

# PM2 ile başlat
echo "▶️  PM2 ile uygulama başlatılıyor..."
pm2 delete nerede-web-admin 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# PM2 startup script ekle (sistem yeniden başlatıldığında otomatik başlasın)
pm2 startup

echo "✅ Deployment tamamlandı!"
echo "📊 Durum kontrolü: pm2 status"
echo "📝 Loglar: pm2 logs nerede-web-admin"
echo "🌐 Uygulama: https://neredeapp.com.tr"

