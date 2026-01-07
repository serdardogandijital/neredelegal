import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function MerchantAnalyticsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDiscounts: 0,
    totalRevenue: 0,
    discountCount: 0,
    avgDiscount: 0,
    checkInCount: 0,
    campaignUsage: [],
    recentActivity: [],
    topUsers: [],
    recentCheckIns: [],
    topCheckInUsers: [],
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadAnalytics(firebaseUser.uid);
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

  const loadAnalytics = async (merchantId) => {
    try {
      setLoading(true);
      console.log('🔍 Loading analytics for merchantId:', merchantId);
      console.log('🔥 Firebase config check:', {
        projectId: db.app.options.projectId,
        authDomain: db.app.options.authDomain,
        hasDb: !!db,
        hasAuth: !!auth
      });

      // Get all venues for this merchant first
      console.log('🔍 Querying venues collection...');
      const venuesRef = collection(db, 'venues');
      const venuesQuery = query(venuesRef, where('merchantId', '==', merchantId));
      
      try {
        const venuesSnapshot = await getDocs(venuesQuery);
        const venueIds = venuesSnapshot.docs.map(doc => doc.id);
        const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('🏪 Found venues:', venueIds.length, venueIds);
        console.log('🏪 Venue details:', venues);
      } catch (venueError) {
        console.error('❌ Error fetching venues:', venueError);
        console.error('Error code:', venueError.code);
        console.error('Error message:', venueError.message);
        throw venueError;
      }
      
      const venuesSnapshot = await getDocs(venuesQuery);
      const venueIds = venuesSnapshot.docs.map(doc => doc.id);

      // Get discount usage (TÜM ZAMANLAR)
      console.log('🔍 Querying discount_usage collection...');
      const usageRef = collection(db, 'discount_usage');
      const usageQuery = query(
        usageRef,
        where('merchantId', '==', merchantId),
        orderBy('usedAt', 'desc'),
        limit(100)
      );
      
      let usageSnapshot;
      try {
        usageSnapshot = await getDocs(usageQuery);
        console.log('💳 Found discount usages:', usageSnapshot.size);
      } catch (usageError) {
        console.error('❌ Error fetching discount usage:', usageError);
        console.error('Error code:', usageError.code);
        console.error('Error message:', usageError.message);
        // Continue without discount data
        usageSnapshot = { docs: [], size: 0, forEach: () => {} };
      }
      const usageData = [];
      let totalDiscounts = 0;
      let totalRevenue = 0;
      const campaignMap = new Map();
      const userMap = new Map();

      usageSnapshot.forEach((doc) => {
        const data = doc.data();
        usageData.push({ id: doc.id, ...data });
        
        totalDiscounts += data.discountAmount || 0;
        totalRevenue += data.billAmount || 0;

        // Campaign usage
        const campaignKey = data.campaignName || 'Diğer';
        if (!campaignMap.has(campaignKey)) {
          campaignMap.set(campaignKey, { count: 0, total: 0 });
        }
        const campaign = campaignMap.get(campaignKey);
        campaign.count++;
        campaign.total += data.discountAmount || 0;

        // User usage
        const userKey = data.userId;
        if (!userMap.has(userKey)) {
          userMap.set(userKey, {
            userId: data.userId,
            userName: data.userName || 'Kullanıcı',
            count: 0,
            total: 0,
          });
        }
        const userStat = userMap.get(userKey);
        userStat.count++;
        userStat.total += data.discountAmount || 0;
      });

      // Get check-ins for all merchant venues (AYNI DASHBOARD GİBİ)
      let checkInCount = 0;
      let recentCheckIns = [];
      const checkInUserMap = new Map();
      
      if (venueIds.length > 0) {
        console.log('🔍 Loading check-ins EXACTLY like dashboard...');
        
        // Dashboard ile AYNI sorgu
        const checkInsQuery = query(
          collection(db, 'checkIns'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const checkInsSnapshot = await getDocs(checkInsQuery);
        const allCheckIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('📊 Total check-ins in database:', allCheckIns.length);
        
        // Sadece bu işletmeye ait mekanların check-in'lerini filtrele (Dashboard ile AYNI)
        const merchantCheckIns = allCheckIns.filter(c => venueIds.includes(c.venueId));
        console.log('✅ Filtered check-ins for this merchant:', merchantCheckIns.length);
        
        checkInCount = merchantCheckIns.length;
        recentCheckIns = merchantCheckIns;
        
        // Track user check-ins
        merchantCheckIns.forEach((checkIn) => {
          const userKey = checkIn.userId;
          if (!checkInUserMap.has(userKey)) {
            checkInUserMap.set(userKey, {
              userId: checkIn.userId,
              userName: checkIn.userName || 'Kullanıcı',
              count: 0,
              totalPoints: 0,
            });
          }
          const userStat = checkInUserMap.get(userKey);
          userStat.count++;
          userStat.totalPoints += checkIn.points || 0;
        });
        
        if (merchantCheckIns.length > 0) {
          console.log('📋 Sample check-in:', merchantCheckIns[0]);
        }
      } else {
        console.log('❌ No venues found for this merchant');
      }

      // Format campaign usage
      const campaignUsage = Array.from(campaignMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          total: data.total,
          avg: data.total / data.count,
        }))
        .sort((a, b) => b.count - a.count);

      // Format top users (discount users)
      const topUsers = Array.from(userMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Format top check-in users
      const topCheckInUsers = Array.from(checkInUserMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const finalStats = {
        totalDiscounts,
        totalRevenue,
        discountCount: usageData.length,
        avgDiscount: usageData.length > 0 ? totalDiscounts / usageData.length : 0,
        checkInCount,
        campaignUsage,
        recentActivity: usageData.slice(0, 10),
        topUsers,
        recentCheckIns: recentCheckIns.slice(0, 10),
        topCheckInUsers,
      };
      
      console.log('📊 Final stats:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('❌ Load analytics error:', error);
      toast.error('Analitik verileri yüklenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const exportToExcel = () => {
    const exportData = stats.recentActivity.map(activity => ({
      'Tarih': formatDate(activity.usedAt),
      'Müşteri': activity.userName,
      'Kampanya': activity.campaignName,
      'Hesap Tutarı': activity.billAmount,
      'İndirim': activity.discountAmount,
      'Ödenen': activity.finalAmount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analitik');
    
    const fileName = `analitik_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel dosyası indirildi');
  };

  const exportToCSV = () => {
    const exportData = stats.recentActivity.map(activity => ({
      'Tarih': formatDate(activity.usedAt),
      'Müşteri': activity.userName,
      'Kampanya': activity.campaignName,
      'Hesap Tutarı': activity.billAmount,
      'İndirim': activity.discountAmount,
      'Ödenen': activity.finalAmount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analitik_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV dosyası indirildi');
  };

  if (loading) {
    return (
      <MerchantLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout user={user}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analitik</h1>
              <p className="text-gray-600 mt-2">İşletme performans raporları</p>
            </div>

          <div className="flex flex-wrap gap-2">
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                <span>📊</span>
                Excel
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
              >
                <span>📄</span>
                CSV
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam İndirim</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalDiscounts)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💸</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Ciro</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">İndirim Sayısı</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.discountCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Check-in Sayısı</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.checkInCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaign Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kampanya Performansı</h2>
            
            {stats.campaignUsage.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Henüz kampanya kullanımı yok</p>
                <p className="text-sm mt-2">İndirim kodları kullanıldığında burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.campaignUsage.map((campaign, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{campaign.name}</span>
                      <span className="text-sm text-gray-600">{campaign.count} kullanım</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${(campaign.count / stats.discountCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(campaign.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Discount Users */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">En Çok İndirim Kullanan Müşteriler</h2>
            
            {stats.topUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Henüz indirim kullanımı yok</p>
                <p className="text-sm mt-2">İndirim kodları kullanıldığında burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.userName}</p>
                        <p className="text-sm text-gray-600">{user.count} kullanım</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(user.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Check-in Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Check-in Users */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">En Aktif Check-in Yapan Müşteriler</h2>
            
            {stats.topCheckInUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Henüz check-in yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topCheckInUsers.map((user, index) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.userName}</p>
                        <p className="text-sm text-gray-600">{user.count} check-in</p>
                      </div>
                    </div>
                    <span className="font-semibold text-purple-600">
                      {user.totalPoints} puan
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Check-ins */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Son Check-in'ler</h2>
            
            {stats.recentCheckIns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Henüz check-in yok</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">
                          {checkIn.userName?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{checkIn.userName}</p>
                        <p className="text-sm text-gray-600">{checkIn.venueName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-green-600">+{checkIn.points || 0}</span>
                      <p className="text-xs text-gray-400">{formatDate(checkIn.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Son Aktiviteler</h2>
          
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Henüz aktivite yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Tarih
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Müşteri
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Kampanya
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Hesap
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      İndirim
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                      Ödenen
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentActivity.map((activity) => (
                    <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(activity.usedAt)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {activity.userName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {activity.campaignName}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900">
                        {formatCurrency(activity.billAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-red-600 font-medium">
                        -{formatCurrency(activity.discountAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-green-600 font-semibold">
                        {formatCurrency(activity.finalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Özet</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm opacity-90">Ortalama İndirim</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(stats.avgDiscount)}</p>
            </div>
            <div>
              <p className="text-sm opacity-90">İndirim Oranı</p>
              <p className="text-2xl font-bold mt-1">
                {stats.totalRevenue > 0
                  ? ((stats.totalDiscounts / stats.totalRevenue) * 100).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-sm opacity-90">Net Ciro</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(stats.totalRevenue - stats.totalDiscounts)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}
