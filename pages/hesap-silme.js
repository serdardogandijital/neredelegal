import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function HesapSilme() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ana Sayfaya Dön
          </Link>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Hesap Silme
            </h1>
            <p className="text-sm text-gray-500 mb-8">Son Güncelleme: 7 Ocak 2026</p>

            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                Hesabınızı Nasıl Silebilirsiniz?
              </h2>
              <p className="text-gray-700 mb-6">Hesabınızı silmek için aşağıdaki adımları izleyin:</p>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Uygulama İçinden Silme</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-6">
                <li>Uygulamayı açın</li>
                <li>Profil sekmesine gidin</li>
                <li>Ayarlar bölümüne gidin</li>
                <li>"Hesabı Sil" seçeneğini bulun</li>
                <li>Onay mesajını okuyun ve "Sil" butonuna tıklayın</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. E-posta ile Silme Talebi</h3>
              <p className="text-gray-700 mb-4">
                Uygulama içinden silemiyorsanız, destek@nerede.app adresine e-posta göndererek hesap silme talebinde bulunabilirsiniz. E-postanızda:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>E-posta adresiniz</li>
                <li>Kullanıcı adınız</li>
                <li>Hesap silme talebiniz</li>
              </ul>
              <p className="text-gray-700 mb-6">belirtilmelidir.</p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                Hesap Silme Sonrası
              </h2>
              <p className="text-gray-700 mb-4">Hesabınız silindiğinde:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Tüm kişisel bilgileriniz silinir</li>
                <li>Check-in geçmişiniz silinir</li>
                <li>Puanlarınız ve rozetleriniz silinir</li>
                <li>Paylaşımlarınız silinir</li>
                <li>Yorumlarınız silinir</li>
                <li>Takip ilişkileriniz silinir</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                Önemli Notlar
              </h2>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-l-4 border-yellow-500 mb-6">
                <p className="text-yellow-900 font-semibold mb-2">⚠️ Uyarı</p>
                <p className="text-yellow-800">
                  Hesap silme işlemi geri alınamaz. Tüm verileriniz kalıcı olarak silinir.
                </p>
              </div>

              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Hesap silme işlemi geri alınamaz</li>
                <li>Yasal saklama süreleri hariç, tüm verileriniz silinir</li>
                <li>Silinen hesap ile aynı e-posta ile yeni hesap oluşturabilirsiniz</li>
                <li>Hesap silme işlemi genellikle 24 saat içinde tamamlanır</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                Veri Saklama Süreleri
              </h2>
              <p className="text-gray-700 mb-4">Yasal gereklilikler nedeniyle, bazı veriler belirli süreler boyunca saklanabilir:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong className="text-gray-900">Mali Kayıtlar:</strong> 10 yıl (Vergi mevzuatı gereği)</li>
                <li><strong className="text-gray-900">İletişim Kayıtları:</strong> 2 yıl (KVKK gereği)</li>
                <li><strong className="text-gray-900">Güvenlik Logları:</strong> 1 yıl</li>
              </ul>
              <p className="text-gray-700 mb-6">Bu süreler sonunda tüm veriler kalıcı olarak silinir.</p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                KVKK Kapsamında Veri Silme
              </h2>
              <p className="text-gray-700 mb-4">
                KVKK (Kişisel Verilerin Korunması Kanunu) kapsamında, kişisel verilerinizin silinmesini talep edebilirsiniz. Talebiniz için:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>E-posta: destek@nerede.app</li>
                <li>Konu: "KVKK Veri Silme Talebi"</li>
                <li>E-postanızda kimlik doğrulama bilgilerinizi belirtin</li>
              </ul>
              <p className="text-gray-700 mb-6">Talebiniz 30 gün içinde değerlendirilir ve sonuçlandırılır.</p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                İletişim
              </h2>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-l-4 border-indigo-600 mb-6">
                <p className="text-gray-700 mb-2">
                  <strong className="text-gray-900">E-posta:</strong>{' '}
                  <a href="mailto:destek@nerede.app" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    destek@nerede.app
                  </a>
                </p>
                <p className="text-gray-700">
                  <strong className="text-gray-900">Konu:</strong> Hesap Silme Talebi veya KVKK Veri Silme Talebi
                </p>
              </div>

              <p className="text-sm text-gray-500 italic">
                Bu sayfa, App Store ve Google Play Store hesap silme gereksinimlerine uygun olarak hazırlanmıştır.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
