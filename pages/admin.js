import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import AdminLayout from '../components/AdminLayout';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVenues: 0,
    totalCheckIns: 0,
    totalCampaigns: 0,
    totalMerchants: 0,
    totalTransactions: 0,
    totalPoints: 0,
    activeUsers: 0,
    totalTickets: 0,
    totalTicketsSold: 0,
    totalPayments: 0,
    totalRevenue: 0,
    serviceFeeRevenue: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadDashboardData();
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

  const loadDashboardData = async () => {
    try {
      // Kullanıcı sayısı
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalUsers = users.length;
      const totalMerchants = users.filter(u => u.role === 'merchant').length;
      const totalPoints = users.reduce((sum, u) => sum + (u.points || 0), 0);
      
      // Aktif kullanıcılar (son 7 günde check-in yapan)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Mekan sayısı
      const venuesSnapshot = await getDocs(collection(db, 'venues'));
      const totalVenues = venuesSnapshot.size;
      
      // Check-in sayısı
      const checkInsSnapshot = await getDocs(collection(db, 'checkIns'));
      const checkIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalCheckIns = checkIns.length;
      
      // Aktif kullanıcılar
      const activeUserIds = new Set();
      checkIns.forEach(checkIn => {
        if (checkIn.createdAt) {
          const checkInDate = checkIn.createdAt.toDate ? checkIn.createdAt.toDate() : new Date(checkIn.createdAt);
          if (checkInDate >= sevenDaysAgo) {
            activeUserIds.add(checkIn.userId);
          }
        }
      });
      
      // Kampanya sayısı
      const campaignsSnapshot = await getDocs(collection(db, 'campaigns'));
      const totalCampaigns = campaignsSnapshot.size;
      
      // İşlem sayısı
      const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
      const totalTransactions = transactionsSnapshot.size;
      
      // Bilet istatistikleri
      const ticketsSnapshot = await getDocs(collection(db, 'tickets'));
      const tickets = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalTickets = tickets.length;
      const totalTicketsSold = tickets.reduce((sum, t) => sum + (t.sold || 0), 0);
      
      // Ödeme istatistikleri
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const totalPayments = payments.filter(p => p.status === 'completed').length;
      const totalRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const serviceFeeRevenue = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.serviceFee || 3), 0);
      
      setStats({
        totalUsers,
        totalVenues,
        totalCheckIns,
        totalCampaigns,
        totalMerchants,
        totalTransactions,
        totalPoints,
        activeUsers: activeUserIds.size,
        totalTickets,
        totalTicketsSold,
        totalPayments,
        totalRevenue,
        serviceFeeRevenue
      });
      
      // Son aktiviteler
      const activities = [];
      
      // Son kullanıcılar
      const recentUsers = users
        .filter(u => u.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 3);
      
      recentUsers.forEach(u => {
        activities.push({
          type: 'user',
          icon: '👤',
          color: 'blue',
          text: 'Yeni kullanıcı kaydı:',
          name: u.name || u.email,
          time: formatTimeAgo(u.createdAt)
        });
      });
      
      // Son check-in'ler
      const recentCheckIns = checkIns
        .filter(c => c.createdAt)
        .sort((a, b) => {
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 2);
      
      recentCheckIns.forEach(c => {
        activities.push({
          type: 'checkin',
          icon: '📍',
          color: 'green',
          text: 'Check-in yapıldı:',
          name: c.venueName || 'Mekan',
          time: formatTimeAgo(c.createdAt)
        });
      });
      
      // Aktiviteleri tarihe göre sırala
      activities.sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB;
      });
      
      setRecentActivities(activities.slice(0, 5));
      
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

  const parseTimeAgo = (timeStr) => {
    if (timeStr === 'Az önce') return 0;
    if (timeStr.includes('dakika')) return parseInt(timeStr);
    if (timeStr.includes('saat')) return parseInt(timeStr) * 60;
    if (timeStr.includes('gün')) return parseInt(timeStr) * 1440;
    return 999999;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Sistem genel bakış ve istatistikler</p>
      </div>
        
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">↑ {stats.activeUsers} aktif (7 gün)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Toplam Mekan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVenues.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalMerchants} işletme</p>
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
              <p className="text-sm text-gray-600 font-medium">Toplam Check-in</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCheckIns.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalTransactions} işlem</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Toplam Puan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPoints.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalCampaigns} kampanya</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-cyan-100 rounded-lg">
              <svg className="h-6 w-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Biletler</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              <p className="text-xs text-cyan-600 mt-1">{stats.totalTicketsSold} satıldı</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-emerald-100 rounded-lg">
              <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900">₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-emerald-600 mt-1">₺{stats.serviceFeeRevenue.toFixed(2)} hizmet bedeli</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className={`h-8 w-8 bg-${activity.color}-100 rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span>{activity.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-600">{activity.text}</span>
                    <span className="font-medium text-gray-900 ml-1">{activity.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs whitespace-nowrap">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Henüz aktivite yok</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İstatistikler</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Kullanıcı Başına Ortalama Puan</span>
              <span className="font-semibold text-gray-900">
                {stats.totalUsers > 0 ? Math.round(stats.totalPoints / stats.totalUsers) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Mekan Başına Check-in</span>
              <span className="font-semibold text-gray-900">
                {stats.totalVenues > 0 ? Math.round(stats.totalCheckIns / stats.totalVenues) : 0}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-600">Aktif Kullanıcı Oranı</span>
              <span className="font-semibold text-gray-900">
                {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Toplam İşletme</span>
              <span className="font-semibold text-gray-900">{stats.totalMerchants}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg shadow-md p-6 text-white">
        <h2 className="text-xl font-bold mb-2">🎉 Sistem Sağlıklı Çalışıyor</h2>
        <p className="text-indigo-100">
          Tüm servisler aktif ve kullanıma hazır. Toplam {stats.totalUsers} kullanıcı, {stats.totalVenues} mekan ve {stats.totalCheckIns} check-in kaydı bulunuyor.
        </p>
      </div>
    </AdminLayout>
  );
}
