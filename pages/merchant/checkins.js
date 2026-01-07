import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';

export default function MerchantCheckInsPage() {
  const [user, setUser] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadCheckIns(firebaseUser.uid);
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

  const loadCheckIns = async (merchantId) => {
    try {
      console.log('🔍 Loading check-ins for merchantId:', merchantId);
      
      // Önce merchantId ile direkt sorgu dene
      try {
        console.log('🔍 Trying direct merchantId query...');
        const checkInsQuery = query(
          collection(db, 'checkIns'),
          where('merchantId', '==', merchantId),
          orderBy('createdAt', 'desc'),
          limit(100)
        );
        const checkInsSnapshot = await getDocs(checkInsQuery);
        const merchantCheckIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('✅ Direct query successful, found check-ins:', merchantCheckIns.length);
        
        if (merchantCheckIns.length > 0) {
          setCheckIns(merchantCheckIns);
          return;
        }
        
        console.log('⚠️ No check-ins found with direct query, trying fallback...');
      } catch (indexError) {
        console.log('⚠️ Direct merchantId query failed:', indexError.message);
        console.log('🔄 Falling back to venue-based filtering...');
      }

      // Fallback: Önce mekanları yükle
      console.log('🏪 Loading venues for merchant...');
      const venuesQuery = query(collection(db, 'venues'), where('merchantId', '==', merchantId));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venueIds = venuesSnapshot.docs.map(doc => doc.id);
      
      console.log('🏪 Found venues:', venueIds.length, venueIds);

      if (venueIds.length === 0) {
        console.log('❌ No venues found for this merchant');
        setCheckIns([]);
        return;
      }

      // Check-in'leri yükle
      console.log('🔍 Loading all check-ins...');
      const checkInsQuery = query(
        collection(db, 'checkIns'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      const allCheckIns = checkInsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('📊 Total check-ins in database:', allCheckIns.length);
      
      // Sadece bu işletmeye ait mekanların check-in'lerini filtrele
      const merchantCheckIns = allCheckIns.filter(c => venueIds.includes(c.venueId));
      console.log('✅ Filtered check-ins for this merchant:', merchantCheckIns.length);
      
      setCheckIns(merchantCheckIns);
    } catch (error) {
      console.error('❌ Error loading check-ins:', error);
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

  const stats = {
    total: checkIns.length,
    withPhoto: checkIns.filter(c => c.photoURL).length,
    withComment: checkIns.filter(c => c.comment).length,
    totalLikes: checkIns.reduce((sum, c) => sum + (c.likesCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <MerchantLayout user={user}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Check-in'ler</h1>
        <p className="text-gray-600 mt-2">Mekanlarınıza yapılan check-in'leri görüntüleyin</p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Check-in</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Fotoğraflı</p>
          <p className="text-2xl font-bold text-blue-600">{stats.withPhoto}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Yorumlu</p>
          <p className="text-2xl font-bold text-green-600">{stats.withComment}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Beğeni</p>
          <p className="text-2xl font-bold text-red-600">{stats.totalLikes}</p>
        </div>
      </div>

      {checkIns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz check-in yok</h3>
          <p className="text-gray-600">Mekanlarınıza yapılan check-in'ler burada görünecek</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checkIns.map((checkIn) => (
            <div key={checkIn.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
              {checkIn.photoURL && (
                <div className="h-48 bg-gray-200">
                  <img 
                    src={checkIn.photoURL} 
                    alt="Check-in"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{checkIn.venueName || 'Mekan'}</h3>
                    <p className="text-sm text-gray-500">{checkIn.userName || 'Kullanıcı'}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+{checkIn.points || 0}</span>
                </div>

                {checkIn.comment && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{checkIn.comment}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>❤️ {checkIn.likesCount || 0}</span>
                  <span>💬 {checkIn.commentsCount || 0}</span>
                </div>

                <div className="text-xs text-gray-400">
                  {formatTimeAgo(checkIn.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MerchantLayout>
  );
}

