import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import AdminLayout from '../components/AdminLayout';
import MerchantLayout from '../components/MerchantLayout';

export default function HelpPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticle, setExpandedArticle] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const Layout = user.role === 'admin' ? AdminLayout : MerchantLayout;

  const categories = [
    { id: 'all', name: 'Tümü', icon: '📚' },
    { id: 'getting-started', name: 'Başlangıç', icon: '🚀' },
    { id: 'users', name: 'Kullanıcı Yönetimi', icon: '👥' },
    { id: 'merchants', name: 'İşletme Yönetimi', icon: '🏪' },
    { id: 'campaigns', name: 'Kampanyalar', icon: '🎁' },
    { id: 'analytics', name: 'Analitik', icon: '📊' },
    { id: 'technical', name: 'Teknik', icon: '⚙️' },
  ];

  const helpArticles = [
    {
      id: 1,
      category: 'getting-started',
      title: 'nerede? Platformuna Hoş Geldiniz',
      description: 'Platform hakkında genel bilgiler ve ilk adımlar',
      content: `
        <h3>Platforma Hoş Geldiniz!</h3>
        <p>nerede? platformu, kullanıcıların şehirdeki mekanları keşfetmesini, kampanyalardan faydalanmasını ve sosyal etkileşimde bulunmasını sağlayan kapsamlı bir mobil uygulamadır.</p>
        
        <h4>Temel Özellikler:</h4>
        <ul>
          <li><strong>Mekan Keşfi:</strong> Şehirdeki restoranlar, kafeler, müzeler ve diğer mekanları keşfedin</li>
          <li><strong>Kampanyalar:</strong> Özel indirimler ve tekliflerden yararlanın</li>
          <li><strong>Check-in Sistemi:</strong> Mekanları ziyaret edin ve puan kazanın</li>
          <li><strong>Rozetler:</strong> Başarılarınızı rozetlerle sergileyin</li>
          <li><strong>Rotalar:</strong> Önceden hazırlanmış rota önerilerini takip edin</li>
        </ul>
        
        <h4>İlk Adımlar:</h4>
        <ol>
          <li>Profilinizi tamamlayın</li>
          <li>İlgi alanlarınızı belirleyin</li>
          <li>Yakınınızdaki mekanları keşfetmeye başlayın</li>
          <li>İlk check-in'inizi yapın</li>
        </ol>
      `
    },
    {
      id: 2,
      category: 'users',
      title: 'Kullanıcı Yönetimi',
      description: 'Kullanıcı hesaplarını yönetme ve düzenleme',
      content: `
        <h3>Kullanıcı Yönetimi</h3>
        <p>Admin panelinden kullanıcı hesaplarını görüntüleyebilir, düzenleyebilir ve yönetebilirsiniz.</p>
        
        <h4>Kullanıcı Bilgileri:</h4>
        <ul>
          <li><strong>Profil Bilgileri:</strong> Ad, soyad, email, telefon</li>
          <li><strong>İstatistikler:</strong> Toplam check-in, kazanılan puan, rozetler</li>
          <li><strong>Aktivite Geçmişi:</strong> Son ziyaretler ve işlemler</li>
        </ul>
        
        <h4>Kullanıcı İşlemleri:</h4>
        <ul>
          <li>Kullanıcı bilgilerini düzenleme</li>
          <li>Hesap durumunu değiştirme (aktif/pasif)</li>
          <li>Kullanıcı aktivitelerini görüntüleme</li>
          <li>Puan ve rozet yönetimi</li>
        </ul>
      `
    },
    {
      id: 3,
      category: 'merchants',
      title: 'İşletme Paneli Kullanımı',
      description: 'İşletme hesabınızı yönetme ve mekanlarınızı düzenleme',
      content: `
        <h3>İşletme Paneli</h3>
        <p>İşletme paneli üzerinden mekanlarınızı yönetebilir, kampanyalar oluşturabilir ve müşteri etkileşimlerini takip edebilirsiniz.</p>
        
        <h4>Mekan Yönetimi:</h4>
        <ul>
          <li>Mekan bilgilerini güncelleme (adres, telefon, çalışma saatleri)</li>
          <li>Fotoğraf ve görseller ekleme</li>
          <li>Kategori ve etiket yönetimi</li>
          <li>QR kod oluşturma ve yazdırma</li>
        </ul>
        
        <h4>Kampanya Oluşturma:</h4>
        <ul>
          <li>İndirim kampanyaları tanımlama</li>
          <li>Geçerlilik tarihleri belirleme</li>
          <li>Kullanım koşulları ekleme</li>
          <li>Kampanya performansını izleme</li>
        </ul>
        
        <h4>QR Okutma:</h4>
        <ul>
          <li><strong>Kullanıcı QR:</strong> Müşterilerin check-in yapmasını sağlama</li>
          <li><strong>İndirim QR:</strong> Kampanya kodlarını okutma ve doğrulama</li>
        </ul>
      `
    },
    {
      id: 4,
      category: 'campaigns',
      title: 'Kampanya Yönetimi',
      description: 'Kampanya oluşturma, düzenleme ve takip',
      content: `
        <h3>Kampanya Yönetimi</h3>
        <p>Platformda farklı türde kampanyalar oluşturabilir ve yönetebilirsiniz.</p>
        
        <h4>Kampanya Türleri:</h4>
        <ul>
          <li><strong>İndirim Kampanyaları:</strong> Yüzde veya tutar bazlı indirimler</li>
          <li><strong>Hediye Kampanyaları:</strong> Belirli koşullarda hediye ürün</li>
          <li><strong>Puan Kampanyaları:</strong> Ekstra puan kazanma fırsatları</li>
          <li><strong>Zaman Sınırlı:</strong> Belirli saatlerde geçerli özel teklifler</li>
        </ul>
        
        <h4>Kampanya Oluşturma Adımları:</h4>
        <ol>
          <li>Kampanya türünü seçin</li>
          <li>Kampanya detaylarını girin (başlık, açıklama, görsel)</li>
          <li>İndirim miktarını belirleyin</li>
          <li>Geçerlilik tarihlerini ayarlayın</li>
          <li>Kullanım koşullarını ekleyin</li>
          <li>Kampanyayı yayınlayın</li>
        </ol>
        
        <h4>Kampanya Takibi:</h4>
        <ul>
          <li>Görüntülenme sayıları</li>
          <li>Kullanım istatistikleri</li>
          <li>Dönüşüm oranları</li>
          <li>Gelir analizi</li>
        </ul>
      `
    },
    {
      id: 5,
      category: 'analytics',
      title: 'Analitik ve Raporlama',
      description: 'Platform verilerini analiz etme ve raporlar oluşturma',
      content: `
        <h3>Analitik Dashboard</h3>
        <p>Detaylı analitik verileri ile işletmenizin performansını takip edin.</p>
        
        <h4>Temel Metrikler:</h4>
        <ul>
          <li><strong>Check-in İstatistikleri:</strong> Günlük, haftalık, aylık ziyaret sayıları</li>
          <li><strong>Kullanıcı Etkileşimi:</strong> Aktif kullanıcı sayısı, ortalama ziyaret süresi</li>
          <li><strong>Kampanya Performansı:</strong> Kampanya kullanım oranları, dönüşümler</li>
          <li><strong>Gelir Analizi:</strong> Toplam gelir, ortalama sepet tutarı</li>
        </ul>
        
        <h4>Grafikler ve Görselleştirmeler:</h4>
        <ul>
          <li>Zaman serisi grafikleri</li>
          <li>Kategori bazlı dağılımlar</li>
          <li>Isı haritaları</li>
          <li>Karşılaştırmalı analizler</li>
        </ul>
        
        <h4>Rapor Dışa Aktarma:</h4>
        <ul>
          <li>Excel formatında veri indirme</li>
          <li>PDF rapor oluşturma</li>
          <li>Özelleştirilebilir tarih aralıkları</li>
          <li>Filtreleme ve gruplama seçenekleri</li>
        </ul>
      `
    },
    {
      id: 6,
      category: 'technical',
      title: 'QR Kod Sistemi',
      description: 'QR kod oluşturma, yazdırma ve kullanım',
      content: `
        <h3>QR Kod Sistemi</h3>
        <p>nerede? platformu, check-in ve kampanya doğrulama için QR kod sistemi kullanır.</p>
        
        <h4>QR Kod Türleri:</h4>
        <ul>
          <li><strong>Mekan QR Kodu:</strong> Her mekan için benzersiz QR kod</li>
          <li><strong>Kampanya QR Kodu:</strong> Özel kampanyalar için QR kod</li>
          <li><strong>Kullanıcı QR Kodu:</strong> Her kullanıcının profil QR kodu</li>
        </ul>
        
        <h4>QR Kod Oluşturma:</h4>
        <ol>
          <li>İlgili sayfaya gidin (mekan/kampanya)</li>
          <li>"QR Kod Oluştur" butonuna tıklayın</li>
          <li>QR kod otomatik olarak oluşturulur</li>
          <li>"İndir" veya "Yazdır" seçeneğini kullanın</li>
        </ol>
        
        <h4>QR Kod Okutma:</h4>
        <ul>
          <li>İşletme panelinden "QR Okut" sayfasına gidin</li>
          <li>Kamera izni verin</li>
          <li>QR kodu kamera önüne tutun</li>
          <li>Sistem otomatik olarak okur ve işlemi gerçekleştirir</li>
        </ul>
        
        <h4>Güvenlik:</h4>
        <ul>
          <li>Her QR kod şifrelenmiş veri içerir</li>
          <li>Tek kullanımlık kampanya kodları</li>
          <li>Zaman damgası doğrulaması</li>
          <li>Sahtecilik önleme mekanizmaları</li>
        </ul>
      `
    },
    {
      id: 7,
      category: 'technical',
      title: 'Sorun Giderme',
      description: 'Sık karşılaşılan sorunlar ve çözümleri',
      content: `
        <h3>Sorun Giderme</h3>
        <p>Platform kullanımında karşılaşabileceğiniz sorunlar ve çözüm önerileri.</p>
        
        <h4>Giriş Sorunları:</h4>
        <ul>
          <li><strong>Şifremi unuttum:</strong> Giriş sayfasında "Şifremi Unuttum" linkini kullanın</li>
          <li><strong>Email doğrulama:</strong> Kayıt sonrası email adresinizi doğrulayın</li>
          <li><strong>Hesap kilitlendi:</strong> Destek ekibiyle iletişime geçin</li>
        </ul>
        
        <h4>QR Kod Sorunları:</h4>
        <ul>
          <li><strong>QR kod okumuyor:</strong> Kamera iznini kontrol edin</li>
          <li><strong>Geçersiz QR kod:</strong> QR kodun güncel olduğundan emin olun</li>
          <li><strong>Yavaş okuma:</strong> Aydınlatmayı ve kamera mesafesini ayarlayın</li>
        </ul>
        
        <h4>Performans Sorunları:</h4>
        <ul>
          <li>Tarayıcı önbelleğini temizleyin</li>
          <li>Güncel tarayıcı versiyonu kullanın</li>
          <li>İnternet bağlantınızı kontrol edin</li>
          <li>Sayfayı yenileyin (F5)</li>
        </ul>
        
        <h4>Veri Sorunları:</h4>
        <ul>
          <li><strong>Veriler yüklenmiyor:</strong> Sayfayı yenileyin</li>
          <li><strong>Değişiklikler kaydedilmiyor:</strong> İnternet bağlantısını kontrol edin</li>
          <li><strong>Eski veriler görünüyor:</strong> Önbelleği temizleyin</li>
        </ul>
      `
    },
    {
      id: 8,
      category: 'getting-started',
      title: 'Sistem Gereksinimleri',
      description: 'Platform kullanımı için gerekli teknik özellikler',
      content: `
        <h3>Sistem Gereksinimleri</h3>
        <p>nerede? web panelini sorunsuz kullanabilmek için aşağıdaki gereksinimleri sağlamanız önerilir.</p>
        
        <h4>Desteklenen Tarayıcılar:</h4>
        <ul>
          <li>Google Chrome (önerilen) - son 2 versiyon</li>
          <li>Mozilla Firefox - son 2 versiyon</li>
          <li>Safari - son 2 versiyon</li>
          <li>Microsoft Edge - son 2 versiyon</li>
        </ul>
        
        <h4>Minimum Sistem Özellikleri:</h4>
        <ul>
          <li>İşlemci: 2 GHz veya üzeri</li>
          <li>RAM: 4 GB veya üzeri</li>
          <li>Ekran Çözünürlüğü: 1280x720 veya üzeri</li>
          <li>İnternet Bağlantısı: 5 Mbps veya üzeri</li>
        </ul>
        
        <h4>QR Okutma İçin:</h4>
        <ul>
          <li>Kamera erişimi olan cihaz</li>
          <li>Kamera çözünürlüğü: minimum 720p</li>
          <li>HTTPS bağlantısı (güvenlik için gerekli)</li>
        </ul>
        
        <h4>Mobil Uyumluluk:</h4>
        <ul>
          <li>Responsive tasarım - tüm ekran boyutlarında çalışır</li>
          <li>Mobil tarayıcılar desteklenir</li>
          <li>Touch ekran optimizasyonu</li>
        </ul>
      `
    }
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📚 Yardım Merkezi</h1>
          <p className="text-gray-600">
            Platform kullanımı hakkında detaylı bilgi ve rehberler
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Yardım konularında ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="absolute left-4 top-3.5 text-xl">🔍</span>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-500">Aradığınız kriterlere uygun yardım konusu bulunamadı.</p>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600">{article.description}</p>
                    </div>
                    <span className="text-2xl ml-4">
                      {expandedArticle === article.id ? '▼' : '▶'}
                    </span>
                  </div>
                </button>
                
                {expandedArticle === article.id && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div 
                      className="prose max-w-none mt-4"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                      style={{
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Hala yardıma mı ihtiyacınız var?</h2>
            <p className="mb-6 opacity-90">
              Destek ekibimiz size yardımcı olmak için burada
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:destek@nerede.app"
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                📧 Email Gönder
              </a>
              <a
                href="tel:+908501234567"
                className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors border border-white/30"
              >
                📞 Bizi Arayın
              </a>
            </div>
            <p className="mt-6 text-sm opacity-75">
              Destek Saatleri: Hafta içi 09:00 - 18:00
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .prose h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-top: 20px;
          margin-bottom: 12px;
        }
        .prose h4 {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .prose p {
          margin-bottom: 12px;
          color: #4b5563;
        }
        .prose ul, .prose ol {
          margin-top: 8px;
          margin-bottom: 12px;
          padding-left: 24px;
        }
        .prose li {
          margin-bottom: 6px;
          color: #4b5563;
        }
        .prose strong {
          color: #1f2937;
          font-weight: 600;
        }
      `}</style>
    </Layout>
  );
}

