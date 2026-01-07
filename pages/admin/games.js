import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function GamesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalPointsGiven: 0,
    uniquePlayers: 0,
    topPlayers: [],
    gameBreakdown: {
      spin: 0,
      quiz: 0,
      memory: 0,
      scratch: 0,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      loadGameData();
    });

    return () => unsubscribe();
  }, [router]);

  const loadGameData = async () => {
    try {
      setLoading(true);

      // Load game history
      const historyQuery = query(
        collection(db, 'gameHistory'),
        orderBy('playedAt', 'desc'),
        limit(100)
      );
      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        playedAt: doc.data().playedAt?.toDate?.() || new Date(),
      }));
      setGameHistory(history);

      // Calculate stats
      const totalPlays = history.length;
      const totalPointsGiven = history.reduce((sum, h) => sum + (h.pointsEarned || 0), 0);
      const uniquePlayers = new Set(history.map(h => h.userId)).size;

      // Game breakdown
      const gameBreakdown = {
        spin: history.filter(h => h.gameId === 'spin').length,
        quiz: history.filter(h => h.gameId === 'quiz').length,
        memory: history.filter(h => h.gameId === 'memory').length,
        scratch: history.filter(h => h.gameId === 'scratch').length,
      };

      // Top players
      const playerPoints = {};
      history.forEach(h => {
        if (!playerPoints[h.userId]) {
          playerPoints[h.userId] = {
            userId: h.userId,
            points: 0,
            plays: 0,
          };
        }
        playerPoints[h.userId].points += h.pointsEarned || 0;
        playerPoints[h.userId].plays++;
      });

      const topPlayers = Object.values(playerPoints)
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);

      // Get user names
      for (const player of topPlayers) {
        const userDoc = await getDoc(doc(db, 'users', player.userId));
        if (userDoc.exists()) {
          player.userName = userDoc.data().name || 'Bilinmeyen';
        }
      }

      setStats({
        totalPlays,
        totalPointsGiven,
        uniquePlayers,
        topPlayers,
        gameBreakdown,
      });
    } catch (error) {
      console.error('Load game data error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const gameNames = {
    spin: '🎡 Çarkıfelek',
    quiz: '🧠 Bilgi Yarışması',
    memory: '🃏 Hafıza Oyunu',
    scratch: '🎫 Kazan Kazan',
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🎮 Mini Oyunlar</h1>
            <p className="text-gray-600 mt-1">Oyun istatistikleri ve geçmiş</p>
          </div>
          <button
            onClick={loadGameData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Yenile
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Oynanma</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPlays}</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Verilen Puan</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalPointsGiven}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Benzersiz Oyuncu</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.uniquePlayers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ort. Puan/Oyun</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.totalPlays > 0 ? Math.round(stats.totalPointsGiven / stats.totalPlays) : 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Game Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Oyun Dağılımı</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.gameBreakdown).map(([gameId, count]) => (
                <div key={gameId} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl mb-2">{gameNames[gameId]?.split(' ')[0]}</div>
                  <div className="text-sm text-gray-600 mb-1">{gameNames[gameId]?.split(' ').slice(1).join(' ')}</div>
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.totalPlays > 0 ? Math.round((count / stats.totalPlays) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Players */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🏆 En Çok Puan Kazananlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oyuncu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Puan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oynanma</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ort. Puan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topPlayers.map((player, index) => (
                  <tr key={player.userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-2xl ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{player.userName}</div>
                      <div className="text-sm text-gray-500">{player.userId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">{player.points} puan</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{player.plays} kez</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{Math.round(player.points / player.plays)} puan</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Game History */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📜 Son Oyunlar</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oyun</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oyuncu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kazanılan Puan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gameHistory.slice(0, 20).map((play) => (
                  <tr key={play.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl">{gameNames[play.gameId]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{play.userId.substring(0, 12)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-green-100 text-green-800">
                        +{play.pointsEarned} puan
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(play.playedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

