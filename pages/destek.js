import { useState } from 'react';
import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import LandingFooter from '../components/LandingFooter';

export default function Destek() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqCategories = [
    {
      id: 'hesap',
      title: '👤 Hesap İşlemleri',
      icon: '👤',
      questions: [
        {
          q: 'Hesap nasıl oluşturulur?',
          a: 'Uygulamayı indirdikten sonra "Kayıt Ol" butonuna tıklayın. E-posta adresiniz, kullanıcı adınız ve şifrenizi girerek hesap oluşturabilirsiniz. Alternatif olarak Google hesabınızla da giriş yapabilirsiniz.'
        },
        {
          q: 'Şifremi unuttum, ne yapmalıyım?',
          a: 'Giriş ekranında "Şifremi Unuttum" seçeneğine tıklayın. Kayıtlı e-posta adresinize şifre sıfırlama linki gönderilecektir.'
        },
        {
          q: 'Hesabımı nasıl silebilirim?',
          a: 'Profil → Ayarlar → Hesabı Sil yolunu izleyerek hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.'
        },
        {
          q: 'E-posta adresimi nasıl değiştirebilirim?',
          a: 'Profil → Ayarlar → Hesap Bilgileri bölümünden e-posta adresinizi güncelleyebilirsiniz.'
        }
      ]
    },
    {
      id: 'puan',
      title: '🎁 Puan Sistemi',
      icon: '🎁',
      questions: [
        {
          q: 'Nasıl puan kazanabilirim?',
          a: 'Mekanlara check-in yaparak, QR kod tarayarak, kampanyalara katılarak, arkadaşlarınızı davet ederek ve günlük görevleri tamamlayarak puan kazanabilirsiniz.'
        },
        {
          q: 'Puanlarım ne işe yarar?',
          a: 'Kazandığınız puanlarla rozetler açabilir, liderlik tablosunda yükselebilir ve özel kampanyalardan faydalanabilirsiniz.'
        },
        {
          q: 'Puanlarım neden azaldı?',
          a: 'Puanlar normalde azalmaz. Ancak dolandırıcılık tespit edilirse veya kurallara aykırı davranış durumunda puanlar iptal edilebilir.'
        },
        {
          q: 'Rozetler nasıl kazanılır?',
          a: 'Belirli sayıda check-in yaparak, farklı kategorilerdeki mekanları ziyaret ederek veya özel etkinliklere katılarak rozet kazanabilirsiniz.'
        }
      ]
    },
    {
      id: 'teknik',
      title: '⚙️ Teknik Sorunlar',
      icon: '⚙️',
      questions: [
        {
          q: 'QR kod taramıyor, ne yapmalıyım?',
          a: 'Öncelikle uygulamaya kamera izni verdiğinizden emin olun (Ayarlar → nerede? → Kamera). QR kodun iyi aydınlatılmış olduğundan ve net göründüğünden emin olun. Sorun devam ederse uygulamayı yeniden başlatın.'
        },
        {
          q: 'Uygulama çöküyor/donuyor',
          a: 'Uygulamayı tamamen kapatıp yeniden açmayı deneyin. Sorun devam ederse uygulamayı güncelleyin veya kaldırıp yeniden yükleyin.'
        },
        {
          q: 'Check-in yapamıyorum',
          a: 'Konum servislerinizin açık olduğundan emin olun. Mekanın yakınında olduğunuzdan emin olun (genellikle 50 metre içinde). İnternet bağlantınızı kontrol edin.'
        },
        {
          q: 'Bildirimler gelmiyor',
          a: 'Ayarlar → nerede? → Bildirimler bölümünden bildirimlerin açık olduğundan emin olun. Cihazınızın genel bildirim ayarlarını da kontrol edin.'
        }
      ]
    },
    {
      id: 'icerik',
      title: '📝 İçerik Moderasyonu',
      icon: '📝',
      questions: [
        {
          q: 'Uygunsuz içerik nasıl bildirilir?',
          a: 'İçeriğin yanındaki "..." menüsüne tıklayarak "Bildir" seçeneğini kullanabilirsiniz. Ekibimiz 24 saat içinde inceleyecektir.'
        },
        {
          q: 'Hangi içerikler yasak?',
          a: 'Nefret söylemi, taciz, spam, yanıltıcı bilgiler, telif hakkı ihlali, uygunsuz içerik (şiddet, yetişkin içerik) ve yasadışı faaliyetler kesinlikle yasaktır.'
        },
        {
          q: 'Hesabım neden askıya alındı?',
          a: 'Kullanım şartlarını ihlal eden davranışlar tespit edildiğinde hesaplar askıya alınabilir. Detaylı bilgi için destek@neredeapp.com.tr adresine e-posta gönderin.'
        }
      ]
    },
    {
      id: 'gizlilik',
      title: '🔒 Veri ve Gizlilik',
      icon: '🔒',
      questions: [
        {
          q: 'Verilerim güvende mi?',
          a: 'Evet, tüm verileriniz Google Firebase sunucularında SSL/TLS şifreleme ile güvenli bir şekilde saklanmaktadır.'
        },
        {
          q: 'Hangi bilgilerim toplanıyor?',
          a: 'Hesap bilgileriniz (ad, e-posta), check-in geçmişiniz, konum bilgileriniz ve uygulama kullanım istatistikleriniz toplanmaktadır. Detaylı bilgi için Gizlilik Politikası\'nı inceleyin.'
        },
        {
          q: 'Verilerimi nasıl silebilirim?',
          a: 'Hesabınızı silerek tüm verilerinizi kalıcı olarak silebilirsiniz. Alternatif olarak KVKK kapsamında veri silme talebi gönderebilirsiniz.'
        },
        {
          q: 'Konumum sürekli takip ediliyor mu?',
          a: 'Hayır, konum bilginiz sadece check-in yaptığınızda veya yakındaki mekanları ararken kullanılır. Arka planda sürekli takip yapılmaz.'
        }
      ]
    }
  ];

  const toggleFaq = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setOpenFaq(openFaq === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ana Sayfaya Dön
          </Link>

          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Destek ve Yardım
            </h1>
            <p className="text-xl text-gray-600">
              Size yardımcı olmak için buradayız
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow border border-indigo-100">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">E-posta Desteği</h3>
              <a href="mailto:destek@neredeapp.com.tr" className="text-indigo-600 hover:text-indigo-700 font-medium text-lg">
                destek@neredeapp.com.tr
              </a>
              <p className="text-sm text-gray-600 mt-3">48 saat içinde yanıt veriyoruz</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow border border-purple-100">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Canlı Destek</h3>
              <p className="text-gray-700 font-medium text-lg">Yakında</p>
              <p className="text-sm text-gray-600 mt-3">Anlık yardım için hazırlanıyor</p>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-indigo-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow border border-pink-100">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Yardım Merkezi</h3>
              <Link href="/help" className="text-pink-600 hover:text-pink-700 font-medium text-lg">
                Rehberleri İncele
              </Link>
              <p className="text-sm text-gray-600 mt-3">Detaylı kullanım kılavuzları</p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Sık Sorulan Sorular
            </h2>

            <div className="space-y-6">
              {faqCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      {category.title}
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((item, index) => {
                      const key = `${category.id}-${index}`;
                      const isOpen = openFaq === key;
                      
                      return (
                        <div key={index}>
                          <button
                            onClick={() => toggleFaq(category.id, index)}
                            className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                            <svg 
                              className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4 text-gray-700 bg-gray-50">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Sorununuzu bulamadınız mı?</h2>
            <p className="text-xl text-indigo-100 mb-8">
              Destek ekibimizle iletişime geçin, size yardımcı olmaktan mutluluk duyarız
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:destek@neredeapp.com.tr"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                E-posta Gönder
              </a>
              <Link
                href="/help"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-colors inline-flex items-center justify-center border-2 border-white/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Yardım Merkezi
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link 
              href="/gizlilik-politikasi"
              className="flex items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl hover:shadow-md transition-all border border-indigo-100"
            >
              <span className="text-3xl mr-4">🔒</span>
              <div>
                <h4 className="font-bold text-gray-900">Gizlilik Politikası</h4>
                <p className="text-sm text-gray-600">Verileriniz nasıl korunuyor</p>
              </div>
            </Link>
            <Link 
              href="/kullanim-sartlari"
              className="flex items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all border border-purple-100"
            >
              <span className="text-3xl mr-4">📜</span>
              <div>
                <h4 className="font-bold text-gray-900">Kullanım Şartları</h4>
                <p className="text-sm text-gray-600">Kurallar ve politikalar</p>
              </div>
            </Link>
            <Link 
              href="/hesap-silme"
              className="flex items-center p-6 bg-gradient-to-br from-pink-50 to-indigo-50 rounded-xl hover:shadow-md transition-all border border-pink-100"
            >
              <span className="text-3xl mr-4">🗑️</span>
              <div>
                <h4 className="font-bold text-gray-900">Hesap Silme</h4>
                <p className="text-sm text-gray-600">Hesabınızı nasıl silebilirsiniz</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
}
