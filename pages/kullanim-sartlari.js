import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function KullanimSartlari() {
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
              Kullanım Şartları
            </h1>
            <p className="text-sm text-gray-500 mb-8">Son Güncelleme: 7 Ocak 2026</p>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed mb-6">
                nerede? uygulamasını kullanarak, aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Lütfen bu şartları dikkatle okuyun.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                1. Kabul ve Onay
              </h2>
              <p className="text-gray-700 mb-6">
                Bu uygulamayı kullanarak, aşağıdaki kullanım şartlarını kabul etmiş sayılırsınız. Eğer bu şartları kabul etmiyorsanız, lütfen uygulamayı kullanmayın.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                2. Hesap Oluşturma
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Hesap oluştururken doğru ve güncel bilgiler vermelisiniz</li>
                <li>Hesap bilgilerinizin güvenliğinden siz sorumlusunuz</li>
                <li>Hesabınızın yetkisiz kullanımından siz sorumlusunuz</li>
                <li>Birden fazla hesap oluşturulamaz</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                3. Yasaklanan İçerik ve Davranışlar
              </h2>
              <p className="text-gray-700 mb-4">Aşağıdaki içerik ve davranışlar kesinlikle yasaktır:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li><strong className="text-gray-900">Nefret Söylemi:</strong> Irk, din, cinsiyet, etnik köken temelinde ayrımcılık</li>
                <li><strong className="text-gray-900">Spam ve Yanıltıcı İçerik:</strong> Sahte bilgiler, spam mesajlar</li>
                <li><strong className="text-gray-900">Telif Hakkı İhlali:</strong> Başkalarının içeriğini izinsiz kullanma</li>
                <li><strong className="text-gray-900">Kişisel Bilgi Paylaşımı:</strong> Başkalarının kişisel bilgilerini izinsiz paylaşma</li>
                <li><strong className="text-gray-900">Taciz ve Zorbalık:</strong> Diğer kullanıcılara zarar verme</li>
                <li><strong className="text-gray-900">Yasadışı Faaliyetler:</strong> Her türlü yasadışı içerik ve davranış</li>
                <li><strong className="text-gray-900">Uygunsuz İçerik:</strong> Yetişkin içerik, şiddet, uyuşturucu teşviki</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                4. Sıfır Tolerans Politikası
              </h2>
              <p className="text-gray-700 mb-4">
                Uygulamamız yukarıda belirtilen yasaklanan içerik ve davranışlara karşı sıfır tolerans politikası uygular. Bu tür içerik veya davranışlar tespit edildiğinde:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>İçerik anında kaldırılacaktır</li>
                <li>Kullanıcı hesabı kalıcı olarak askıya alınacak veya silinecektir</li>
                <li>Gerekli durumlarda yasal işlem başlatılacaktır</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                5. İçerik Moderasyonu
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Tüm kullanıcı içeriği otomatik ve manuel moderasyon sistemleri ile kontrol edilir</li>
                <li>Uygunsuz içerik tespit edildiğinde 24 saat içinde kaldırılır</li>
                <li>Kullanıcılar içeriği bildirebilir (flag/report)</li>
                <li>Zararlı kullanıcılar engellenebilir (block)</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                6. Kullanıcı Hakları
              </h2>
              <p className="text-gray-700 mb-4">Kullanıcılar olarak şu haklara sahipsiniz:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Uygunsuz içeriği bildirme (flag/report)</li>
                <li>Zararlı kullanıcıları engelleme (block)</li>
                <li>Hesabınızı silme</li>
                <li>Verilerinize erişim ve silme talebi</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                7. Fikri Mülkiyet
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Uygulama içeriği ve tasarımı telif hakkı ile korunmaktadır</li>
                <li>Kullanıcılar tarafından oluşturulan içeriklerin telif hakkı kullanıcıya aittir</li>
                <li>İçeriklerinizi paylaşarak, uygulamada kullanılmasına izin vermiş sayılırsınız</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                8. Puan ve Ödüller
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Kazanılan puanlar ve ödüller dijital içeriklerdir</li>
                <li>Gerçek para ile değiştirilemez</li>
                <li>Hesap silindiğinde puanlar ve ödüller kaybolur</li>
                <li>Dolandırıcılık tespit edildiğinde puanlar iptal edilir</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                9. Sorumluluk Reddi
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Uygulama sahibi, kullanıcılar tarafından oluşturulan içeriklerden sorumlu değildir</li>
                <li>Mekan bilgilerinin doğruluğundan sorumlu değiliz</li>
                <li>Hizmet kesintilerinden sorumlu değiliz</li>
                <li>Üçüncü taraf servislerden kaynaklanan sorunlardan sorumlu değiliz</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                10. Hesap İptali ve Silme
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                <li>Hesabınızı istediğiniz zaman silebilirsiniz</li>
                <li>Hesap silindiğinde tüm verileriniz kalıcı olarak silinir</li>
                <li>Hesap silme işlemi geri alınamaz</li>
                <li>Yasal saklama süreleri hariç, tüm veriler silinir</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                11. Değişiklikler
              </h2>
              <p className="text-gray-700 mb-6">
                Bu kullanım şartlarını zaman zaman güncelleyebiliriz. Önemli değişikliklerde kullanıcıları bilgilendiririz. Değişikliklerden sonra uygulamayı kullanmaya devam etmeniz, güncellenmiş şartları kabul ettiğiniz anlamına gelir.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                12. Uygulanacak Hukuk
              </h2>
              <p className="text-gray-700 mb-6">
                Bu kullanım şartları Türkiye Cumhuriyeti yasalarına tabidir. Herhangi bir uyuşmazlık durumunda Türkiye Cumhuriyeti mahkemeleri yetkilidir.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-indigo-600 pl-4">
                13. İletişim
              </h2>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-l-4 border-indigo-600 mb-6">
                <p className="text-gray-700">
                  <strong className="text-gray-900">İletişim:</strong>{' '}
                  <a href="mailto:destek@neredeapp.com.tr" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    destek@neredeapp.com.tr
                  </a>
                </p>
              </div>

              <p className="text-sm text-gray-500 italic">
                Bu kullanım şartları, App Store ve Google Play Store gereksinimlerine uygun olarak hazırlanmıştır.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
