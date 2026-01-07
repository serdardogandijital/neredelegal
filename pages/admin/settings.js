import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    checkInRateLimit: 30,
    commentRateLimit: 1,
    maxCheckInsPerDay: 10,
    maxCommentsPerDay: 50,
    minPointsForWithdrawal: 100,
    pointsToTLRate: 10,
    enableReferralSystem: true,
    referralBonus: 50,
    defaultCheckInPoints: 25,
    merchantCommissionRate: 10,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        await loadSettings();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Ayarlar yüklenirken hata oluştu');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        ...settings,
        updatedAt: new Date(),
      });
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Ayarlar kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Varsayılan ayarlara dönmek istediğinize emin misiniz?')) {
      return;
    }

    const defaultSettings = {
      checkInRateLimit: 30,
      commentRateLimit: 1,
      maxCheckInsPerDay: 10,
      maxCommentsPerDay: 50,
      minPointsForWithdrawal: 100,
      pointsToTLRate: 10,
      enableReferralSystem: true,
      referralBonus: 50,
      defaultCheckInPoints: 25,
      merchantCommissionRate: 10,
    };

    setSettings(defaultSettings);
    toast.success('Varsayılan ayarlara döndürüldü');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Sistem Ayarları">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h1>
          <p className="text-gray-600 mt-2">Uygulama genelindeki ayarları yönetin</p>
        </div>

        <div className="max-w-4xl">
          {/* Rate Limiting Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🛡️</span>
              Spam Önleme (Rate Limiting)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-In Aralığı (dakika)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.checkInRateLimit}
                  onChange={(e) => setSettings({ ...settings, checkInRateLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kullanıcılar arasında check-in yapmak için minimum bekleme süresi
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yorum Aralığı (dakika)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={settings.commentRateLimit}
                  onChange={(e) => setSettings({ ...settings, commentRateLimit: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kullanıcılar yorum yapmak için minimum bekleme süresi
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Günlük Maksimum Check-In
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxCheckInsPerDay}
                  onChange={(e) => setSettings({ ...settings, maxCheckInsPerDay: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bir kullanıcının günde yapabileceği maksimum check-in sayısı
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Günlük Maksimum Yorum
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={settings.maxCommentsPerDay}
                  onChange={(e) => setSettings({ ...settings, maxCommentsPerDay: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bir kullanıcının günde yapabileceği maksimum yorum sayısı
                </p>
              </div>
            </div>
          </div>

          {/* Points & Rewards Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">⭐</span>
              Puan Sistemi
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Varsayılan Check-In Puanı
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.defaultCheckInPoints}
                  onChange={(e) => setSettings({ ...settings, defaultCheckInPoints: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kampanya olmadığında kazanılan varsayılan puan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Çekim Puanı
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.minPointsForWithdrawal}
                  onChange={(e) => setSettings({ ...settings, minPointsForWithdrawal: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puan çevirmek için minimum gereken puan
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Puan → TL Çevrim Oranı
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.pointsToTLRate}
                  onChange={(e) => setSettings({ ...settings, pointsToTLRate: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.pointsToTLRate} puan = 1 TL indirim
                </p>
              </div>
            </div>
          </div>

          {/* Referral System Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Referans Sistemi
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Referans Sistemi Aktif
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Kullanıcıların arkadaş davet etmesine izin ver
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, enableReferralSystem: !settings.enableReferralSystem })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.enableReferralSystem ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableReferralSystem ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referans Bonus Puanı
                </label>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={settings.referralBonus}
                  onChange={(e) => setSettings({ ...settings, referralBonus: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!settings.enableReferralSystem}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Referans kodu ile kayıt olan kullanıcıya verilen bonus
                </p>
              </div>
            </div>
          </div>

          {/* Merchant Settings Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🏪</span>
              İşletme Ayarları
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşletme Komisyon Oranı (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.merchantCommissionRate}
                  onChange={(e) => setSettings({ ...settings, merchantCommissionRate: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  İşletmelerin bilet satışlarından alınan komisyon oranı
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Kaydediliyor...' : '💾 Ayarları Kaydet'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
            >
              🔄 Varsayılana Dön
            </button>
          </div>

          {/* Info Card */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="font-semibold text-yellow-900 mb-2">⚠️ Önemli Notlar</div>
            <div className="text-yellow-800 text-sm space-y-1">
              <p>• Ayar değişiklikleri anında tüm kullanıcıları etkiler</p>
              <p>• Rate limiting değerlerini çok düşük tutmayın, kullanıcı deneyimini etkiler</p>
              <p>• Puan oranlarını değiştirmeden önce mevcut kampanyaları kontrol edin</p>
              <p>• Değişiklikler otomatik olarak kaydedilmez, "Kaydet" butonuna basmalısınız</p>
            </div>
          </div>

          {/* Current Values Display */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-semibold text-blue-900 mb-2">📊 Geçerli Değerler</div>
            <div className="text-blue-800 text-sm grid grid-cols-2 gap-2">
              <div>• Check-In Aralığı: {settings.checkInRateLimit} dakika</div>
              <div>• Yorum Aralığı: {settings.commentRateLimit} dakika</div>
              <div>• Günlük Max Check-In: {settings.maxCheckInsPerDay}</div>
              <div>• Günlük Max Yorum: {settings.maxCommentsPerDay}</div>
              <div>• Check-In Puanı: {settings.defaultCheckInPoints}</div>
              <div>• {settings.pointsToTLRate} Puan = 1 TL</div>
              <div>• Min. Çekim: {settings.minPointsForWithdrawal} puan</div>
              <div>• Referans Bonus: {settings.referralBonus} puan</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

