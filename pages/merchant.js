import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import MerchantLayout from '../components/MerchantLayout';

export default function MerchantDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVenues: 0,
    totalCheckIns: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    uniqueUsers: 0,
    totalRevenue: 0
  });
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadDashboardData(firebaseUser.uid);
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

  const loadDashboardData = async (merchantId) => {
    try {
      // Mekanları yükle
      const venuesQuery = query(collection(db, 'venues'), where('merchantId', '==', merchantId));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalVenues = venues.length;
      const venueIds = venues.map(v => v.id);

      // Check-in'leri yükle
      let totalCheckIns = 0;
      let uniqueUsers = new Set();
      let recentCheckInsData = [];

      if (venueIds.length > 0) {
        const checkInsQuery = query(
          collection(db, 'checkIns'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const checkInsSnapshot = await getDocs(checkInsQuery);
        const allCheckIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sadece bu işletmeye ait mekanların check-in'lerini filtrele
        const merchantCheckIns = allCheckIns.filter(c => venueIds.includes(c.venueId));
        totalCheckIns = merchantCheckIns.length;
        merchantCheckIns.forEach(c => uniqueUsers.add(c.userId));
        recentCheckInsData = merchantCheckIns.slice(0, 10);
      }

      // Kampanyaları yükle
      const campaignsQuery = query(collection(db, 'campaigns'), where('merchantId', '==', merchantId));
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaigns = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalCampaigns = campaigns.length;
      const activeCampaigns = campaigns.filter(c => c.active).length;

      setStats({
        totalVenues,
        totalCheckIns,
        totalCampaigns,
        activeCampaigns,
        uniqueUsers: uniqueUsers.size,
        totalRevenue: totalCheckIns * 5 // Örnek hesaplama
      });

      setRecentCheckIns(recentCheckInsData);

    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Bilinmiyor';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <MerchantLayout user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">İşletme Dashboard</h1>
        <p className="text-gray-600 mt-2">Hoş geldiniz, {user?.name || 'İşletme Sahibi'}</p>
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Mekanlarım</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVenues}</p>
              <p className="text-xs text-gray-500 mt-1">Toplam mekan sayısı</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Check-in'ler</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCheckIns}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.uniqueUsers} benzersiz kullanıcı</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Kampanyalar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              <p className="text-xs text-green-600 mt-1">{stats.activeCampaigns} aktif</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Check-in'ler</h2>
          <div className="space-y-4">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.map((checkIn, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">
                      {checkIn.userName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{checkIn.userName || 'Kullanıcı'}</p>
                    <p className="text-gray-500 truncate">{checkIn.venueName || 'Mekan'} • +{checkIn.points || 0} puan</p>
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{formatTimeAgo(checkIn.createdAt)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">Henüz check-in yok</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/merchant/venues')}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left flex items-center"
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Mekan Ekle
            </button>
            <button
              onClick={() => router.push('/merchant/campaigns')}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left flex items-center"
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Kampanya Oluştur
            </button>
            <button
              onClick={() => router.push('/merchant/analytics')}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left flex items-center"
            >
              <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analitik Raporları Görüntüle
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-xl font-bold mb-2">🎉 İşletme Panelinize Hoş Geldiniz!</h2>
        <p className="text-emerald-50">
          Mekanlarınızı yönetin, kampanyalar oluşturun ve müşterilerinizle etkileşime geçin.
        </p>
      </div>
    </MerchantLayout>
  );
}
