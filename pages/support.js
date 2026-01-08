import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import AdminLayout from '../components/AdminLayout';
import MerchantLayout from '../components/MerchantLayout';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    priority: 'normal',
    message: '',
    email: '',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), uid: firebaseUser.uid };
          setUser(userData);
          setFormData(prev => ({ ...prev, email: userData.email || firebaseUser.email }));
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
    { value: 'general', label: 'Genel Sorular', icon: '❓' },
    { value: 'technical', label: 'Teknik Sorun', icon: '⚙️' },
    { value: 'account', label: 'Hesap Yönetimi', icon: '👤' },
    { value: 'billing', label: 'Ödeme/Fatura', icon: '💳' },
    { value: 'feature', label: 'Özellik Talebi', icon: '✨' },
    { value: 'bug', label: 'Hata Bildirimi', icon: '🐛' },
  ];

  const priorities = [
    { value: 'low', label: 'Düşük', color: 'text-green-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'Yüksek', color: 'text-orange-600' },
    { value: 'urgent', label: 'Acil', color: 'text-red-600' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSubmitting(true);

    try {
      // Simüle edilmiş API çağrısı
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Gerçek uygulamada buraya API çağrısı gelecek
      console.log('Support ticket:', formData);
      
      toast.success('Destek talebiniz başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
      
      // Formu sıfırla
      setFormData({
        subject: '',
        category: 'general',
        priority: 'normal',
        message: '',
        email: user?.email || '',
        phone: ''
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout user={user}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 Destek Talebi</h1>
          <p className="text-gray-600">
            Sorularınız veya sorunlarınız için bizimle iletişime geçin
          </p>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Sık Karşılaşılan Sorunlar</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hesap İşlemleri</h3>
            <p className="text-sm text-gray-600 mb-3">
              Hesap oluşturma, şifre sıfırlama ve hesap silme işlemleri hakkında bilgi.
            </p>
            <Link href="/hesap-silme" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Detaylı Bilgi →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Kod ve Check-in</h3>
            <p className="text-sm text-gray-600 mb-3">
              QR kod okutma ve check-in yapma ile ilgili sorunlar ve çözümleri.
            </p>
            <Link href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Detaylı Bilgi →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
            <div className="text-3xl mb-3">🎁</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Puan ve Kampanyalar</h3>
            <p className="text-sm text-gray-600 mb-3">
              Puan kazanma, kampanyalardan faydalanma ve ödüller hakkında bilgi.
            </p>
            <Link href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Detaylı Bilgi →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gizlilik ve Güvenlik</h3>
            <p className="text-sm text-gray-600 mb-3">
              Veri güvenliği, gizlilik ayarları ve KVKK hakları hakkında bilgi.
            </p>
            <Link href="/gizlilik-politikasi" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Detaylı Bilgi →
            </Link>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Yasal Belgeler</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link 
            href="/gizlilik-politikasi"
            className="flex items-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:shadow-md transition-all border border-indigo-100"
          >
            <span className="text-2xl mr-3">🔒</span>
            <span className="font-semibold text-gray-900">Gizlilik Politikası</span>
          </Link>
          <Link 
            href="/kullanim-sartlari"
            className="flex items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-all border border-purple-100"
          >
            <span className="text-2xl mr-3">📜</span>
            <span className="font-semibold text-gray-900">Kullanım Şartları</span>
          </Link>
          <Link 
            href="/hesap-silme"
            className="flex items-center p-4 bg-gradient-to-br from-pink-50 to-indigo-50 rounded-lg hover:shadow-md transition-all border border-pink-100"
          >
            <span className="text-2xl mr-3">🗑️</span>
            <span className="font-semibold text-gray-900">Hesap Silme</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Destek Formu</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Konu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Destek talebinizin konusu"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefon (Opsiyonel)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesajınız <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={8}
                    required
                    placeholder="Lütfen sorununuzu veya talebinizi detaylı bir şekilde açıklayın..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Minimum 20 karakter
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    <span className="text-red-500">*</span> Zorunlu alanlar
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white'
                    }`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Gönderiliyor...
                      </span>
                    ) : (
                      '📤 Gönder'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📞 Hızlı İletişim</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                  <a href="mailto:destek@neredeapp.com.tr" className="text-indigo-600 hover:text-indigo-700 text-sm">
                    destek@neredeapp.com.tr
                  </a>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Telefon</p>
                  <a href="tel:+908501234567" className="text-indigo-600 hover:text-indigo-700 text-sm">
                    0850 123 45 67
                  </a>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Çalışma Saatleri</p>
                  <p className="text-sm text-gray-600">
                    Hafta içi: 09:00 - 18:00<br />
                    Hafta sonu: Kapalı
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💡 Sıkça Sorulan Sorular</h3>
              <p className="text-sm text-gray-600 mb-4">
                Sorunuzun cevabını belki de yardım merkezinde bulabilirsiniz.
              </p>
              <a
                href="/help"
                className="inline-flex items-center px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors border border-indigo-200"
              >
                📚 Yardım Merkezine Git
              </a>
            </div>

            {/* Response Time */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⏱️</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Ortalama Yanıt Süresi</h3>
                  <p className="text-sm text-gray-600">
                    Normal: <strong>2-4 saat</strong><br />
                    Acil: <strong>30 dakika</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">💡 İpucu</h3>
              <p className="text-sm text-gray-600">
                Daha hızlı çözüm için lütfen:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• Sorununuzu detaylı açıklayın</li>
                <li>• Hata mesajlarını ekleyin</li>
                <li>• Ekran görüntüsü paylaşın</li>
                <li>• Adımları sıralayın</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Issues */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🔧 Sık Karşılaşılan Sorunlar</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Giriş Yapamıyorum</h3>
              <p className="text-sm text-gray-600 mb-3">
                Şifrenizi mi unuttunuz? Giriş sayfasında "Şifremi Unuttum" linkini kullanın.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📱</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Kod Okumuyor</h3>
              <p className="text-sm text-gray-600 mb-3">
                Kamera izinlerini kontrol edin ve QR kodun net görüldüğünden emin olun.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">💳</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ödeme Sorunu</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ödeme işlemlerinde sorun yaşıyorsanız, kart bilgilerinizi kontrol edin.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Veriler Yüklenmiyor</h3>
              <p className="text-sm text-gray-600 mb-3">
                Sayfayı yenileyin veya tarayıcı önbelleğini temizleyin.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kampanya Kullanamıyorum</h3>
              <p className="text-sm text-gray-600 mb-3">
                Kampanya geçerlilik tarihlerini ve kullanım koşullarını kontrol edin.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Teknik Sorun</h3>
              <p className="text-sm text-gray-600 mb-3">
                Diğer teknik sorunlar için destek ekibimizle iletişime geçin.
              </p>
              <a href="/help" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Detaylı Bilgi →
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

