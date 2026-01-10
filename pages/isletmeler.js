import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

const BENEFITS = [
  {
    title: 'Yeni Müşteriler Kazanın',
    description: 'Şehrinizdeki genç ve aktif kullanıcı kitlesine ulaşın, kampanyalarınızla dikkat çekin.',
    icon: '📈'
  },
  {
    title: 'Sadakat Oluşturun',
    description: 'QR check-in ve puan sistemiyle müşterilerinizi tekrar tekrar gelmeye teşvik edin.',
    icon: '🎯'
  },
  {
    title: 'Veri Odaklı Kararlar',
    description: 'Gerçek zamanlı panelden ziyaret, kampanya ve müşteri davranışlarını takip edin.',
    icon: '📊'
  }
];

const WHY = [
  {
    title: 'Dakikalar İçinde Başlayın',
    description: 'İşletme paneliyle mekanınızı ekleyin, standinizde QR kodunuzu konumlandırın ve hemen ödül dağıtmaya başlayın.'
  },
  {
    title: 'Ölçülebilir Kampanyalar',
    description: 'Hangi kampanyanın daha çok çekiş aldığını görün, hızlıca optimize edin.'
  },
  {
    title: 'Yerel Topluluk Desteği',
    description: 'nerede? topluluğu mekanınızı içeriklerde öne çıkarır, etkinlikleriniz duyurulur.'
  }
];

const STEPS = [
  {
    title: 'Kayıt ve Onboarding',
    text: 'Ekibimiz mekan bilgilerinizi toplar, panel erişiminizi tanımlar ve QR kitinizi hazırlar.',
    badge: '1'
  },
  {
    title: 'Kampanya Tasarımı',
    text: 'Özel indirim, hediyeler veya etkinlik bileti gibi teşvikleri birlikte tasarlarız.',
    badge: '2'
  },
  {
    title: 'Aktivasyon ve Ölçüm',
    text: 'Müşterileriniz check-in yaptıkça puan kazanır; siz panelden tüm metrikleri izlersiniz.',
    badge: '3'
  }
];

const TESTIMONIALS = [
  {
    name: 'Mahir Bey',
    role: 'Kafe Sahibi • Kütahya',
    quote: 'nerede? sayesinde Perşembe kampanyamız viral oldu, sadakat puanları gerçekten işe yarıyor.'
  },
  {
    name: 'Selin Hanım',
    role: 'Restoran Müdürü • Eskişehir',
    quote: 'Paneldeki verilerle hangi saatlerde yoğun olduğumuzu görüp kampanyaları ona göre ayarlıyoruz.'
  }
];

export default function BusinessLanding() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-200 mb-4">
              <span className="h-2 w-2 rounded-full bg-blue-300"></span>
              İşletmeler için nerede?
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-6">
              Şehrinizin <span className="text-blue-200">popüler mekanı</span> olun
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              nerede?, fiziksel mekanların check-in, puan ve kampanya deneyimleriyle sadık topluluklar oluşturmasını sağlar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:+905434301320"
                className="px-8 py-4 rounded-2xl bg-white text-blue-900 font-semibold shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Satış Ekibini Ara
              </a>
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl border border-white/60 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Paneli İncele
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold">+120</p>
                <p className="text-sm text-blue-200">Aktif Kampanya</p>
              </div>
              <div>
                <p className="text-3xl font-bold">600+</p>
                <p className="text-sm text-blue-200">Check-in / gün</p>
              </div>
              <div>
                <p className="text-3xl font-bold">%38</p>
                <p className="text-sm text-blue-200">Tekrar ziyaret artışı</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-3xl border border-white/10 p-8 backdrop-blur">
            <div className="space-y-6">
              <div className="p-6 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-blue-200 text-sm">Gerçek Zamanlı Panel</p>
                <p className="text-3xl font-bold mt-2">Paneliniz Tek Ekranda</p>
                <p className="text-blue-100 mt-4 text-sm">
                  Mekanlar, kampanyalar, check-in akışı ve sadakat verileri tek panelde bir arada.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                  <p className="text-2xl font-bold">4 dk</p>
                  <p className="text-xs text-blue-200">İlk check-in süresi</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                  <p className="text-2xl font-bold">+85%</p>
                  <p className="text-xs text-blue-200">Kampanya geri dönüşü</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-xs text-blue-200">Destek</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/5">
                  <p className="text-2xl font-bold">600</p>
                  <p className="text-xs text-blue-200">Başlangıç puanı</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-600 font-semibold uppercase tracking-wide text-sm mb-3">
            neden nerede?
          </p>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">İşletmeler İçin Net Faydalar</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            Her check-in, hem müşterileriniz hem de ekibiniz için ölçülebilir değere dönüşsün.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BENEFITS.map((item) => (
              <div key={item.title} className="p-8 rounded-2xl border border-blue-100 shadow-sm hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-blue-600 font-semibold uppercase tracking-wide text-sm mb-3">
              işletmeniz için
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              nerede? ile dakikalar içinde sadakat programı kurun
            </h2>
            <p className="text-gray-600 mb-8">
              QR kod, puan ve kampanya modülleri; restoran, kafe, eğlence ve deneyim mekanlarına göre optimize edildi.
            </p>
            <div className="space-y-6">
              {WHY.map((item) => (
                <div key={item.title} className="p-6 bg-white rounded-2xl border border-blue-100 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-blue-100 shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Nasıl Çalışır?</h3>
            <div className="space-y-6">
              {STEPS.map((step) => (
                <div key={step.title} className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold">
                    {step.badge}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                    <p className="text-gray-600">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-blue-600 font-semibold uppercase tracking-wide text-sm mb-3">
            işletme yorumları
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Partnerlerimiz ne söylüyor?</h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-12">
            Topluluğumuza katılan işletmeler, nerede? ile hem yeni müşteri kazanıyor hem de tekrar ziyaretleri artırıyor.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((item) => (
              <div key={item.name} className="p-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white text-left shadow-xl">
                <p className="text-lg leading-relaxed mb-6">“{item.quote}”</p>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-blue-200">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-950 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-500/30 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/30 blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p className="text-blue-200 font-semibold uppercase tracking-wide text-sm mb-3">
            hazır mısınız?
          </p>
          <h2 className="text-4xl font-bold mb-4">İşletmenizi 1 haftada nerede? ekosistemine dahil edelim</h2>
          <p className="text-blue-100 mb-8">
            Satış ekibimizle hemen görüşün, panel demomuzu izleyin ve kampanyanızı planlayalım.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://forms.gle/neredeisletme"
              className="px-10 py-4 rounded-2xl bg-white text-blue-900 font-semibold hover:-translate-y-0.5 transition-all"
            >
              Demo Talep Et
            </a>
            <a
              href="mailto:destek@neredeapp.com.tr"
              className="px-10 py-4 rounded-2xl border border-white/60 text-white font-semibold hover:bg-white/10 transition-all"
            >
              destek@neredeapp.com.tr
            </a>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            Telefon: <a href="tel:+905434301320" className="underline">+90 543 430 13 20</a>
          </p>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
