import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';

export default function AnalyticsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    topVenues: [],
    topUsers: [],
    recentCheckIns: [],
    cityStats: [],
    categoryStats: [],
    dailyStats: []
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadAnalytics();
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

  const loadAnalytics = async () => {
    try {
      // Mekanları yükle ve check-in sayısına göre sırala
      const venuesSnapshot = await getDocs(collection(db, 'venues'));
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const topVenues = venues
        .sort((a, b) => (b.totalScans || 0) - (a.totalScans || 0))
        .slice(0, 10);

      // Kullanıcıları yükle ve puana göre sırala
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const topUsers = users
        .filter(u => u.role !== 'admin')
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10);

      // Son check-in'leri yükle
      const checkInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const checkIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const recentCheckIns = checkIns
        .filter(c => c.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 10);

      // Şehir istatistikleri
      const cityStats = {};
      venues.forEach(venue => {
        const city = venue.city || 'Bilinmiyor';
        if (!cityStats[city]) {
          cityStats[city] = { city, venueCount: 0, checkIns: 0 };
        }
        cityStats[city].venueCount++;
        cityStats[city].checkIns += venue.totalScans || 0;
      });

      // Kategori istatistikleri
      const categoryStats = {};
      venues.forEach(venue => {
        const category = venue.category || 'Diğer';
        if (!categoryStats[category]) {
          categoryStats[category] = { category, count: 0, checkIns: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].checkIns += venue.totalScans || 0;
      });

      // Günlük istatistikler (son 7 gün)
      const dailyStats = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayCheckIns = checkIns.filter(c => {
          if (!c.createdAt) return false;
          const checkInDate = c.createdAt.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          return checkInDate >= date && checkInDate < nextDate;
        });
        
        dailyStats.push({
          date: date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          checkIns: dayCheckIns.length,
          uniqueUsers: new Set(dayCheckIns.map(c => c.userId)).size
        });
      }

      setAnalytics({
        topVenues,
        topUsers,
        recentCheckIns,
        cityStats: Object.values(cityStats).sort((a, b) => b.checkIns - a.checkIns),
        categoryStats: Object.values(categoryStats).sort((a, b) => b.checkIns - a.checkIns),
        dailyStats
      });

    } catch (error) {
      console.error('Analytics yüklenirken hata:', error);
      alert('Analitik veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analitik & Raporlar</h1>
        <p className="text-gray-600 mt-2">Detaylı istatistikler ve performans metrikleri</p>
      </div>

      {/* Günlük İstatistikler */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Son 7 Gün Check-in Trendi</h3>
        <div className="space-y-3">
          {analytics.dailyStats.map((day, index) => (
            <div key={index} className="flex items-center">
              <span className="text-sm text-gray-600 w-20">{day.date}</span>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-6 relative">
                  <div 
                    className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${Math.max((day.checkIns / Math.max(...analytics.dailyStats.map(d => d.checkIns))) * 100, 5)}%` }}
                  >
                    <span className="text-xs text-white font-medium">{day.checkIns}</span>
                  </div>
                </div>
              </div>
              <span className="text-sm text-gray-500 w-24 text-right">{day.uniqueUsers} kullanıcı</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* En Popüler Mekanlar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">En Popüler Mekanlar</h3>
          <div className="space-y-3">
            {analytics.topVenues.map((venue, index) => (
              <div key={venue.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-400 w-6">{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{venue.name}</p>
                    <p className="text-sm text-gray-500">{venue.category} • {venue.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">{venue.totalScans || 0}</p>
                  <p className="text-xs text-gray-500">check-in</p>
                </div>
              </div>
            ))}
            {analytics.topVenues.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>
        
        {/* En Aktif Kullanıcılar */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">En Aktif Kullanıcılar</h3>
          <div className="space-y-3">
            {analytics.topUsers.map((u, index) => (
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-400 w-6">{index + 1}</span>
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{u.name || 'İsimsiz'}</p>
                    <p className="text-sm text-gray-500">Level {u.level || 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{u.points || 0}</p>
                  <p className="text-xs text-gray-500">puan</p>
                </div>
              </div>
            ))}
            {analytics.topUsers.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Şehir İstatistikleri */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Şehir Bazlı İstatistikler</h3>
          <div className="space-y-3">
            {analytics.cityStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{stat.city}</p>
                  <p className="text-sm text-gray-500">{stat.venueCount} mekan</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{stat.checkIns}</p>
                  <p className="text-xs text-gray-500">check-in</p>
                </div>
              </div>
            ))}
            {analytics.cityStats.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Kategori İstatistikleri */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Kategori Bazlı İstatistikler</h3>
          <div className="space-y-3">
            {analytics.categoryStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{stat.category}</p>
                  <p className="text-sm text-gray-500">{stat.count} mekan</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{stat.checkIns}</p>
                  <p className="text-xs text-gray-500">check-in</p>
                </div>
              </div>
            ))}
            {analytics.categoryStats.length === 0 && (
              <p className="text-gray-500 text-center py-4">Henüz veri yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Son Check-in'ler */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Son Check-in'ler</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mekan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.recentCheckIns.map((checkIn, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{checkIn.userName || 'Kullanıcı'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{checkIn.venueName || 'Mekan'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">+{checkIn.points || 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {checkIn.createdAt?.toDate 
                      ? checkIn.createdAt.toDate().toLocaleString('tr-TR')
                      : new Date(checkIn.createdAt).toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {analytics.recentCheckIns.length === 0 && (
            <p className="text-gray-500 text-center py-8">Henüz check-in yok</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
