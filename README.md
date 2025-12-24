# GitHub Pages Deployment Guide

Bu klasördeki dosyaları GitHub Pages'de host etmek için:

## 1. GitHub Repository Oluşturma

1. GitHub'da yeni bir repository oluşturun (örn: `nerede-legal`)
2. Repository'yi public yapın (GitHub Pages için gerekli)

## 2. Dosyaları Yükleme

```bash
cd public/legal
git init
git add .
git commit -m "Initial commit: Legal pages"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADI/nerede-legal.git
git push -u origin main
```

## 3. GitHub Pages Aktif Etme

1. Repository Settings > Pages
2. Source: "Deploy from a branch" seçin
3. Branch: `main` seçin
4. Folder: `/ (root)` seçin
5. Save

## 4. URL'ler

Pages aktif olduktan sonra URL'ler:
- Ana Sayfa: `https://KULLANICI_ADI.github.io/nerede-legal/`
- Gizlilik: `https://KULLANICI_ADI.github.io/nerede-legal/gizlilik-politikasi.html`
- Kullanım Şartları: `https://KULLANICI_ADI.github.io/nerede-legal/kullanim-sartlari.html`
- Destek: `https://KULLANICI_ADI.github.io/nerede-legal/destek.html`
- Hesap Silme: `https://KULLANICI_ADI.github.io/nerede-legal/hesap-silme.html`

## 5. App Store Connect ve Google Play Console'da Kullanım

Bu URL'leri App Store Connect ve Google Play Console'da Privacy Policy ve Terms of Service alanlarına ekleyin.

## Notlar

- Dosya isimleri Türkçe karakter içermemelidir (şu anki hali uygun)
- Tüm dosyalar aynı klasörde olmalıdır
- `_styles.css` dosyası tüm sayfalar tarafından kullanılır

