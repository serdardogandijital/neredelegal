import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function GizlilikPolitikasi() {
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
              Gizlilik Politikası
            </h1>
            <p className="text-sm text-gray-500 mb-8">Son Güncelleme: 7 Ocak 2026</p>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-6">
                nerede? uygulamasını kullanarak, bu Gizlilik Politikası'nı kabul etmiş sayılırsınız. Lütfen bu politikayı dikkatle okuyun.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                1. Toplanan Bilgiler
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.1. Kişisel Bilgiler</h3>
              <p className="text-gray-700 mb-4">Uygulamayı kullanırken aşağıdaki bilgileri topluyoruz:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong className="text-gray-900">Hesap Bilgileri:</strong> Ad, soyad, e-posta adresi, kullanıcı adı</li>
                <li><strong className="text-gray-900">İletişim Bilgileri:</strong> Telefon numarası (opsiyonel)</li>
                <li><strong className="text-gray-900">Profil Bilgileri:</strong> Profil fotoğrafı, şehir bilgisi</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.2. Kullanım Verileri</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Check-in geçmişi ve lokasyon bilgileri</li>
                <li>Mekan ziyaretleri ve değerlendirmeleri</li>
                <li>Puan ve rozet kazanma geçmişi</li>
                <li>Uygulama kullanım istatistikleri</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1.3. Cihaz Bilgileri</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Cihaz modeli ve işletim sistemi</li>
                <li>Benzersiz cihaz tanımlayıcıları</li>
                <li>IP adresi</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                2. Bilgilerin Kullanımı
              </h2>
              <p className="text-gray-700 mb-4">Toplanan bilgileri aşağıdaki amaçlarla kullanıyoruz:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Hesap oluşturma ve yönetimi</li>
                <li>Hizmetlerimizi sunma ve geliştirme</li>
                <li>Kullanıcı deneyimini kişiselleştirme</li>
                <li>Kampanya ve bildirimler gönderme</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Yasal yükümlülükleri yerine getirme</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                3. Bilgilerin Paylaşımı
              </h2>
              <p className="text-gray-700 mb-4">Kişisel bilgilerinizi aşağıdaki durumlarda paylaşabiliriz:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong className="text-gray-900">Hizmet Sağlayıcılar:</strong> Firebase (Google), analitik servisleri</li>
                <li><strong className="text-gray-900">Reklam Ortakları:</strong> Google AdMob (anonim veriler)</li>
                <li><strong className="text-gray-900">Yasal Gereklilikler:</strong> Mahkeme kararı veya yasal zorunluluk durumunda</li>
                <li><strong className="text-gray-900">İş Ortakları:</strong> Mekan işletmeleri (sadece check-in bilgileri, anonim)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                4. Veri Güvenliği
              </h2>
              <p className="text-gray-700 mb-4">Verilerinizin güvenliği için:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>SSL/TLS şifreleme kullanıyoruz</li>
                <li>Firebase güvenlik özelliklerini aktif tutuyoruz</li>
                <li>Düzenli güvenlik denetimleri yapıyoruz</li>
                <li>Erişim kontrolleri uyguluyoruz</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                5. Kullanıcı Hakları (KVKK)
              </h2>
              <p className="text-gray-700 mb-4">KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenen verileriniz hakkında bilgi talep etme</li>
                <li>Verilerinizin düzeltilmesini isteme</li>
                <li>Verilerinizin silinmesini isteme</li>
                <li>Verilerinizin aktarılmasını isteme</li>
                <li>İtiraz etme hakkı</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                6. Çerezler ve Takip Teknolojileri
              </h2>
              <p className="text-gray-700 mb-4">Uygulamamız aşağıdaki teknolojileri kullanır:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Firebase Analytics (kullanım analizi)</li>
                <li>Google AdMob (reklam gösterimi)</li>
                <li>Lokasyon servisleri (yakın mekanları bulma)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                7. Üçüncü Taraf Servisler
              </h2>
              <p className="text-gray-700 mb-4">Uygulamamız aşağıdaki üçüncü taraf servisleri kullanır:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong className="text-gray-900">Google Firebase:</strong> Veri depolama, kimlik doğrulama, analitik</li>
                <li><strong className="text-gray-900">Google AdMob:</strong> Reklam gösterimi</li>
                <li><strong className="text-gray-900">Google Maps:</strong> Harita ve konum servisleri</li>
              </ul>
              <p className="text-gray-700 mb-6">Bu servislerin gizlilik politikaları kendi web sitelerinde mevcuttur.</p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                8. Veri Saklama
              </h2>
              <p className="text-gray-700 mb-6">
                Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesap silindiğinde, yasal saklama süreleri hariç, tüm verileriniz silinir.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                9. Çocukların Gizliliği
              </h2>
              <p className="text-gray-700 mb-6">
                Uygulamamız 13 yaş altı çocuklardan bilerek veri toplamaz. 13 yaş altı bir çocuğun verilerini topladığımızı fark edersek, derhal sileriz.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                10. Politika Değişiklikleri
              </h2>
              <p className="text-gray-700 mb-6">
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişikliklerde kullanıcıları bilgilendiririz.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                11. İletişim
              </h2>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-l-4 border-indigo-600 mb-6">
                <p className="text-gray-700 mb-2">
                  <strong className="text-gray-900">Veri Sorumlusu:</strong> nerede? Uygulaması
                </p>
                <p className="text-gray-700">
                  <strong className="text-gray-900">İletişim:</strong>{' '}
                  <a href="mailto:destek@neredeapp.com.tr" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    destek@neredeapp.com.tr
                  </a>
                </p>
              </div>

              <p className="text-sm text-gray-500 italic">
                Bu gizlilik politikası, Türkiye Cumhuriyeti 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
