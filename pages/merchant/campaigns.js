import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';
import toast from 'react-hot-toast';

export default function MerchantCampaignsPage() {
  const [user, setUser] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState(null);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount',
    venueId: '',
    discount: '',
    points: 0,
    minPoints: 0,
    maxUsage: 0,
    active: true,
    startDate: '',
    endDate: '',
    memberOnly: false,
    terms: ''
  });
  const router = useRouter();

  const campaignTypes = [
    { value: 'discount', label: 'İndirim Kampanyası' },
    { value: 'points', label: 'Puan Kampanyası' },
    { value: 'gift', label: 'Hediye Kampanyası' },
    { value: 'member_special', label: 'Üyelere Özel' }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadData(firebaseUser.uid);
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

  const loadData = async (merchantId) => {
    try {
      // Mekanları yükle
      const venuesQuery = query(collection(db, 'venues'), where('merchantId', '==', merchantId));
      const venuesSnapshot = await getDocs(venuesQuery);
      const venuesData = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVenues(venuesData);

      // Kampanyaları yükle
      const campaignsQuery = query(collection(db, 'campaigns'), where('merchantId', '==', merchantId));
      const campaignsSnapshot = await getDocs(campaignsQuery);
      const campaignsData = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    }
  };

  const handleAddCampaign = () => {
    if (venues.length === 0) {
      toast.error('Önce bir mekan eklemelisiniz');
      return;
    }
    
    setEditingCampaign(null);
    setFormData({
      name: '',
      description: '',
      type: 'discount',
      venueId: venues[0].id,
      discount: '',
      points: 0,
      minPoints: 0,
      maxUsage: 0,
      active: true,
      startDate: '',
      endDate: '',
      memberOnly: false,
      terms: ''
    });
    setShowModal(true);
  };

  const handleViewCampaignDetail = (campaign) => {
    setSelectedCampaignForDetail(campaign);
    setShowDetailModal(true);
  };

  const handleEditCampaign = (campaign) => {
    console.log('Editing campaign:', campaign);
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || '',
      type: campaign.type || 'discount',
      venueId: campaign.venueId || venues[0]?.id || '',
      discount: campaign.discount || '',
      points: campaign.points || 0,
      minPoints: campaign.minPoints || 0,
      maxUsage: campaign.maxUsage || 0,
      active: campaign.active !== undefined ? campaign.active : true,
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      memberOnly: campaign.memberOnly || false,
      terms: campaign.terms || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Submitting campaign with formData:', formData);
      const selectedVenue = venues.find(v => v.id === formData.venueId);
      console.log('Selected venue:', selectedVenue);
      
      const campaignData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        venueId: formData.venueId,
        discount: formData.discount,
        points: parseInt(formData.points) || 0,
        minPoints: parseInt(formData.minPoints) || 0,
        maxUsage: parseInt(formData.maxUsage) || 0,
        active: formData.active,
        startDate: formData.startDate,
        endDate: formData.endDate,
        memberOnly: formData.memberOnly,
        terms: formData.terms,
        merchantId: user.uid,
        merchantName: user.name || user.email,
        venueName: selectedVenue?.name || '',
        city: selectedVenue?.city || '',
        updatedAt: serverTimestamp()
      };

      console.log('Campaign data to save:', campaignData);

      if (editingCampaign) {
        console.log('Updating campaign:', editingCampaign.id);
        await updateDoc(doc(db, 'campaigns', editingCampaign.id), campaignData);
        toast.success('Kampanya güncellendi');
      } else {
        console.log('Creating new campaign');
        await addDoc(collection(db, 'campaigns'), {
          ...campaignData,
          scans: 0,
          usageCount: 0,
          createdAt: serverTimestamp()
        });
        toast.success('Kampanya oluşturuldu');
      }
      
      setShowModal(false);
      await loadData(user.uid);
    } catch (error) {
      console.error('Error saving campaign:', error);
      console.error('Error details:', error.message, error.code);
      toast.error(`Kampanya kaydedilirken hata oluştu: ${error.message}`);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Bu kampanyayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId));
      toast.success('Kampanya silindi');
      await loadData(user.uid);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Kampanya silinirken hata oluştu');
    }
  };

  const toggleCampaignStatus = async (campaign) => {
    try {
      console.log('Toggling campaign status:', campaign.id, 'current active:', campaign.active);
      const newActiveStatus = !campaign.active;
      await updateDoc(doc(db, 'campaigns', campaign.id), {
        active: newActiveStatus,
        updatedAt: serverTimestamp()
      });
      console.log('Campaign status toggled successfully to:', newActiveStatus);
      toast.success(`Kampanya ${newActiveStatus ? 'aktif' : 'pasif'} edildi`);
      await loadData(user.uid);
    } catch (error) {
      console.error('Error toggling campaign:', error);
      console.error('Error details:', error.message, error.code);
      toast.error(`Kampanya durumu değiştirilirken hata oluştu: ${error.message}`);
    }
  };

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.active).length,
    totalUsage: campaigns.reduce((sum, c) => sum + (c.usageCount || 0), 0)
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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kampanyalarım</h1>
          <p className="text-gray-600 mt-2">Kampanyalarınızı yönetin ve oluşturun</p>
        </div>
        <button
          onClick={handleAddCampaign}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg"
        >
          + Yeni Kampanya Oluştur
        </button>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Kampanya</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Aktif Kampanya</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Kullanım</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalUsage}</p>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz kampanya oluşturulmamış</h3>
          <p className="text-gray-600 mb-4">İlk kampanyanızı oluşturarak müşterilerinizi çekin</p>
          <button
            onClick={handleAddCampaign}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            İlk Kampanyayı Oluştur
          </button>
        </div>
      ) : (
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
                    <span className="font-medium text-gray-900">
                      {campaignTypes.find(t => t.value === campaign.type)?.label || campaign.type}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mekan:</span>
                    <span className="font-medium text-gray-900">{campaign.venueName}</span>
                  </div>
                  {campaign.discount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">İndirim:</span>
                      <span className="font-semibold text-green-600">{campaign.discount}</span>
                    </div>
                  )}
                  {campaign.points > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Puan:</span>
                      <span className="font-semibold text-blue-600">{campaign.points}</span>
                    </div>
                  )}
                  {campaign.memberOnly && (
                    <div className="flex items-center text-sm">
                      <span className="text-purple-600">⭐ Üyelere Özel</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kullanım:</span>
                    <span className="font-medium text-gray-900">{campaign.usageCount || 0} kez</span>
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
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCampaign ? 'Kampanya Düzenle' : 'Yeni Kampanya Oluştur'}
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
                      placeholder="Örn: Yaz İndirimi"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                      placeholder="Kampanya detaylarını yazın..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Tipi *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {campaignTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mekan *</label>
                    <select
                      value={formData.venueId}
                      onChange={(e) => setFormData({...formData, venueId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {venues.map(venue => (
                        <option key={venue.id} value={venue.id}>{venue.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Metni</label>
                    <input
                      type="text"
                      value={formData.discount}
                      onChange={(e) => setFormData({...formData, discount: e.target.value})}
                      placeholder="Örn: %20 indirim"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Puan Değeri</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Puan (Kullanım için)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minPoints}
                      onChange={(e) => setFormData({...formData, minPoints: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maksimum Kullanım (0=Sınırsız)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxUsage}
                      onChange={(e) => setFormData({...formData, maxUsage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kampanya Koşulları</label>
                    <textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({...formData, terms: e.target.value})}
                      rows="3"
                      placeholder="Kampanya kullanım koşullarını yazın..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.memberOnly}
                        onChange={(e) => setFormData({...formData, memberOnly: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Sadece Üyelere Özel</span>
                    </label>
                    
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

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {editingCampaign ? 'Güncelle' : 'Oluştur'}
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
                      <p className="font-semibold text-gray-900">
                        {campaignTypes.find(t => t.value === selectedCampaignForDetail.type)?.label || selectedCampaignForDetail.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Mekan</p>
                      <p className="font-semibold text-gray-900">{selectedCampaignForDetail.venueName}</p>
                    </div>
                    {selectedCampaignForDetail.discount && (
                      <div>
                        <p className="text-sm text-gray-600">İndirim</p>
                        <p className="font-semibold text-green-600">{selectedCampaignForDetail.discount}</p>
                      </div>
                    )}
                    {selectedCampaignForDetail.points > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Puan Değeri</p>
                        <p className="font-semibold text-blue-600">{selectedCampaignForDetail.points}</p>
                      </div>
                    )}
                    {selectedCampaignForDetail.minPoints > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Minimum Puan</p>
                        <p className="font-semibold text-purple-600">{selectedCampaignForDetail.minPoints}</p>
                      </div>
                    )}
                    {selectedCampaignForDetail.maxUsage > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Maksimum Kullanım</p>
                        <p className="font-semibold text-orange-600">{selectedCampaignForDetail.maxUsage}</p>
                      </div>
                    )}
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
                      <p className="font-semibold text-purple-600">{selectedCampaignForDetail.usageCount || 0} kez</p>
                    </div>
                    {selectedCampaignForDetail.memberOnly && (
                      <div className="col-span-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          ⭐ Üyelere Özel
                        </span>
                      </div>
                    )}
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

                {/* Kampanya Koşulları */}
                {selectedCampaignForDetail.terms && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Kampanya Koşulları</h3>
                    <p className="text-gray-700 text-sm">{selectedCampaignForDetail.terms}</p>
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
    </MerchantLayout>
  );
}

