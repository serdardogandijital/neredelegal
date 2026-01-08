# nerede? Web Admin Panel

Modern ve kapsamlı admin yönetim paneli.

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd web-admin
npm install
```

### 2. Environment Variables Ayarla

`.env.local` dosyası oluşturun (root dizindeki service account JSON'dan bilgileri alın):

```bash
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=neredeapp-68658
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@neredeapp-68658.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Alternatif: Service Account JSON dosyası yolu
GOOGLE_APPLICATION_CREDENTIALS=../neredeapp-68658-firebase-adminsdk-fbsvc-0e21e8c922.json

# Storage Bucket
FIREBASE_STORAGE_BUCKET=neredeapp-68658.firebasestorage.app
```

**Not:** `.env.local` dosyası zaten oluşturulmuş durumda. Eğer yoksa yukarıdaki bilgileri kullanarak oluşturun.

### 3. Geliştirme Sunucusunu Başlat

```bash
npm run dev
```

Panel http://localhost:3005 adresinde çalışacaktır.

### 4. Production Build

```bash
npm run build
npm start
```

## 🔐 Giriş Bilgileri

### Admin Demo
- E-posta: admin@nerede.app
- Şifre: admin123

### İşletme Demo
- E-posta: merchant@nerede.app
- Şifre: merchant123

## 📱 Özellikler

### Admin Panel
- Dashboard & Analytics
- Kullanıcı Yönetimi (CRUD)
- Mekan Yönetimi (CRUD)
- Kampanya Yönetimi (CRUD)
- Check-in Moderasyonu
- Transaction İzleme
- İşletme Onaylama
- Rozet Sistemi
- Bilet Yönetimi
- Community Moderasyonu

### Merchant Panel
- Dashboard & İstatistikler
- Mekan Yönetimi
- Kampanya Oluşturma
- QR Kod Tarama (Kullanıcı & İndirim)
- Check-in Takibi
- Analytics

## 🎨 Teknolojiler

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **Storage:** Firebase Storage
- **Notifications:** React Hot Toast
- **QR Scanner:** html5-qrcode

## 📊 API Endpoints

- `/api/upload` - Dosya yükleme (resim)
- `/api/admin/change-password` - Şifre değiştirme
- `/api/discount/validate` - İndirim kodu doğrulama
- `/api/discount/use` - İndirim kodu kullanımı

## 🔧 Yapılandırma

### Firebase Admin SDK

Firebase Admin SDK otomatik olarak initialize edilir. İki yöntem desteklenir:

1. **Environment Variables** (Önerilen)
   - `.env.local` dosyasında credentials tanımlayın

2. **Service Account JSON**
   - `GOOGLE_APPLICATION_CREDENTIALS` env variable ile JSON dosya yolunu belirtin

### Storage Bucket

Dosya yüklemeleri için Firebase Storage kullanılır. Bucket otomatik olarak yapılandırılır.

## 🐛 Sorun Giderme

### "Firebase Admin credentials not found" Hatası

`.env.local` dosyasının mevcut olduğundan ve doğru bilgileri içerdiğinden emin olun.

### Kamera Erişim Hatası

- Tarayıcı kamera iznini kontrol edin
- HTTPS üzerinden erişim gereklidir (localhost hariç)
- Başka bir uygulama kamerayı kullanıyor olabilir

### Dosya Yükleme Hatası

- Firebase Storage rules'ları kontrol edin
- Dosya boyutu 5MB'dan küçük olmalıdır
- Sadece JPG, PNG, WebP formatları desteklenir

## 📝 Değişiklikler (Son Güncelleme)

### Optimizasyonlar

✅ **Environment Variables**
- `.env.local` dosyası oluşturuldu
- Firebase Admin credentials environment'a taşındı

✅ **Firebase Admin Singleton**
- Tek instance pattern uygulandı
- Multiple initialization sorunu çözüldü
- Memory leak önlendi

✅ **File Upload İyileştirme**
- Bucket initialization handler içine taşındı
- Hardcoded path'ler kaldırıldı
- Error handling iyileştirildi

✅ **QR Scanner Error Handling**
- Detaylı hata mesajları eklendi
- Kamera izin kontrolleri geliştirildi
- Kullanıcı dostu feedback

✅ **Code Quality**
- Console.log'lar temizlendi (production)
- Error handling standardize edildi
- .gitignore güncellendi

## 📞 Destek

Sorularınız için: destek@neredeapp.com.tr

---

**Version:** 1.0.1  
**Son Güncelleme:** Aralık 2025  
**Durum:** ✅ Production Ready
