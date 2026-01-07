import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function CheckInsPage() {
  const [user, setUser] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadCheckIns();
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

  const loadCheckIns = async () => {
    try {
      const q = query(collection(db, 'checkIns'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const checkInsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCheckIns(checkInsData);
    } catch (error) {
      console.error('Error loading check-ins:', error);
      toast.error('Check-in\'ler yüklenirken hata oluştu');
    }
  };

  const handleViewCheckIn = (checkIn) => {
    setSelectedCheckIn(checkIn);
    setShowModal(true);
  };

  const handleDeleteCheckIn = async (checkInId) => {
    if (!confirm('Bu check-in\'i silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'checkIns', checkInId));
      toast.success('Check-in silindi');
      await loadCheckIns();
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting check-in:', error);
      toast.error('Check-in silinirken hata oluştu');
    }
  };

  const exportToExcel = () => {
    const exportData = filteredCheckIns.map(c => ({
      'Tarih': c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('tr-TR') : '-',
      'Kullanıcı': c.userName || '',
      'Mekan': c.venueName || '',
      'Yorum': c.comment || '',
      'Fotoğraf': c.photoURL ? 'Evet' : 'Hayır',
      'Beğeni': c.likesCount || 0,
      'Yorum Sayısı': c.commentsCount || 0,
      'Puan': c.points || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Check-ins');
    
    const fileName = `checkins_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel dosyası indirildi');
  };

  const exportToCSV = () => {
    const exportData = filteredCheckIns.map(c => ({
      'Tarih': c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString('tr-TR') : '-',
      'Kullanıcı': c.userName || '',
      'Mekan': c.venueName || '',
      'Yorum': c.comment || '',
      'Fotoğraf': c.photoURL ? 'Evet' : 'Hayır',
      'Beğeni': c.likesCount || 0,
      'Yorum Sayısı': c.commentsCount || 0,
      'Puan': c.points || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `checkins_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV dosyası indirildi');
  };

  const filteredCheckIns = checkIns.filter(c => {
    const matchesSearch = 
      c.venueName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: checkIns.length,
    withPhoto: checkIns.filter(c => c.photoURL).length,
    withComment: checkIns.filter(c => c.comment).length,
    totalLikes: checkIns.reduce((sum, c) => sum + (c.likesCount || 0), 0),
    totalComments: checkIns.reduce((sum, c) => sum + (c.commentsCount || 0), 0)
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
        <h1 className="text-3xl font-bold text-gray-900">Check-in Yönetimi</h1>
        <p className="text-gray-600 mt-2">Tüm check-in\'leri görüntüle ve yönet</p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Yorum</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalComments}</p>
        </div>
      </div>

      {/* Arama ve Export */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mekan veya kullanıcı adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📊</span>
              Excel
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📄</span>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Check-in Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCheckIns.map((checkIn) => (
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
                <span className="text-sm font-semibold text-blue-600">+{checkIn.points || 0}</span>
              </div>

              {checkIn.comment && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">{checkIn.comment}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span>❤️ {checkIn.likesCount || 0}</span>
                <span>💬 {checkIn.commentsCount || 0}</span>
              </div>

              <div className="text-xs text-gray-400 mb-3">
                {checkIn.createdAt?.toDate 
                  ? checkIn.createdAt.toDate().toLocaleString('tr-TR')
                  : '-'}
              </div>

              <button
                onClick={() => handleViewCheckIn(checkIn)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Detayları Görüntüle
              </button>
            </div>
          </div>
        ))}
        
        {filteredCheckIns.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Check-in bulunamadı
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Check-in Detayları</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {selectedCheckIn.photoURL && (
                  <div className="rounded-lg overflow-hidden">
                    <img 
                      src={selectedCheckIn.photoURL} 
                      alt="Check-in"
                      className="w-full"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Mekan</p>
                    <p className="font-semibold text-gray-900">{selectedCheckIn.venueName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kullanıcı</p>
                    <p className="font-semibold text-gray-900">{selectedCheckIn.userName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Puan</p>
                    <p className="font-semibold text-blue-600">+{selectedCheckIn.points || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tarih</p>
                    <p className="font-semibold text-gray-900">
                      {selectedCheckIn.createdAt?.toDate 
                        ? selectedCheckIn.createdAt.toDate().toLocaleString('tr-TR')
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Beğeni</p>
                    <p className="font-semibold text-gray-900">{selectedCheckIn.likesCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Yorum</p>
                    <p className="font-semibold text-gray-900">{selectedCheckIn.commentsCount || 0}</p>
                  </div>
                </div>

                {selectedCheckIn.comment && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Yorum</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedCheckIn.comment}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <button
                    onClick={() => handleDeleteCheckIn(selectedCheckIn.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Check-in'i Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

