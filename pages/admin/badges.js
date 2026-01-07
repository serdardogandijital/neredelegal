import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';

export default function BadgesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userBadges, setUserBadges] = useState([]);
  const router = useRouter();

  // Rozet tanımları (src/data/badges.js'den)
  const BADGES = [
    { id: 'first-scan', name: 'İlk Adım', description: 'İlk QR taramanı yaptın', icon: '🎯', rarity: 'common', points: 10 },
    { id: 'early-bird', name: 'Erken Kuş', description: 'İlk 100 kullanıcıdan birisin', icon: '🐦', rarity: 'rare', points: 50 },
    { id: 'foodie', name: 'Lezzet Avcısı', description: '10 farklı restoran ziyaret et', icon: '🍕', rarity: 'common', points: 100 },
    { id: 'coffee-lover', name: 'Kahve Tutkunu', description: '5 farklı kafede check-in yap', icon: '☕', rarity: 'common', points: 75 },
    { id: 'explorer', name: 'Şehir Kaşifi', description: 'Şehirdeki 25 mekanı keşfet', icon: '🗺️', rarity: 'epic', points: 200 },
    { id: 'social-butterfly', name: 'Sosyal Kelebek', description: '10 arkadaş davet et', icon: '🦋', rarity: 'rare', points: 150 },
    { id: 'level-5', name: 'Bronz Üye', description: '5. seviyeye ulaş', icon: '🥉', rarity: 'common', points: 50 },
    { id: 'level-10', name: 'Gümüş Üye', description: '10. seviyeye ulaş', icon: '🥈', rarity: 'rare', points: 100 },
    { id: 'level-20', name: 'Altın Üye', description: '20. seviyeye ulaş', icon: '🥇', rarity: 'epic', points: 200 },
    { id: 'mayor', name: 'Mayor', description: 'Bir mekanda en aktif kullanıcı ol', icon: '👑', rarity: 'epic', points: 150 },
    { id: 'weekend-warrior', name: 'Hafta Sonu Kahramanı', description: 'Arka arkaya 4 hafta sonu check-in yap', icon: '🎉', rarity: 'rare', points: 100 },
    { id: 'night-owl', name: 'Gece Kuşu', description: 'Gece 00:00 sonrası check-in yap', icon: '🦉', rarity: 'rare', points: 50 },
    { id: 'early-morning', name: 'Sabahçı', description: 'Sabah 06:00-08:00 arası check-in yap', icon: '🌅', rarity: 'rare', points: 50 },
    { id: 'streak-7', name: '7 Gün Streak', description: '7 gün üst üste check-in yap', icon: '🔥', rarity: 'rare', points: 100 },
    { id: 'streak-30', name: '30 Gün Streak', description: '30 gün üst üste check-in yap', icon: '💎', rarity: 'legendary', points: 300 },
    { id: 'culture-lover', name: 'Kültür Sever', description: '5 müze/sanat galerisi ziyaret et', icon: '🎭', rarity: 'rare', points: 100 },
    { id: 'event-goer', name: 'Etkinlik Tutkunu', description: '10 etkinliğe katıl', icon: '🎪', rarity: 'epic', points: 150 },
    { id: 'photographer', name: 'Fotoğrafçı', description: '25 check-in fotoğrafı paylaş', icon: '📸', rarity: 'rare', points: 100 },
    { id: 'reviewer', name: 'Eleştirmen', description: '20 mekan incelemesi yaz', icon: '✍️', rarity: 'epic', points: 150 },
    { id: 'city-legend', name: 'Şehir Efsanesi', description: 'Tüm mekanları keşfet', icon: '🏆', rarity: 'legendary', points: 500 }
  ];

  const RARITY_COLORS = {
    common: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
    rare: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    epic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
    legendary: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadBadgeStats();
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

  const loadBadgeStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Her rozet için kaç kullanıcının kazandığını hesapla
      const badgeStats = BADGES.map(badge => {
        const earnedCount = users.filter(u => u.earnedBadges?.includes(badge.id)).length;
        return {
          ...badge,
          earnedCount,
          percentage: users.length > 0 ? ((earnedCount / users.length) * 100).toFixed(1) : 0
        };
      });

      setUserBadges(badgeStats);
    } catch (error) {
      console.error('Error loading badge stats:', error);
    }
  };

  const getRarityLabel = (rarity) => {
    switch(rarity) {
      case 'common': return 'Yaygın';
      case 'rare': return 'Nadir';
      case 'epic': return 'Epik';
      case 'legendary': return 'Efsanevi';
      default: return rarity;
    }
  };

  const stats = {
    total: BADGES.length,
    common: BADGES.filter(b => b.rarity === 'common').length,
    rare: BADGES.filter(b => b.rarity === 'rare').length,
    epic: BADGES.filter(b => b.rarity === 'epic').length,
    legendary: BADGES.filter(b => b.rarity === 'legendary').length
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
        <h1 className="text-3xl font-bold text-gray-900">Rozet Sistemi</h1>
        <p className="text-gray-600 mt-2">Tüm rozetler ve kazanma istatistikleri</p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Rozet</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Yaygın</p>
          <p className="text-2xl font-bold text-gray-600">{stats.common}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Nadir</p>
          <p className="text-2xl font-bold text-blue-600">{stats.rare}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Epik</p>
          <p className="text-2xl font-bold text-purple-600">{stats.epic}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Efsanevi</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.legendary}</p>
        </div>
      </div>

      {/* Rozet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {userBadges.map((badge) => {
          const colors = RARITY_COLORS[badge.rarity] || RARITY_COLORS.common;
          return (
            <div 
              key={badge.id} 
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 ${colors.border}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{badge.icon}</div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${colors.bg} ${colors.text}`}>
                    {getRarityLabel(badge.rarity)}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{badge.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{badge.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Puan Değeri:</span>
                    <span className="font-semibold text-blue-600">{badge.points}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Kazanan Kullanıcı:</span>
                      <span className="font-semibold text-gray-900">{badge.earnedCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors.bg.replace('100', '500')}`}
                        style={{ width: `${Math.min(badge.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">{badge.percentage}% kullanıcı</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

