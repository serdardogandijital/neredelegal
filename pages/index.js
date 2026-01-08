import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';
import screenEvents from '../public/screens/iPhone15_Pro_Events_Page.png';
import screenKebab from '../public/screens/iPhone15_Pro_Kebab_Thumbnail.png';
import screenSalad from '../public/screens/iPhone15_Pro_Salad.png';

export default function Home() {
  const sliderScreens = [
    {
      image: screenEvents,
      title: 'Etkinlik Akışı',
      description: 'Şehrindeki etkinlikleri keşfet, katıl ve puan kazan.'
    },
    {
      image: screenKebab,
      title: 'Mekan Detayları',
      description: 'Favori restoranların kampanyalarını anında gör.'
    },
    {
      image: screenSalad,
      title: 'Kampanya Kartları',
      description: 'Her check-in sonrasında kazandığın ödülleri takip et.'
    }
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderScreens.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliderScreens.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img
                  src="/nerede-app-icon.png"
                  alt="nerede? uygulama ikonu"
                  className="w-24 h-24 rounded-3xl shadow-2xl transform hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm font-bold shadow-lg backdrop-blur">
                🎉 Şimdi Canlıda!
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
              Her Şehirde,
              <span className="block text-blue-200">
                Her Fırsatta
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-10 leading-relaxed max-w-3xl mx-auto">
              Yakınındaki mekanları keşfet, puan kazan, deneyimlerini paylaş. 
              QR kodunla check-in yap, rozetler topla ve özel kampanyalardan faydalan!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="https://apps.apple.com/tr/app/nerede/id6756880480"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-10 py-4 bg-white text-blue-900 rounded-2xl hover:bg-blue-50 hover:shadow-2xl transform hover:-translate-y-1 transition-all font-bold text-base flex items-center gap-3"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store'dan İndir
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=nerede.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group px-10 py-4 bg-transparent text-white rounded-2xl border-2 border-white/60 hover:bg-white/10 hover:shadow-2xl transform hover:-translate-y-1 transition-all font-bold text-base flex items-center gap-3"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Google Play'den İndir
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Ücretsiz Kullanım</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Güvenli Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Anında Başla</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Nasıl Çalışır?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              QR kodunla puan kazan, özel fırsatlardan faydalan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-2xl text-2xl font-bold mb-6 shadow-lg ring-4 ring-blue-100">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Uygulamayı İndir</h3>
              <p className="text-gray-600">
                iOS veya Android cihazına ücretsiz indir ve hesap oluştur
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-2xl text-2xl font-bold mb-6 shadow-lg ring-4 ring-blue-100">
                📍
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mekan Keşfet</h3>
              <p className="text-gray-600">
                Yakınındaki kafe, restoran ve alışveriş mekanlarını keşfet
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-2xl text-2xl font-bold mb-6 shadow-lg ring-4 ring-blue-100">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">QR ile Puan Kazan</h3>
              <p className="text-gray-600">
                İşletmelerde QR kodunu okut, anında 600 puan kazan ve kampanyalardan faydalan
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                Şimdi iOS ve Android'de!
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                nerede? mobil uygulamasını hemen indir, yakınındaki mekanları keşfet ve puan kazanmaya başla.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-2xl text-white">
                    📍
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Yakınındaki Mekanları Keşfet</h4>
                    <p className="text-gray-600">Kafe, restoran ve alışveriş mekanlarını haritada gör</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-2xl text-white">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Perşembe Avantajı</h4>
                    <p className="text-gray-600">Her perşembe +35 puan bonus kazan!</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-2xl text-white">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Etkinlikler ve Oyunlar</h4>
                    <p className="text-gray-600">Oyunlarla puan kazan, etkinliklere katıl, bilet al</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="relative z-10 w-full max-w-sm">
                <div className="rounded-[24px] border border-blue-100 bg-white shadow-2xl p-4">
                  <div className="relative w-full aspect-[9/19] rounded-[20px] overflow-hidden bg-gradient-to-b from-blue-50 to-white">
                    <div
                      className="flex h-full transition-transform duration-700 ease-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {sliderScreens.map((screen, idx) => (
                        <div key={screen.title} className="min-w-full h-full relative">
                          <Image
                            src={screen.image}
                            alt={`${screen.title} ekran görüntüsü`}
                            fill
                            priority={idx === 0}
                            sizes="(max-width: 1024px) 100vw, 420px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center space-y-1.5">
                  <p className="text-sm uppercase tracking-wide text-blue-500 font-semibold">
                    {sliderScreens[currentSlide].title}
                  </p>
                  <p className="text-base text-gray-600">
                    {sliderScreens[currentSlide].description}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2">
                  {sliderScreens.map((screen, index) => (
                    <button
                      key={screen.title}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full border transition-all ${
                        index === currentSlide
                          ? 'bg-blue-900 border-blue-900 scale-110'
                          : 'bg-white border-blue-200 hover:bg-blue-100'
                      }`}
                      aria-label={`${screen.title} slaytına git`}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl animate-float"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-2xl animate-float animation-delay-2000"></div>
              <div className="absolute top-1/2 -right-16 w-24 h-24 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
              <div className="absolute top-1/4 -left-16 w-28 h-28 bg-blue-400 rounded-full opacity-10 blur-3xl animate-pulse animation-delay-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Neler Sunuyoruz?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              nerede? ile şehri keşfetmenin en eğlenceli yolunu deneyimle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mekan Keşfi</h3>
              <p className="text-gray-600">
                Yakınındaki restoranları, kafeleri ve eğlence mekanlarını keşfet. Harita üzerinde kolayca gör ve yol tarifi al.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">QR Kodunla Puan Kazan</h3>
              <p className="text-gray-600">
                İşletmelerde QR kodunu okut, anında 600 puan kazan ve özel kampanyalardan faydalan.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Kampanyalar</h3>
              <p className="text-gray-600">
                İşletmelerin sunduğu özel kampanyalardan faydalan. İndirimler, hediyeler ve daha fazlası!
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Rozetler ve Biletler</h3>
              <p className="text-gray-600">
                Kazandığın başarıları rozetlerle sergile, etkinliklere bilet al ve katıl.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Takipçi Sistemi</h3>
              <p className="text-gray-600">
                Arkadaşlarını takip et, deneyimlerini paylaş ve sosyal ağını genişlet.
              </p>
            </div>

            <div className="bg-white/80 border border-blue-100 rounded-2xl p-8 hover:shadow-2xl transition-shadow backdrop-blur">
              <div className="h-14 w-14 bg-blue-900 rounded-xl flex items-center justify-center mb-6 text-white">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">İstatistikler</h3>
              <p className="text-gray-600">
                Ziyaret ettiğin mekanları, kazandığın puanları ve rozetleri takip et. İlerlemeni gör!
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                nerede? Hakkında
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                nerede? şehirdeki mekanları keşfetmenin, sosyalleşmenin ve ödüller kazanmanın 
                en eğlenceli yoludur. Kullanıcılarımız check-in yaparak puan kazanır, rozetler 
                toplar ve özel kampanyalardan faydalanır.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                İşletmeler için de güçlü bir platform sunuyoruz. Mekanlarını tanıtabilir, 
                kampanyalar oluşturabilir ve müşterileriyle doğrudan etkileşime geçebilirler.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://apps.apple.com/tr/app/nerede/id6756880480"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-blue-900 rounded-lg hover:bg-blue-50 hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2 border border-blue-100"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  App Store
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=nerede.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-transparent text-blue-900 rounded-lg border-2 border-blue-900 hover:bg-blue-900 hover:text-white hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl p-8 shadow-xl border border-blue-700">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-white/90 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Kolay Kullanım</h4>
                      <p className="text-blue-200">Sade ve kullanıcı dostu arayüz</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-white/90 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">Güvenli Platform</h4>
                      <p className="text-blue-200">Verileriniz güvende ve şifreli</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-white/90 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">7/24 Destek</h4>
                      <p className="text-blue-200">Her zaman yanınızdayız</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Hemen Başlamaya Hazır mısın?
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Şehri keşfetmeye, puan kazanmaya ve özel kampanyalardan faydalanmaya bugün başla!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="https://apps.apple.com/tr/app/nerede/id6756880480"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-12 py-5 bg-white text-blue-900 rounded-2xl hover:bg-blue-50 hover:shadow-2xl transform hover:-translate-y-1 transition-all font-bold text-lg flex items-center gap-3"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store'dan İndir
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=nerede.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-12 py-5 bg-transparent text-white rounded-2xl border-2 border-white/60 hover:bg-white/10 hover:text-white hover:shadow-2xl transform hover:-translate-y-1 transition-all font-bold text-lg flex items-center gap-3"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play'den İndir
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            Ücretsiz indir • iOS ve Android • Hemen keşfetmeye başla
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        
        .animate-slide-in {
          animation: slide-in 0.6s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      <LandingFooter />
    </div>
  );
}

