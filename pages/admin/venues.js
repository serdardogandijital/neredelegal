import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function VenuesPage() {
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVenueForDetail, setSelectedVenueForDetail] = useState(null);
  const [venueLeaderboard, setVenueLeaderboard] = useState([]);
  const [venueComments, setVenueComments] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Restoran',
    city: 'İstanbul',
    address: '',
    phone: '',
    rating: 4.5,
    discount: '',
    points: 10,
    hours: '09:00 - 22:00',
    description: '',
    image: 'https://via.placeholder.com/400x300',
    location: { latitude: 41.0082, longitude: 28.9784 }
  });
  const router = useRouter();

  const categories = ['Restoran', 'Kafe', 'Bar', 'Müze', 'Park', 'Alışveriş', 'Spor', 'Eğlence', 'Diğer'];
  const cities = [
    'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 
    'Ardahan', 'Artvin', 'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 
    'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 
    'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 
    'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul', 
    'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kırıkkale', 
    'Kırklareli', 'Kırşehir', 'Kilis', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 
    'Mardin', 'Mersin', 'Muğla', 'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 
    'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak', 
    'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadVenues();
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

  const loadVenues = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'venues'));
      const venuesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          // Eksik alanları varsayılan değerlerle doldur
          active: data.active !== false,
          city: data.city || 'Bilinmiyor',
          category: data.category || 'Diğer',
          rating: data.rating || 0,
          name: data.name || 'İsimsiz Mekan'
        };
      });
      console.log(`Toplam ${venuesData.length} mekan yüklendi`);
      setVenues(venuesData);
    } catch (error) {
      console.error('Error loading venues:', error);
      toast.error('Mekanlar yüklenirken hata oluştu');
    }
  };

  const handleViewVenueDetail = async (venue) => {
    setSelectedVenueForDetail(venue);
    setShowDetailModal(true);
    setLoadingDetail(true);
    
    try {
      // Load leaderboard
      const checkInsRef = collection(db, 'checkIns');
      const q = query(checkInsRef, where('venueId', '==', venue.id));
      const querySnapshot = await getDocs(q);
      const checkIns = querySnapshot.docs.map(doc => doc.data());
      
      // Group by user and count
      const userCounts = {};
      for (const checkIn of checkIns) {
        if (!userCounts[checkIn.userId]) {
          userCounts[checkIn.userId] = {
            userId: checkIn.userId,
            userName: checkIn.userName,
            userAvatar: checkIn.userAvatar,
            count: 0,
          };
        }
        userCounts[checkIn.userId].count++;
      }
      
      const leaderboard = Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      setVenueLeaderboard(leaderboard);
      
      // Load comments
      const commentsQuery = query(
        collection(db, 'venueComments'),
        where('venueId', '==', venue.id),
        orderBy('createdAt', 'desc'),
        firestoreLimit(20)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVenueComments(comments);
    } catch (error) {
      console.error('Error loading venue detail:', error);
      toast.error('Detaylar yüklenemedi');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddVenue = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      category: 'Restoran',
      city: 'İstanbul',
      address: '',
      phone: '',
      rating: 4.5,
      discount: '',
      points: 10,
      hours: '09:00 - 22:00',
      description: '',
      image: 'https://via.placeholder.com/400x300',
      location: { latitude: 41.0082, longitude: 28.9784 }
    });
    setShowModal(true);
  };

  const handleEditVenue = (venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name || '',
      category: venue.category || 'Restoran',
      city: venue.city || 'İstanbul',
      address: venue.address || '',
      phone: venue.phone || '',
      rating: venue.rating || 4.5,
      discount: venue.discount || '',
      points: venue.points || 10,
      hours: venue.hours || '09:00 - 22:00',
      description: venue.description || '',
      image: venue.image || 'https://via.placeholder.com/400x300',
      location: venue.location || { latitude: 41.0082, longitude: 28.9784 }
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingVenue) {
        await updateDoc(doc(db, 'venues', editingVenue.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Mekan güncellendi');
      } else {
        await addDoc(collection(db, 'venues'), {
          ...formData,
          totalScans: 0,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Mekan eklendi');
      }
      
      setShowModal(false);
      await loadVenues();
    } catch (error) {
      console.error('Error saving venue:', error);
      toast.error('Mekan kaydedilirken hata oluştu');
    }
  };

  const handleDeleteVenue = async (venueId) => {
    if (!confirm('Bu mekanı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'venues', venueId));
      toast.success('Mekan silindi');
      await loadVenues();
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Mekan silinirken hata oluştu');
    }
  };

  const filteredVenues = venues.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // DEBUG: Filtrelenen mekanları göster
  console.log('Toplam mekan:', venues.length);
  console.log('Filtrelenmiş mekan:', filteredVenues.length);
  console.log('Search Term:', searchTerm);
  console.log('Filter Category:', filterCategory);

  // Filtrelemeye uymayan mekanları göster
  const notShown = venues.filter(v => {
    const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
    return !(matchesSearch && matchesCategory);
  });

  if (notShown.length > 0) {
    console.log('Filtrelemeye uymayan mekanlar:', notShown.map(v => ({
      id: v.id,
      name: v.name,
      category: v.category,
      address: v.address,
      hasName: !!v.name,
      hasAddress: !!v.address
    })));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout user={user}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mekan Yönetimi</h1>
          <p className="text-gray-600 mt-2">Mekanları görüntüle, ekle ve düzenle</p>
        </div>
        <button
          onClick={handleAddVenue}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Yeni Mekan Ekle
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mekan adı veya adres ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Kategoriler</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Mekan Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVenues.map((venue) => (
          <div key={venue.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              <img 
                src={venue.image || 'https://via.placeholder.com/400x300'} 
                alt={venue.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300'; }}
              />
              <span className="absolute top-2 right-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                Aktif
              </span>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{venue.name}</h3>
                  <p className="text-sm text-gray-500">{venue.category}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-medium">{venue.rating}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-start">
                  <span className="text-gray-600 mr-2">📍</span>
                  <span className="text-gray-700">{venue.address}</span>
                </div>
                {venue.phone && (
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">📞</span>
                    <span className="text-gray-700">{venue.phone}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">🎁</span>
                  <span className="text-gray-700">{venue.discount || 'İndirim yok'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">⭐</span>
                  <span className="text-gray-700">{venue.points} puan</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewVenueDetail(venue)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  📊 Detay
                </button>
                <button
                  onClick={() => handleEditVenue(venue)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDeleteVenue(venue.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredVenues.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Mekan bulunamadı
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingVenue ? 'Mekan Düzenle' : 'Yeni Mekan Ekle'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Saatleri</label>
                    <input
                      type="text"
                      value={formData.hours}
                      onChange={(e) => setFormData({...formData, hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">İndirim</label>
                    <input
                      type="text"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      placeholder="Örn: %20 indirim"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingVenue ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Venue Detail Modal */}
      {showDetailModal && selectedVenueForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedVenueForDetail.name}</h2>
                  <p className="text-gray-600">{selectedVenueForDetail.category} • {selectedVenueForDetail.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditVenue(selectedVenueForDetail);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {loadingDetail ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Leaderboard Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 En Sadık Müşteriler</h3>
                    {venueLeaderboard.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        {/* Top 3 */}
                        {venueLeaderboard.slice(0, 3).map((user, index) => {
                          const badges = ['🥇', '🥈', '🥉'];
                          const colors = ['bg-yellow-100 border-yellow-300', 'bg-gray-100 border-gray-300', 'bg-orange-100 border-orange-300'];
                          return (
                            <div key={user.userId} className={`flex items-center justify-between p-3 mb-2 border-2 rounded-lg ${colors[index]}`}>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{badges[index]}</span>
                                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                  {user.userName?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900">{user.userName}</div>
                                  <div className="text-sm text-gray-600">{user.count} check-in</div>
                                </div>
                              </div>
                              {user.count >= 50 && <span className="px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">🏆 Efsane</span>}
                              {user.count >= 25 && user.count < 50 && <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">💎 VIP</span>}
                              {user.count >= 10 && user.count < 25 && <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">⭐ Sadık</span>}
                            </div>
                          );
                        })}
                        
                        {/* Rest */}
                        {venueLeaderboard.length > 3 && (
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Diğer Müşteriler</h4>
                            {venueLeaderboard.slice(3).map((user, index) => (
                              <div key={user.userId} className="flex items-center justify-between py-2 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500 font-semibold w-6">{index + 4}</span>
                                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm">
                                    {user.userName?.charAt(0) || '?'}
                                  </div>
                                  <span className="text-gray-800">{user.userName}</span>
                                </div>
                                <span className="text-blue-600 font-semibold">{user.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Henüz check-in yapan kullanıcı yok</p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💬 Yorumlar ({venueComments.length})</h3>
                    {venueComments.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {venueComments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {comment.userName?.charAt(0) || '?'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-gray-900">{comment.userName}</span>
                                  <span className="text-xs text-gray-500">
                                    {comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                                  </span>
                                </div>
                                <p className="text-gray-700">{comment.text}</p>
                                {comment.likes > 0 && (
                                  <div className="mt-2 text-sm text-gray-500">❤️ {comment.likes}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Henüz yorum yapılmamış</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
