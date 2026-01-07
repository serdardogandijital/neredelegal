import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { uploadFile, uploadMultipleFiles } from '../../lib/storage';
import MerchantLayout from '../../components/MerchantLayout';
import toast from 'react-hot-toast';
import { FEATURES } from '../../lib/features';

export default function MerchantVenuesPage() {
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVenueForDetail, setSelectedVenueForDetail] = useState(null);
  const [venueLeaderboard, setVenueLeaderboard] = useState([]);
  const [venueComments, setVenueComments] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [orderFilter, setOrderFilter] = useState('all'); // all, active, inactive

  const isOnlineOrdersEnabled = FEATURES.ENABLE_ONLINE_ORDERS;

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
    image: '',
    menuImages: [],
    menuLink: '',
    images: [],
    memberOffers: '',
    menu: [],
    menuCategories: [],
    acceptsOrders: true,
    deliveryEnabled: true,
    pickupEnabled: true,
    minOrderAmount: 0,
    deliveryFee: 0,
    deliveryRadius: 5,
    orderStartTime: '09:00',
    orderEndTime: '22:00',
    averagePreparationTime: 30,
    location: { latitude: 41.0082, longitude: 28.9784 }
  });
  const [menuItemForm, setMenuItemForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    categoryId: '',
    image: '',
    preparationTime: '',
    available: true,
    inStock: true
  });
  const [menuCategoryForm, setMenuCategoryForm] = useState({ name: '', order: 0 });
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
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadVenues(firebaseUser.uid);
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

  const loadVenues = async (merchantId) => {
    try {
      const q = query(collection(db, 'venues'), where('merchantId', '==', merchantId));
      const snapshot = await getDocs(q);
      const venuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      image: '',
      menuImages: [],
      menuLink: '',
      images: [],
      memberOffers: '',
      menu: [],
      location: { latitude: 41.0082, longitude: 28.9784 }
    });
    setMenuItemForm({ name: '', description: '', price: '' });
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
      image: venue.image || '',
      menuImages: venue.menuImages || [],
      menuLink: venue.menuLink || '',
      images: venue.images || [],
      memberOffers: venue.memberOffers || '',
      menu: venue.menu || [],
      menuCategories: venue.menuCategories || [],
      acceptsOrders: venue.acceptsOrders !== false,
      deliveryEnabled: venue.deliveryEnabled !== false,
      pickupEnabled: venue.pickupEnabled !== false,
      minOrderAmount: venue.minOrderAmount || 0,
      deliveryFee: venue.deliveryFee || 0,
      deliveryRadius: venue.deliveryRadius || 5,
      orderStartTime: venue.orderStartTime || '09:00',
      orderEndTime: venue.orderEndTime || '22:00',
      averagePreparationTime: venue.averagePreparationTime || 30,
      location: venue.location || { latitude: 41.0082, longitude: 28.9784 }
    });
    setMenuItemForm({ name: '', description: '', price: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const venueData = {
        ...formData,
        merchantId: user.uid,
        merchantName: user.name || user.email,
        updatedAt: serverTimestamp()
      };

      if (editingVenue) {
        await updateDoc(doc(db, 'venues', editingVenue.id), venueData);
        toast.success('Mekan güncellendi');
      } else {
        await addDoc(collection(db, 'venues'), {
          ...venueData,
          totalScans: 0,
          active: true,
          createdAt: serverTimestamp()
        });
        toast.success('Mekan eklendi');
      }
      
      setShowModal(false);
      await loadVenues(user.uid);
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
      await loadVenues(user.uid);
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Mekan silinirken hata oluştu');
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file, `venues/${user.uid}`);
      setFormData({ ...formData, image: url });
      toast.success('Ana görsel yüklendi');
    } catch (error) {
      toast.error(error.message || 'Görsel yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleMenuImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.menuImages?.length || 0;
    const totalCount = currentCount + files.length;

    if (totalCount > 5) {
      toast.error(`En fazla 5 menü görseli yükleyebilirsiniz (Şu an: ${currentCount}, Eklenmek istenen: ${files.length})`);
      return;
    }

    setUploading(true);
    try {
      const urls = await uploadMultipleFiles(files, `menus/${user.uid}`);
      setFormData({ 
        ...formData, 
        menuImages: [...(formData.menuImages || []), ...urls] 
      });
      toast.success(`${urls.length} menü görseli yüklendi`);
    } catch (error) {
      toast.error(error.message || 'Menü görselleri yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveMenuImage = (index) => {
    const newMenuImages = [...formData.menuImages];
    newMenuImages.splice(index, 1);
    setFormData({ ...formData, menuImages: newMenuImages });
  };

  const handleAddMenuCategory = () => {
    if (!menuCategoryForm.name) {
      toast.error('Kategori adı gereklidir');
      return;
    }
    const currentCategories = formData.menuCategories || [];
    const newCategory = {
      id: `cat_${Date.now()}`,
      name: menuCategoryForm.name,
      order: menuCategoryForm.order || currentCategories.length
    };
    setFormData({ 
      ...formData, 
      menuCategories: [...currentCategories, newCategory] 
    });
    setMenuCategoryForm({ name: '', order: 0 });
    toast.success('Kategori eklendi');
  };

  const handleRemoveMenuCategory = (categoryId) => {
    const newCategories = (formData.menuCategories || []).filter(cat => cat.id !== categoryId);
    setFormData({ ...formData, menuCategories: newCategories });
  };

  const handleAddMenuItem = () => {
    if (!menuItemForm.name || !menuItemForm.price) {
      toast.error('Ürün adı ve fiyat gereklidir');
      return;
    }
    const newItem = {
      id: `item_${Date.now()}`,
      name: menuItemForm.name,
      description: menuItemForm.description,
      price: parseFloat(menuItemForm.price),
      categoryId: menuItemForm.categoryId || '',
      image: menuItemForm.image || '',
      preparationTime: parseInt(menuItemForm.preparationTime) || 15,
      calories: parseInt(menuItemForm.calories) || null,
      allergens: menuItemForm.allergens || '',
      available: menuItemForm.available !== false,
      inStock: menuItemForm.inStock !== false,
      isOnlineOrderOnly: menuItemForm.isOnlineOrderOnly || false,
      tags: menuItemForm.tags || [],
      createdAt: new Date().toISOString()
    };
    setFormData({ ...formData, menu: [...(formData.menu || []), newItem] });
    setMenuItemForm({ 
      name: '', 
      description: '', 
      price: '', 
      categoryId: '',
      image: '',
      preparationTime: '',
      calories: '',
      allergens: '',
      available: true,
      inStock: true,
      isOnlineOrderOnly: false,
      tags: []
    });
    toast.success('Menü ürünü eklendi');
  };

  const handleRemoveMenuItem = (index) => {
    const newMenu = [...formData.menu];
    newMenu.splice(index, 1);
    setFormData({ ...formData, menu: newMenu });
  };

  const handleMultipleImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = formData.images?.length || 0;
    const totalCount = currentCount + files.length;

    if (totalCount > 10) {
      toast.error(`En fazla 10 görsel yükleyebilirsiniz (Şu an: ${currentCount}, Eklenmek istenen: ${files.length})`);
      return;
    }

    setUploading(true);
    try {
      const urls = await uploadMultipleFiles(files, `venues/${user.uid}/gallery`);
      setFormData({ 
        ...formData, 
        images: [...(formData.images || []), ...urls] 
      });
      toast.success(`${urls.length} görsel yüklendi`);
    } catch (error) {
      toast.error(error.message || 'Görseller yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleToggleOrders = async (venue) => {
    try {
      const newStatus = !venue.acceptsOrders;
      await updateDoc(doc(db, 'venues', venue.id), {
        acceptsOrders: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(newStatus ? 'Sipariş alımı açıldı' : 'Sipariş alımı kapatıldı');
      await loadVenues(user.uid);

      // Detay modalı açıksa, onu da güncelle
      if (selectedVenueForDetail && selectedVenueForDetail.id === venue.id) {
        setSelectedVenueForDetail({
          ...selectedVenueForDetail,
          acceptsOrders: newStatus
        });
      }
    } catch (error) {
      console.error('Error toggling orders:', error);
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Filtrelenmiş mekanlar
  const filteredVenues = venues.filter(venue => {
    if (orderFilter === 'active') return venue.acceptsOrders !== false;
    if (orderFilter === 'inactive') return venue.acceptsOrders === false;
    return true;
  });

  return (
    <MerchantLayout user={user}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mekanlarım</h1>
          <p className="text-gray-600 mt-2">Mekanlarınızı yönetin</p>
        </div>
        <button
          onClick={handleAddVenue}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg"
        >
          + Yeni Mekan Ekle
        </button>
      </div>

      {/* Filtre */}
      {isOnlineOrdersEnabled && venues.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrele:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orderFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü ({venues.length})
              </button>
              <button
                onClick={() => setOrderFilter('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orderFilter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🛒 Sipariş Aktif ({venues.filter(v => v.acceptsOrders !== false).length})
              </button>
              <button
                onClick={() => setOrderFilter('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  orderFilter === 'inactive'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❌ Sipariş Kapalı ({venues.filter(v => v.acceptsOrders === false).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {venues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz mekan eklenmemiş</h3>
          <p className="text-gray-600 mb-4">İlk mekanınızı ekleyerek başlayın</p>
          <button
            onClick={handleAddVenue}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            İlk Mekanı Ekle
          </button>
        </div>
      ) : filteredVenues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bu filtre için mekan bulunamadı</h3>
          <p className="text-gray-600 mb-4">Farklı bir filtre deneyin</p>
          <button
            onClick={() => setOrderFilter('all')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Tüm Mekanları Göster
          </button>
        </div>
      ) : (
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
                  {venue.discount && (
                    <div className="flex items-center">
                      <span className="text-gray-600 mr-2">🎁</span>
                      <span className="text-green-700 font-medium">{venue.discount}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">✅</span>
                    <span className="text-gray-700">{venue.totalScans || 0} check-in</span>
                  </div>

                  {/* Online Sipariş Durumu */}
                  {isOnlineOrdersEnabled && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Online Sipariş:</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleOrders(venue);
                          }}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                            venue.acceptsOrders !== false
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {venue.acceptsOrders !== false ? '✓ Aktif' : '✗ Kapalı'}
                        </button>
                      </div>
                      {venue.acceptsOrders !== false && (
                        <div className="space-y-1">
                          {venue.deliveryEnabled !== false && (
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="mr-2">🚚</span>
                              <span>Teslimat: ₺{venue.deliveryFee || 0} ({venue.deliveryRadius || 5}km)</span>
                            </div>
                          )}
                          {venue.pickupEnabled !== false && (
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="mr-2">🏪</span>
                              <span>Gel-Al Aktif</span>
                            </div>
                          )}
                          {venue.menu && venue.menu.length > 0 && (
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="mr-2">🍽️</span>
                              <span>{venue.menu.length} ürün</span>
                            </div>
                          )}
                          {venue.minOrderAmount > 0 && (
                            <div className="flex items-center text-xs text-gray-600">
                              <span className="mr-2">💰</span>
                              <span>Min: ₺{venue.minOrderAmount}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewVenueDetail(venue)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    📊 İstatistik
                  </button>
                  <button
                    onClick={() => handleEditVenue(venue)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                      ✏️ Düzenle
                  </button>
                  <button
                    onClick={() => handleDeleteVenue(venue.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                      🗑️ Sil
                    </button>
                  </div>
                  {isOnlineOrdersEnabled && (
                    <button
                      onClick={() => {
                        setEditingVenue(venue);
                        setFormData({
                          ...venue,
                          menuCategories: venue.menuCategories || [],
                          menu: venue.menu || []
                        });
                        setShowModal(true);
                        // Modal açıldığında menü bölümüne scroll yap
                        setTimeout(() => {
                          const menuSection = document.getElementById('menu-section');
                          if (menuSection) {
                            menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      🍽️ Menü & Online Sipariş Yönetimi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingVenue ? 'Mekan Düzenle' : 'Yeni Mekan Ekle'}
                  </h2>
                  {isOnlineOrdersEnabled && editingVenue && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600">Online Sipariş:</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        editingVenue.acceptsOrders !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {editingVenue.acceptsOrders !== false ? '✓ Aktif' : '✗ Kapalı'}
                      </span>
                      {editingVenue.menu && editingVenue.menu.length > 0 && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {editingVenue.menu.length} ürün
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Temel Bilgiler */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mekan Adı *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Saatleri</label>
                      <input
                        type="text"
                        value={formData.hours}
                        onChange={(e) => setFormData({...formData, hours: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Görseller */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Görseller</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ana Görsel * 
                        <span className="text-xs text-gray-500 ml-2">(Max 5MB, JPG/PNG/WebP)</span>
                      </label>
                      {formData.image && (
                        <div className="mb-2">
                          <img src={formData.image} alt="Ana görsel" className="h-32 w-auto rounded-lg" />
                        </div>
                      )}
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleMainImageUpload}
                          disabled={uploading}
                          className="hidden"
                          id="main-image-upload"
                        />
                        <div className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{uploading ? 'Yükleniyor...' : 'Ana Görsel Seç'}</span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        İşletme Fotoğrafları 
                        <span className="text-xs text-gray-500 ml-2">(Max 10 adet, her biri 5MB)</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.images?.map((img, index) => (
                          <div key={index} className="relative">
                            <img src={img} alt="" className="h-20 w-20 object-cover rounded" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={handleMultipleImagesUpload}
                          disabled={uploading || (formData.images?.length >= 10)}
                          className="hidden"
                          id="multiple-images-upload"
                        />
                        <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                          uploading || (formData.images?.length >= 10)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                        } text-white`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="font-medium">
                            {uploading ? 'Yükleniyor...' : formData.images?.length >= 10 ? 'Maksimum 10 Görsel' : 'İşletme Fotoğrafları Seç'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Menü */}
                {isOnlineOrdersEnabled && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Menü</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Menü Görselleri
                        <span className="text-xs text-gray-500 ml-2">(Max 5 adet, her biri 5MB, JPG/PNG/WebP)</span>
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.menuImages?.map((img, index) => (
                          <div key={index} className="relative">
                            <img src={img} alt={`Menü ${index + 1}`} className="h-32 w-auto rounded-lg" />
                            <button
                              type="button"
                              onClick={() => handleRemoveMenuImage(index)}
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          multiple
                          onChange={handleMenuImagesUpload}
                          disabled={uploading || (formData.menuImages?.length >= 5)}
                          className="hidden"
                          id="menu-images-upload"
                        />
                        <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${
                          uploading || (formData.menuImages?.length >= 5)
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 cursor-pointer'
                        } text-white`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="font-medium">
                            {uploading ? 'Yükleniyor...' : formData.menuImages?.length >= 5 ? 'Maksimum 5 Menü Görseli' : 'Menü Görselleri Seç'}
                          </span>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Menü Linki (Opsiyonel)</label>
                      <input
                        type="url"
                        value={formData.menuLink}
                        onChange={(e) => setFormData({...formData, menuLink: e.target.value})}
                        placeholder="https://example.com/menu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    {/* Menü Kategorileri */}
                    <div id="menu-section" className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📂 Menü Kategorileri
                      </label>
                      
                      {formData.menuCategories && formData.menuCategories.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {formData.menuCategories.map((category) => (
                            <div key={category.id} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                              <span className="text-sm font-medium text-blue-900">{category.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMenuCategory(category.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                  </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Kategori Adı (örn: Ana Yemekler)"
                          value={menuCategoryForm.name}
                          onChange={(e) => setMenuCategoryForm({...menuCategoryForm, name: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddMenuCategory}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          + Kategori Ekle
                        </button>
                      </div>
                    </div>

                    {/* Menü Ürünleri */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🍽️ Menü Ürünleri
                      </label>
                      
                      {/* Mevcut Menü Ürünleri */}
                      {formData.menu && formData.menu.length > 0 && (
                        <div className="mb-3 space-y-2">
                          {formData.menu.map((item, index) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                                )}
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-green-600 font-semibold">₺{item.price}</span>
                                  {item.preparationTime && (
                                    <span className="text-xs text-gray-500">⏱️ {item.preparationTime} dk</span>
                                  )}
                                  {item.categoryId && formData.menuCategories?.find(c => c.id === item.categoryId) && (
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                      {formData.menuCategories.find(c => c.id === item.categoryId).name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveMenuItem(index)}
                                className="ml-2 text-red-600 hover:text-red-800"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Yeni Ürün Ekleme Formu */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Ürün Adı *"
                              value={menuItemForm.name}
                              onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <textarea
                              placeholder="Açıklama (Opsiyonel)"
                              value={menuItemForm.description}
                              onChange={(e) => setMenuItemForm({...menuItemForm, description: e.target.value})}
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <select
                              value={menuItemForm.categoryId}
                              onChange={(e) => setMenuItemForm({...menuItemForm, categoryId: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Kategori Seç</option>
                              {formData.menuCategories?.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Fiyat (₺) *"
                              value={menuItemForm.price}
                              onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Hazırlık Süresi (dk)"
                              value={menuItemForm.preparationTime}
                              onChange={(e) => setMenuItemForm({...menuItemForm, preparationTime: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Kalori (kcal)"
                              value={menuItemForm.calories}
                              onChange={(e) => setMenuItemForm({...menuItemForm, calories: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              placeholder="Alerjenler (virgülle ayırın)"
                              value={menuItemForm.allergens}
                              onChange={(e) => setMenuItemForm({...menuItemForm, allergens: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="url"
                              placeholder="Ürün Görseli URL (Opsiyonel)"
                              value={menuItemForm.image}
                              onChange={(e) => setMenuItemForm({...menuItemForm, image: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={menuItemForm.isOnlineOrderOnly}
                                onChange={(e) => setMenuItemForm({...menuItemForm, isOnlineOrderOnly: e.target.checked})}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700">🌐 Sadece Online Sipariş</span>
                            </label>
                          </div>
                          <div className="col-span-2">
                            <button
                              type="button"
                              onClick={handleAddMenuItem}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                              + Ürün Ekle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sipariş Ayarları */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        🛒 Sipariş Ayarları
                      </label>
                      
                      <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-xs text-green-800">
                            💡 <strong>Varsayılan:</strong> Yeni mekanlar otomatik olarak sipariş alır. 
                            Sipariş almayı durdurmak için aşağıdaki seçeneği kapatın.
                          </p>
                        </div>
                        
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.acceptsOrders}
                            onChange={(e) => setFormData({...formData, acceptsOrders: e.target.checked})}
                            className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            ✅ Sipariş Kabul Et
                            {formData.acceptsOrders ? 
                              <span className="ml-2 text-xs text-green-600">(Aktif)</span> : 
                              <span className="ml-2 text-xs text-red-600">(Kapalı)</span>
                            }
                          </span>
                        </label>

                        {formData.acceptsOrders && (
                          <>
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={formData.deliveryEnabled}
                                onChange={(e) => setFormData({...formData, deliveryEnabled: e.target.checked})}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Teslimat Aktif</span>
                            </label>

                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={formData.pickupEnabled}
                                onChange={(e) => setFormData({...formData, pickupEnabled: e.target.checked})}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Gel-Al Aktif</span>
                            </label>

                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Min. Sipariş (₺)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.minOrderAmount}
                                  onChange={(e) => setFormData({...formData, minOrderAmount: parseFloat(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Teslimat Ücreti (₺)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.deliveryFee}
                                  onChange={(e) => setFormData({...formData, deliveryFee: parseFloat(e.target.value) || 0})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Teslimat Yarıçapı (km)</label>
                                <input
                                  type="number"
                                  value={formData.deliveryRadius}
                                  onChange={(e) => setFormData({...formData, deliveryRadius: parseInt(e.target.value) || 5})}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                            </div>

                            {/* Çalışma Saatleri */}
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <label className="block text-xs font-medium text-gray-700 mb-2">⏰ Sipariş Kabul Saatleri</label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Başlangıç</label>
                                  <input
                                    type="time"
                                    value={formData.orderStartTime || '09:00'}
                                    onChange={(e) => setFormData({...formData, orderStartTime: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Bitiş</label>
                                  <input
                                    type="time"
                                    value={formData.orderEndTime || '22:00'}
                                    onChange={(e) => setFormData({...formData, orderEndTime: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Bu saatler dışında sipariş alınmayacaktır
                              </p>
                            </div>

                            {/* Tahmini Hazırlık Süresi */}
                            <div className="mt-3">
                              <label className="block text-xs text-gray-600 mb-1">⏱️ Ortalama Hazırlık Süresi (dakika)</label>
                              <input
                                type="number"
                                value={formData.averagePreparationTime || 30}
                                onChange={(e) => setFormData({...formData, averagePreparationTime: parseInt(e.target.value) || 30})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="30"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kampanya ve Teklifler */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Kampanya ve Teklifler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Genel İndirim</label>
                      <input
                        type="text"
                        value={formData.discount}
                        onChange={(e) => setFormData({...formData, discount: e.target.value})}
                        placeholder="Örn: 20% indirim"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Puanı</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.points}
                        onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Üyelere Özel Teklifler</label>
                      <textarea
                        value={formData.memberOffers}
                        onChange={(e) => setFormData({...formData, memberOffers: e.target.value})}
                        rows="3"
                        placeholder="Üyelere özel sunduğunuz avantajları yazın..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? 'Yükleniyor...' : editingVenue ? 'Güncelle' : 'Ekle'}
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
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Online Sipariş Bilgileri */}
                  {isOnlineOrdersEnabled && (
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        🛒 Online Sipariş Bilgileri
                      </h3>
                      <button
                        onClick={() => handleToggleOrders(selectedVenueForDetail)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
                          selectedVenueForDetail.acceptsOrders !== false
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {selectedVenueForDetail.acceptsOrders !== false ? '⏸️ Sipariş Alımını Durdur' : '▶️ Sipariş Alımını Başlat'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Sipariş Durumu</div>
                        <div className={`font-semibold ${selectedVenueForDetail.acceptsOrders !== false ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedVenueForDetail.acceptsOrders !== false ? '✓ Aktif' : '✗ Kapalı'}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Menü Ürün Sayısı</div>
                        <div className="font-semibold text-gray-900">
                          {selectedVenueForDetail.menu?.length || 0} ürün
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Teslimat</div>
                        <div className="font-semibold text-gray-900">
                          {selectedVenueForDetail.deliveryEnabled !== false ? (
                            <span className="text-green-600">✓ Aktif (₺{selectedVenueForDetail.deliveryFee || 0})</span>
                          ) : (
                            <span className="text-gray-400">Kapalı</span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Gel-Al</div>
                        <div className="font-semibold text-gray-900">
                          {selectedVenueForDetail.pickupEnabled !== false ? (
                            <span className="text-green-600">✓ Aktif</span>
                          ) : (
                            <span className="text-gray-400">Kapalı</span>
                          )}
                        </div>
                      </div>
                      {selectedVenueForDetail.minOrderAmount > 0 && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1">Min. Sipariş</div>
                          <div className="font-semibold text-gray-900">₺{selectedVenueForDetail.minOrderAmount}</div>
                        </div>
                      )}
                      {selectedVenueForDetail.deliveryRadius && (
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="text-xs text-gray-600 mb-1">Teslimat Yarıçapı</div>
                          <div className="font-semibold text-gray-900">{selectedVenueForDetail.deliveryRadius} km</div>
                        </div>
                      )}
                      {selectedVenueForDetail.orderStartTime && selectedVenueForDetail.orderEndTime && (
                        <div className="bg-white rounded-lg p-3 shadow-sm col-span-2">
                          <div className="text-xs text-gray-600 mb-1">Sipariş Saatleri</div>
                          <div className="font-semibold text-gray-900">
                            {selectedVenueForDetail.orderStartTime} - {selectedVenueForDetail.orderEndTime}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedVenueForDetail.menuCategories && selectedVenueForDetail.menuCategories.length > 0 && (
                      <div className="mt-3 bg-white rounded-lg p-3 shadow-sm">
                        <div className="text-xs text-gray-600 mb-2">Menü Kategorileri</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedVenueForDetail.menuCategories.map((cat) => (
                            <span key={cat.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              {cat.name}
                            </span>
                          ))}
                        </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leaderboard Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🏆 En Sadık Müşterilerim</h3>
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
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
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
                                <span className="text-green-600 font-semibold">{user.count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">Henüz check-in yapan müşteri yok</p>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">💬 Müşteri Yorumları ({venueComments.length})</h3>
                    {venueComments.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {venueComments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold flex-shrink-0">
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
                      <p className="text-gray-500 text-center py-4">Henüz mekanınız hakkında yorum yapılmamış</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </MerchantLayout>
  );
}
