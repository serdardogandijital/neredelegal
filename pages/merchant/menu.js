import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { uploadFile } from '../../lib/storage';
import MerchantLayout from '../../components/MerchantLayout';
import toast from 'react-hot-toast';

export default function MerchantMenuPage() {
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Forms
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    order: 1,
    active: true,
  });
  
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    available: true,
    inStock: true,
    preparationTime: 15,
    calories: '',
    allergens: [],
    image: '',
    customizations: [],
  });
  
  const [orderSettings, setOrderSettings] = useState({
    acceptingOrders: true,
    minOrderAmount: 50,
    maxOrderAmount: 500,
    estimatedPreparationTime: 30,
    deliveryEnabled: true,
    pickupEnabled: true,
    deliveryFee: 15,
    freeDeliveryThreshold: 150,
    deliveryRadius: 5,
    workingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '23:00', closed: false },
    },
  });

  const router = useRouter();

  const allergenOptions = [
    'Süt', 'Yumurta', 'Fıstık', 'Soya', 'Buğday', 'Balık', 'Kabuklu Deniz Ürünleri', 
    'Fındık', 'Ceviz', 'Susam', 'Hardal', 'Kereviz', 'Kükürt Dioksit'
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
      
      if (venuesData.length > 0) {
        selectVenue(venuesData[0]);
      }
    } catch (error) {
      console.error('Error loading venues:', error);
      toast.error('Mekanlar yüklenirken hata oluştu');
    }
  };

  const selectVenue = (venue) => {
    setSelectedVenue(venue);
    setMenuItems(venue.menu || []);
    setCategories(venue.menuCategories || []);
    setOrderSettings(venue.orderSettings || orderSettings);
  };

  // Category Functions
  const handleAddCategory = () => {
    setCategoryForm({
      name: '',
      order: categories.length + 1,
      active: true,
    });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setCategoryForm(category);
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Kategori adı gerekli');
      return;
    }

    try {
      setSaving(true);
      let updatedCategories;

      if (editingCategory) {
        // Update existing category
        updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id ? { ...categoryForm, id: cat.id } : cat
        );
      } else {
        // Add new category
        const newCategory = {
          ...categoryForm,
          id: `cat_${Date.now()}`,
        };
        updatedCategories = [...categories, newCategory];
      }

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        menuCategories: updatedCategories,
        updatedAt: serverTimestamp(),
      });

      setCategories(updatedCategories);
      setShowCategoryModal(false);
      toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori eklendi');
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Kategori kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      const updatedItems = menuItems.filter(item => item.categoryId !== categoryId);

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        menuCategories: updatedCategories,
        menu: updatedItems,
        updatedAt: serverTimestamp(),
      });

      setCategories(updatedCategories);
      setMenuItems(updatedItems);
      toast.success('Kategori silindi');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Kategori silinemedi');
    }
  };

  // Menu Item Functions
  const handleAddItem = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      categoryId: categories[0]?.id || '',
      available: true,
      inStock: true,
      preparationTime: 15,
      calories: '',
      allergens: [],
      image: '',
      customizations: [],
    });
    setEditingItem(null);
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setItemForm(item);
    setEditingItem(item);
    setShowItemModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const imageUrl = await uploadFile(file, `menu/${selectedVenue.id}`);
      setItemForm({ ...itemForm, image: imageUrl });
      toast.success('Görsel yüklendi');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      toast.error('Ürün adı, fiyat ve kategori gerekli');
      return;
    }

    try {
      setSaving(true);
      let updatedItems;

      const itemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        preparationTime: parseInt(itemForm.preparationTime) || 15,
        calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      };

      if (editingItem) {
        // Update existing item
        updatedItems = menuItems.map(item =>
          item.id === editingItem.id ? { ...itemData, id: item.id } : item
        );
      } else {
        // Add new item
        const newItem = {
          ...itemData,
          id: `item_${Date.now()}`,
          orderCount: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: new Date().toISOString(),
        };
        updatedItems = [...menuItems, newItem];
      }

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        menu: updatedItems,
        updatedAt: serverTimestamp(),
      });

      setMenuItems(updatedItems);
      setShowItemModal(false);
      toast.success(editingItem ? 'Ürün güncellendi' : 'Ürün eklendi');
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Ürün kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      const updatedItems = menuItems.filter(item => item.id !== itemId);

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        menu: updatedItems,
        updatedAt: serverTimestamp(),
      });

      setMenuItems(updatedItems);
      toast.success('Ürün silindi');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Ürün silinemedi');
    }
  };

  const toggleItemAvailability = async (itemId, currentStatus) => {
    try {
      const updatedItems = menuItems.map(item =>
        item.id === itemId ? { ...item, available: !currentStatus } : item
      );

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        menu: updatedItems,
        updatedAt: serverTimestamp(),
      });

      setMenuItems(updatedItems);
      toast.success('Durum güncellendi');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  // Order Settings Functions
  const handleSaveOrderSettings = async () => {
    try {
      setSaving(true);

      await updateDoc(doc(db, 'venues', selectedVenue.id), {
        orderSettings,
        updatedAt: serverTimestamp(),
      });

      toast.success('Sipariş ayarları güncellendi');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving order settings:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const addCustomization = () => {
    setItemForm({
      ...itemForm,
      customizations: [
        ...itemForm.customizations,
        {
          id: `custom_${Date.now()}`,
          name: '',
          required: false,
          options: [{ id: `opt_${Date.now()}`, name: '', price: 0 }],
        },
      ],
    });
  };

  const updateCustomization = (customIndex, field, value) => {
    const updatedCustomizations = [...itemForm.customizations];
    updatedCustomizations[customIndex][field] = value;
    setItemForm({ ...itemForm, customizations: updatedCustomizations });
  };

  const addCustomizationOption = (customIndex) => {
    const updatedCustomizations = [...itemForm.customizations];
    updatedCustomizations[customIndex].options.push({
      id: `opt_${Date.now()}`,
      name: '',
      price: 0,
    });
    setItemForm({ ...itemForm, customizations: updatedCustomizations });
  };

  const updateCustomizationOption = (customIndex, optionIndex, field, value) => {
    const updatedCustomizations = [...itemForm.customizations];
    updatedCustomizations[customIndex].options[optionIndex][field] = value;
    setItemForm({ ...itemForm, customizations: updatedCustomizations });
  };

  const removeCustomization = (customIndex) => {
    const updatedCustomizations = itemForm.customizations.filter((_, i) => i !== customIndex);
    setItemForm({ ...itemForm, customizations: updatedCustomizations });
  };

  const removeCustomizationOption = (customIndex, optionIndex) => {
    const updatedCustomizations = [...itemForm.customizations];
    updatedCustomizations[customIndex].options = updatedCustomizations[customIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setItemForm({ ...itemForm, customizations: updatedCustomizations });
  };

  if (loading) {
    return (
      <MerchantLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </MerchantLayout>
    );
  }

  if (venues.length === 0) {
    return (
      <MerchantLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Henüz Mekanınız Yok</h2>
          <p className="text-gray-600 mb-6">Menü oluşturmak için önce bir mekan eklemelisiniz.</p>
          <button
            onClick={() => router.push('/merchant/venues')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Mekan Ekle
          </button>
        </div>
      </MerchantLayout>
    );
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Kategorisiz';
  };

  return (
    <MerchantLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menü Yönetimi</h1>
            <p className="text-gray-600 mt-1">Menünüzü oluşturun ve yönetin</p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ⚙️ Sipariş Ayarları
          </button>
        </div>

        {/* Venue Selector */}
        {venues.length > 1 && (
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mekan Seçin</label>
            <select
              value={selectedVenue?.id || ''}
              onChange={(e) => {
                const venue = venues.find(v => v.id === e.target.value);
                if (venue) selectVenue(venue);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">Toplam Ürün</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{menuItems.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-green-600">Mevcut</div>
            <div className="text-2xl font-bold text-green-900 mt-2">
              {menuItems.filter(item => item.available).length}
            </div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-red-600">Stokta Yok</div>
            <div className="text-2xl font-bold text-red-900 mt-2">
              {menuItems.filter(item => !item.inStock).length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-purple-600">Kategori</div>
            <div className="text-2xl font-bold text-purple-900 mt-2">{categories.length}</div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Kategoriler</h2>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + Kategori Ekle
              </button>
            </div>
          </div>
          <div className="p-6">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz kategori eklenmemiş. Başlamak için kategori ekleyin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {menuItems.filter(item => item.categoryId === category.id).length} ürün
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          category.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Menü Ürünleri</h2>
              <button
                onClick={handleAddItem}
                disabled={categories.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Ürün Ekle
              </button>
            </div>
          </div>
          <div className="p-6">
            {menuItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Henüz ürün eklenmemiş. {categories.length === 0 ? 'Önce kategori ekleyin.' : 'Başlamak için ürün ekleyin.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ürün</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fiyat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {menuItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {getCategoryName(item.categoryId)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ₺{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleItemAvailability(item.id, item.available)}
                            className={`px-3 py-1 text-xs rounded-full ${
                              item.available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.available ? 'Mevcut' : 'Mevcut Değil'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Sıcak İçecekler"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sıra
                  </label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="categoryActive"
                    checked={categoryForm.active}
                    onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="categoryActive" className="ml-2 text-sm text-gray-700">
                    Aktif
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingItem ? 'Ürün Düzenle' : 'Yeni Ürün'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Cappuccino"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Açıklama
                    </label>
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      placeholder="Ürün açıklaması..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fiyat (₺) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={itemForm.price}
                        onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kategori *
                      </label>
                      <select
                        value={itemForm.categoryId}
                        onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Seçin</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hazırlık Süresi (dk)
                      </label>
                      <input
                        type="number"
                        value={itemForm.preparationTime}
                        onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kalori
                      </label>
                      <input
                        type="number"
                        value={itemForm.calories}
                        onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Opsiyonel"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alerjenler
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {allergenOptions.map(allergen => (
                        <label key={allergen} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={itemForm.allergens.includes(allergen)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setItemForm({
                                  ...itemForm,
                                  allergens: [...itemForm.allergens, allergen],
                                });
                              } else {
                                setItemForm({
                                  ...itemForm,
                                  allergens: itemForm.allergens.filter(a => a !== allergen),
                                });
                              }
                            }}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{allergen}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={itemForm.available}
                        onChange={(e) => setItemForm({ ...itemForm, available: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mevcut</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={itemForm.inStock}
                        onChange={(e) => setItemForm({ ...itemForm, inStock: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Stokta</span>
                    </label>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Görseli
                    </label>
                    {itemForm.image && (
                      <img
                        src={itemForm.image}
                        alt="Ürün"
                        className="w-full h-48 object-cover rounded-lg mb-2"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {uploading && (
                      <p className="text-sm text-gray-500 mt-1">Yükleniyor...</p>
                    )}
                  </div>

                  {/* Customizations */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Özelleştirmeler
                      </label>
                      <button
                        type="button"
                        onClick={addCustomization}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        + Ekle
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {itemForm.customizations.map((custom, customIndex) => (
                        <div key={custom.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <input
                              type="text"
                              value={custom.name}
                              onChange={(e) => updateCustomization(customIndex, 'name', e.target.value)}
                              placeholder="Örn: Boyut"
                              className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomization(customIndex)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>

                          <label className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={custom.required}
                              onChange={(e) => updateCustomization(customIndex, 'required', e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="ml-2 text-xs text-gray-700">Zorunlu</span>
                          </label>

                          <div className="space-y-2">
                            {custom.options.map((option, optionIndex) => (
                              <div key={option.id} className="flex gap-2">
                                <input
                                  type="text"
                                  value={option.name}
                                  onChange={(e) => updateCustomizationOption(customIndex, optionIndex, 'name', e.target.value)}
                                  placeholder="Seçenek adı"
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={option.price}
                                  onChange={(e) => updateCustomizationOption(customIndex, optionIndex, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="₺"
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeCustomizationOption(customIndex, optionIndex)}
                                  className="text-red-600 hover:text-red-700 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addCustomizationOption(customIndex)}
                              className="text-xs text-purple-600 hover:text-purple-700"
                            >
                              + Seçenek Ekle
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={saving || uploading}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 my-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sipariş Ayarları</h2>
              
              <div className="space-y-6">
                {/* General Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Genel Ayarlar</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={orderSettings.acceptingOrders}
                          onChange={(e) => setOrderSettings({ ...orderSettings, acceptingOrders: e.target.checked })}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Sipariş Alma Aktif</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tahmini Hazırlık Süresi (dk)
                      </label>
                      <input
                        type="number"
                        value={orderSettings.estimatedPreparationTime}
                        onChange={(e) => setOrderSettings({ ...orderSettings, estimatedPreparationTime: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Sipariş Tutarı (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderSettings.minOrderAmount}
                        onChange={(e) => setOrderSettings({ ...orderSettings, minOrderAmount: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maksimum Sipariş Tutarı (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderSettings.maxOrderAmount}
                        onChange={(e) => setOrderSettings({ ...orderSettings, maxOrderAmount: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Settings */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Teslimat Ayarları</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={orderSettings.deliveryEnabled}
                          onChange={(e) => setOrderSettings({ ...orderSettings, deliveryEnabled: e.target.checked })}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Teslimat Aktif</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={orderSettings.pickupEnabled}
                          onChange={(e) => setOrderSettings({ ...orderSettings, pickupEnabled: e.target.checked })}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Gel-Al Aktif</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teslimat Ücreti (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderSettings.deliveryFee}
                        onChange={(e) => setOrderSettings({ ...orderSettings, deliveryFee: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!orderSettings.deliveryEnabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ücretsiz Teslimat Eşiği (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderSettings.freeDeliveryThreshold}
                        onChange={(e) => setOrderSettings({ ...orderSettings, freeDeliveryThreshold: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!orderSettings.deliveryEnabled}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teslimat Yarıçapı (km)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={orderSettings.deliveryRadius}
                        onChange={(e) => setOrderSettings({ ...orderSettings, deliveryRadius: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!orderSettings.deliveryEnabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Çalışma Saatleri</h3>
                  
                  <div className="space-y-3">
                    {Object.entries(orderSettings.workingHours).map(([day, hours]) => (
                      <div key={day} className="grid grid-cols-4 gap-4 items-center">
                        <div className="font-medium text-gray-700 capitalize">
                          {day === 'monday' && 'Pazartesi'}
                          {day === 'tuesday' && 'Salı'}
                          {day === 'wednesday' && 'Çarşamba'}
                          {day === 'thursday' && 'Perşembe'}
                          {day === 'friday' && 'Cuma'}
                          {day === 'saturday' && 'Cumartesi'}
                          {day === 'sunday' && 'Pazar'}
                        </div>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setOrderSettings({
                            ...orderSettings,
                            workingHours: {
                              ...orderSettings.workingHours,
                              [day]: { ...hours, open: e.target.value }
                            }
                          })}
                          disabled={hours.closed}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setOrderSettings({
                            ...orderSettings,
                            workingHours: {
                              ...orderSettings.workingHours,
                              [day]: { ...hours, close: e.target.value }
                            }
                          })}
                          disabled={hours.closed}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hours.closed}
                            onChange={(e) => setOrderSettings({
                              ...orderSettings,
                              workingHours: {
                                ...orderSettings.workingHours,
                                [day]: { ...hours, closed: e.target.checked }
                              }
                            })}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Kapalı</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveOrderSettings}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}

