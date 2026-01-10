import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function MerchantsPage() {
  const [user, setUser] = useState(null);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [merchantVenues, setMerchantVenues] = useState([]);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    category: 'Restoran',
    city: '',
    address: '',
    phone: '',
    points: 10,
    discount: '',
    hours: '09:00 - 22:00'
  });
  const [addingVenue, setAddingVenue] = useState(false);
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
          await loadMerchants();
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

  const loadMerchants = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'merchant'));
      const snapshot = await getDocs(q);
      const merchantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMerchants(merchantsData);
    } catch (error) {
      console.error('Error loading merchants:', error);
      toast.error('İşletmeler yüklenirken hata oluştu');
    }
  };

  const handleAddVenueToMerchant = async (e) => {
    e.preventDefault();
    if (!selectedMerchant) return;

    if (!venueFormData.name.trim()) {
      toast.error('Mekan adı zorunludur');
      return;
    }
    if (!venueFormData.address.trim()) {
      toast.error('Adres zorunludur');
      return;
    }

    try {
      setAddingVenue(true);
      await addDoc(collection(db, 'venues'), {
        name: venueFormData.name.trim(),
        category: venueFormData.category,
        city: venueFormData.city || selectedMerchant.city || 'İstanbul',
        address: venueFormData.address.trim(),
        phone: venueFormData.phone?.trim() || null,
        points: parseInt(venueFormData.points, 10) || 0,
        discount: venueFormData.discount?.trim() || '',
        hours: venueFormData.hours?.trim() || '09:00 - 22:00',
        rating: 4.5,
        totalScans: 0,
        active: true,
        image: 'https://via.placeholder.com/400x300',
        merchantId: selectedMerchant.id,
        merchantName: selectedMerchant.name || selectedMerchant.email,
        merchantEmail: selectedMerchant.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Mekan eklendi');
      setVenueFormData({
        name: '',
        category: venueFormData.category,
        city: venueFormData.city,
        address: '',
        phone: venueFormData.phone,
        points: venueFormData.points,
        discount: '',
        hours: '09:00 - 22:00'
      });
      await handleViewMerchant(selectedMerchant);
    } catch (error) {
      console.error('Error adding venue:', error);
      toast.error('Mekan eklenirken hata oluştu');
    } finally {
      setAddingVenue(false);
    }
  };

  const handleDeleteMerchantVenue = async (venueId) => {
    if (!confirm('Bu mekanı silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'venues', venueId));
      toast.success('Mekan silindi');
      setMerchantVenues((prev) => prev.filter((venue) => venue.id !== venueId));
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Mekan silinirken hata oluştu');
    }
  };

  const handleViewMerchant = async (merchant) => {
    setSelectedMerchant(merchant);
    setVenueFormData({
      name: '',
      category: 'Restoran',
      city: merchant.city || 'İstanbul',
      address: '',
      phone: merchant.phone || '',
      points: 10,
      discount: '',
      hours: '09:00 - 22:00'
    });
    
    // İşletmeye ait mekanları yükle
    try {
      const venuesQuery = query(collection(db, 'venues'), where('merchantId', '==', merchant.id));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMerchantVenues(venues);
    } catch (error) {
      console.error('Error loading merchant venues:', error);
      setMerchantVenues([]);
    }
    
    setShowModal(true);
  };

  const handleUpdateMerchantStatus = async (merchantId, verified) => {
    try {
      await updateDoc(doc(db, 'users', merchantId), { 
        verified,
        verifiedAt: verified ? new Date().toISOString() : null
      });
      toast.success(`İşletme ${verified ? 'onaylandı' : 'onayı kaldırıldı'}`);
      await loadMerchants();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating merchant:', error);
      toast.error('İşletme güncellenirken hata oluştu');
    }
  };

  const stats = {
    total: merchants.length,
    verified: merchants.filter(m => m.verified).length,
    pending: merchants.filter(m => !m.verified).length
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
        <h1 className="text-3xl font-bold text-gray-900">İşletme Yönetimi</h1>
        <p className="text-gray-600 mt-2">İşletmeleri görüntüle ve yönet</p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam İşletme</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Onaylı</p>
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Bekleyen</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>
      
      {/* İşletme Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchants.map((merchant) => (
          <div key={merchant.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {merchant.name?.charAt(0)?.toUpperCase() || 'İ'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{merchant.name || 'İsimsiz'}</h3>
                  <p className="text-sm text-gray-500">{merchant.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  merchant.verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {merchant.verified ? 'Onaylı' : 'Bekliyor'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Şehir:</span>
                  <span className="font-medium text-gray-900">{merchant.city || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Kayıt Tarihi:</span>
                  <span className="font-medium text-gray-900">
                    {merchant.createdAt?.toDate ? merchant.createdAt.toDate().toLocaleDateString('tr-TR') : '-'}
                  </span>
                </div>
                {merchant.verified && merchant.verifiedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Onay Tarihi:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(merchant.verifiedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleViewMerchant(merchant)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Detayları Görüntüle
              </button>
            </div>
          </div>
        ))}
        
        {merchants.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Henüz kayıtlı işletme yok
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedMerchant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">İşletme Detayları</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* İşletme Bilgileri */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl text-blue-600 font-bold">
                      {selectedMerchant.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedMerchant.name || 'İsimsiz'}</h3>
                    <p className="text-gray-600">{selectedMerchant.email}</p>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full font-medium ${
                      selectedMerchant.verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedMerchant.verified ? 'Onaylı İşletme' : 'Onay Bekliyor'}
                    </span>
                  </div>
                </div>

                {/* Detaylı Bilgiler */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Şehir</p>
                    <p className="font-semibold text-gray-900">{selectedMerchant.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-semibold text-gray-900">{selectedMerchant.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kayıt Tarihi</p>
                    <p className="font-semibold text-gray-900">
                      {selectedMerchant.createdAt?.toDate ? selectedMerchant.createdAt.toDate().toLocaleDateString('tr-TR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Puan</p>
                    <p className="font-semibold text-gray-900">{selectedMerchant.points || 0}</p>
                  </div>
                </div>

                {/* Mekanlar */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">İşletmeye Ait Mekanlar ({merchantVenues.length})</h4>
                  {merchantVenues.length > 0 ? (
                    <div className="space-y-2">
                      {merchantVenues.map(venue => (
                        <div key={venue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{venue.name}</p>
                            <p className="text-sm text-gray-600">{venue.category} • {venue.city}</p>
                            <p className="text-xs text-gray-500">{venue.address}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{venue.totalScans || 0} check-in</span>
                            <button
                              onClick={() => handleDeleteMerchantVenue(venue.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Henüz mekan eklenmemiş</p>
                  )}
                </div>

                {/* Yeni Mekan Ekle */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">İşletmeye Yeni Mekan Ekle</h4>
                  <form onSubmit={handleAddVenueToMerchant} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı *</label>
                        <input
                          type="text"
                          value={venueFormData.name}
                          onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                        <select
                          value={venueFormData.category}
                          onChange={(e) => setVenueFormData({ ...venueFormData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Şehir *</label>
                        <select
                          value={venueFormData.city}
                          onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adres *</label>
                        <input
                          type="text"
                          value={venueFormData.address}
                          onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                        <input
                          type="text"
                          value={venueFormData.phone}
                          onChange={(e) => setVenueFormData({ ...venueFormData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Puan</label>
                        <input
                          type="number"
                          min="0"
                          value={venueFormData.points}
                          onChange={(e) => setVenueFormData({ ...venueFormData, points: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İndirim</label>
                        <input
                          type="text"
                          value={venueFormData.discount}
                          onChange={(e) => setVenueFormData({ ...venueFormData, discount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="%10 indirim"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Saatleri</label>
                        <input
                          type="text"
                          value={venueFormData.hours}
                          onChange={(e) => setVenueFormData({ ...venueFormData, hours: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={addingVenue}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-60"
                    >
                      {addingVenue ? 'Ekleniyor...' : 'Mekan Ekle'}
                    </button>
                  </form>
                </div>

                {/* Onay Butonları */}
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">İşletme Durumu</p>
                  <div className="flex gap-3">
                    {!selectedMerchant.verified ? (
                      <button
                        onClick={() => handleUpdateMerchantStatus(selectedMerchant.id, true)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        ✓ İşletmeyi Onayla
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateMerchantStatus(selectedMerchant.id, false)}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                      >
                        Onayı Kaldır
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
