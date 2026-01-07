import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount',
    city: 'İstanbul',
    discount: '',
    points: 0,
    active: true,
    startDate: '',
    endDate: '',
    venueId: '',
    merchantId: ''
  });
  const router = useRouter();

  const cities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana'];
  const campaignTypes = ['discount', 'points', 'gift', 'event'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadCampaigns();
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

  const loadCampaigns = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'campaigns'));
      const campaignsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Kampanyalar yüklenirken hata oluştu');
    }
  };

  const handleAddCampaign = () => {
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      type: 'discount',
      city: 'İstanbul',
      discount: '',
      points: 0,
      active: true,
      startDate: '',
      endDate: '',
      venueId: '',
      merchantId: ''
    });
    setShowModal(true);
  };

  const handleViewCampaignDetail = (campaign) => {
    setSelectedCampaignForDetail(campaign);
    setShowDetailModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      type: campaign.type || 'discount',
      city: campaign.city || 'İstanbul',
      discount: campaign.discount || '',
      points: campaign.points || 0,
      active: campaign.active !== undefined ? campaign.active : true,
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      venueId: campaign.venueId || '',
      merchantId: campaign.merchantId || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const campaignData = {
        ...formData,
        points: parseInt(formData.points) || 0,
        updatedAt: serverTimestamp()
      };

      if (editingCampaign) {
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), campaignData);
        toast.success('Kampanya güncellendi');
      } else {
        await addDoc(collection(db, 'campaigns'), {
          ...campaignData,
          scans: 0,
          usageCount: 0,
          createdAt: serverTimestamp()
        });
        toast.success('Kampanya eklendi');
      }
      
      setShowModal(false);
      await loadCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Kampanya kaydedilirken hata oluştu');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId));
      toast.success('Kampanya silindi');
      await loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Kampanya silinirken hata oluştu');
    }
  };

  const toggleCampaignStatus = async (campaign) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        active: !campaign.active,
        updatedAt: serverTimestamp()
      });
      toast.success(`Kampanya ${!campaign.active ? 'aktif' : 'pasif'} edildi`);
      await loadCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
      toast.error('Kampanya durumu değiştirilirken hata oluştu');
    }
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.active).length,
    inactive: campaigns.filter(c => !c.active).length,
    totalScans: campaigns.reduce((sum, c) => sum + (c.scans || 0), 0)
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kampanya Yönetimi</h1>
          <p className="text-gray-600 mt-2">Kampanyaları görüntüle, ekle ve düzenle</p>
        </div>
        <button
          onClick={handleAddCampaign}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Yeni Kampanya Ekle
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Kampanya</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Aktif</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pasif</p>
          <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Kullanım</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalScans}</p>
        </div>
      </div>
      
      {/* Kampanya Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{campaign.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      campaign.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {campaign.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{campaign.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tip:</span>
                  <span className="font-medium text-gray-900 capitalize">{campaign.type}</span>
                </div>
                {campaign.discount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">İndirim:</span>
                    <span className="font-semibold text-green-600">{campaign.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Puan:</span>
                  <span className="font-semibold text-blue-600">{campaign.points}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Şehir:</span>
                  <span className="font-medium text-gray-900">{campaign.city}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kullanım:</span>
                  <span className="font-medium text-gray-900">{campaign.scans || 0} kez</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewCampaignDetail(campaign)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  📊 Detay
                </button>
                <button
                  onClick={() => handleEditCampaign(campaign)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Düzenle
                </button>
                <button
                  onClick={() => handleDeleteCampaign(campaign.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {campaigns.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500">
            Henüz kampanya yok
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
                  {editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Ekle'}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Adı *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tip *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="discount">İndirim</option>
                      <option value="points">Puan</option>
                      <option value="gift">Hediye</option>
                      <option value="event">Etkinlik</option>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İndirim</label>
                    <input
                      type="text"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      placeholder="Örn: %20 indirim"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Kampanya Aktif</span>
                    </label>
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
                    {editingCampaign ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showDetailModal && selectedCampaignForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCampaignForDetail.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedCampaignForDetail.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEditCampaign(selectedCampaignForDetail);
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

              <div className="space-y-6">
                {/* Kampanya Bilgileri */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Kampanya Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Tip</p>
                      <p className="font-semibold text-gray-900 capitalize">{selectedCampaignForDetail.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Şehir</p>
                      <p className="font-semibold text-gray-900">{selectedCampaignForDetail.city}</p>
                    </div>
                    {selectedCampaignForDetail.discount && (
                      <div>
                        <p className="text-sm text-gray-600">İndirim</p>
                        <p className="font-semibold text-green-600">{selectedCampaignForDetail.discount}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Puan</p>
                      <p className="font-semibold text-blue-600">{selectedCampaignForDetail.points}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Durum</p>
                      <span className={`inline-flex px-3 py-1 text-xs rounded-full font-medium ${
                        selectedCampaignForDetail.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCampaignForDetail.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Kullanım Sayısı</p>
                      <p className="font-semibold text-purple-600">{selectedCampaignForDetail.scans || 0} kez</p>
                    </div>
                  </div>
                </div>

                {/* Tarih Bilgileri */}
                {(selectedCampaignForDetail.startDate || selectedCampaignForDetail.endDate) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Tarih Bilgileri</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCampaignForDetail.startDate && (
                        <div>
                          <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
                          <p className="font-semibold text-gray-900">{selectedCampaignForDetail.startDate}</p>
                        </div>
                      )}
                      {selectedCampaignForDetail.endDate && (
                        <div>
                          <p className="text-sm text-gray-600">Bitiş Tarihi</p>
                          <p className="font-semibold text-gray-900">{selectedCampaignForDetail.endDate}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* İşlemler */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => toggleCampaignStatus(selectedCampaignForDetail)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                      selectedCampaignForDetail.active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {selectedCampaignForDetail.active ? 'Pasif Et' : 'Aktif Et'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) {
                        handleDeleteCampaign(selectedCampaignForDetail.id);
                        setShowDetailModal(false);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Kampanyayı Sil
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
