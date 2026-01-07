import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function TicketsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [purchasedTickets, setPurchasedTickets] = useState([]);
  const [newTicket, setNewTicket] = useState({
    name: '',
    type: 'Konser',
    venue: '',
    date: '',
    time: '',
    price: '',
    stock: '',
    imageUrl: '',
    description: '',
    artist: '',
    city: 'İstanbul',
  });
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        await loadTickets();
        await loadPurchasedTickets();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadTickets = async () => {
    try {
      const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ticketsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Biletler yüklenirken hata oluştu');
    }
  };

  const loadPurchasedTickets = async () => {
    try {
      const q = query(collection(db, 'purchasedTickets'), orderBy('purchasedAt', 'desc'));
      const snapshot = await getDocs(q);
      const purchasedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPurchasedTickets(purchasedData);
    } catch (error) {
      console.error('Error loading purchased tickets:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.venue?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && ticket.active) ||
      (filterStatus === 'inactive' && !ticket.active);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: tickets.length,
    active: tickets.filter(t => t.active).length,
    totalSold: tickets.reduce((sum, t) => sum + (t.sold || 0), 0),
    totalStock: tickets.reduce((sum, t) => sum + (t.stock || 0), 0),
    totalRevenue: tickets.reduce((sum, t) => {
      const price = typeof t.price === 'string' ? parseFloat(t.price.replace(/[^\d.]/g, '')) : t.price;
      const serviceFee = 3;
      return sum + ((t.sold || 0) * (price + serviceFee));
    }, 0),
    serviceFeeRevenue: tickets.reduce((sum, t) => sum + ((t.sold || 0) * 3), 0),
  };

  const typeIcons = {
    'Fuar': '🏢',
    'Konser': '🎸',
    'Tiyatro': '🎭',
    'Spor': '⚽',
    'Festival': '🎪',
    'Stand Up': '🎤',
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  const handleAddTicket = async () => {
    if (!newTicket.name || !newTicket.venue || !newTicket.date || !newTicket.price || !newTicket.stock) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    try {
      const ticket = {
        ...newTicket,
        price: parseFloat(newTicket.price),
        stock: parseInt(newTicket.stock),
        sold: 0,
        active: true,
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'tickets'), ticket);
      toast.success('Etkinlik başarıyla eklendi');
      setShowAddModal(false);
      setNewTicket({
        name: '',
        type: 'Konser',
        venue: '',
        date: '',
        time: '',
        price: '',
        stock: '',
        imageUrl: '',
        description: '',
        artist: '',
        city: 'İstanbul',
      });
      await loadTickets();
    } catch (error) {
      console.error('Error adding ticket:', error);
      toast.error('Etkinlik eklenirken hata oluştu');
    }
  };

  const handleEditTicket = async () => {
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id);
      await updateDoc(ticketRef, {
        name: selectedTicket.name,
        type: selectedTicket.type,
        venue: selectedTicket.venue,
        date: selectedTicket.date,
        time: selectedTicket.time,
        price: typeof selectedTicket.price === 'string' ? parseFloat(selectedTicket.price.replace(/[^\d.]/g, '')) : selectedTicket.price,
        stock: parseInt(selectedTicket.stock),
        imageUrl: selectedTicket.imageUrl,
        description: selectedTicket.description,
        artist: selectedTicket.artist,
        city: selectedTicket.city,
        active: selectedTicket.active,
      });
      toast.success('Etkinlik güncellendi');
      setShowEditModal(false);
      setSelectedTicket(null);
      await loadTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'tickets', ticketId));
        toast.success('Etkinlik silindi');
        await loadTickets();
      } catch (error) {
        console.error('Error deleting ticket:', error);
        toast.error('Silme sırasında hata oluştu');
      }
    }
  };

  const getTicketPurchases = (ticketId) => {
    return purchasedTickets.filter(pt => pt.ticketId === ticketId);
  };

  return (
    <AdminLayout title="Biletler">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bilet Yönetimi</h1>
            <p className="text-gray-600 mt-2">Etkinlik biletlerini yönetin ve satışları takip edin</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all"
          >
            + Yeni Etkinlik
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Toplam Etkinlik</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Aktif</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.totalSold}</div>
            <div className="text-sm text-gray-600">Satılan Bilet</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-yellow-600">₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-gray-600">Toplam Gelir</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-orange-600">₺{stats.serviceFeeRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-gray-600">Hizmet Bedeli</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Etkinlik ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Etkinlik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mekan / Şehir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Satış
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => {
                const soldPercentage = (ticket.sold / ticket.stock) * 100 || 0;
                const price = typeof ticket.price === 'string' ? parseFloat(ticket.price.replace(/[^\d.]/g, '')) : ticket.price;
                
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {ticket.imageUrl ? (
                          <img 
                            src={ticket.imageUrl} 
                            alt={ticket.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center text-3xl">
                            {typeIcons[ticket.type] || '🎫'}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                          {ticket.artist && (
                            <div className="text-xs text-gray-500">{ticket.artist}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{ticket.venue}</div>
                      <div className="text-xs text-gray-500">{ticket.city || 'İstanbul'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">📅 {ticket.date}</div>
                      {ticket.time && (
                        <div className="text-xs text-gray-500">🕐 {ticket.time}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-600">₺{price?.toFixed(2) || 0}</div>
                      <div className="text-xs text-gray-500">+₺3 hizmet</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{ticket.sold || 0}/{ticket.stock}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${soldPercentage === 100 ? 'bg-red-600' : soldPercentage > 80 ? 'bg-yellow-600' : 'bg-green-600'}`}
                          style={{ width: `${soldPercentage}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ticket.active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        📊 Detay
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        ✏️ Düzenle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎫</div>
              <div className="text-gray-500">Bilet bulunamadı</div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-semibold text-blue-900 mb-2">🎫 PayTR Ödeme Sistemi</div>
          <div className="text-blue-800 text-sm">
            • Kredi kartı ile güvenli ödeme altyapısı<br/>
            • Her bilet satışına otomatik 3₺ hizmet bedeli<br/>
            • QR kod ile giriş kontrolü<br/>
            • Bilet iptal ve iade yönetimi<br/>
            • Gerçek zamanlı satış raporları<br/>
            • E-posta ile bilet gönderimi
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Yeni Etkinlik Ekle</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Adı *</label>
                  <input
                    type="text"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({...newTicket, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Duman Konseri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sanatçı/Organizatör</label>
                  <input
                    type="text"
                    value={newTicket.artist}
                    onChange={(e) => setNewTicket({...newTicket, artist: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Duman"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tür *</label>
                  <select
                    value={newTicket.type}
                    onChange={(e) => setNewTicket({...newTicket, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Konser">Konser</option>
                    <option value="Tiyatro">Tiyatro</option>
                    <option value="Spor">Spor</option>
                    <option value="Fuar">Fuar</option>
                    <option value="Festival">Festival</option>
                    <option value="Stand Up">Stand Up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şehir *</label>
                  <input
                    type="text"
                    value={newTicket.city}
                    onChange={(e) => setNewTicket({...newTicket, city: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: İstanbul"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mekan *</label>
                <input
                  type="text"
                  value={newTicket.venue}
                  onChange={(e) => setNewTicket({...newTicket, venue: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Örn: Küçükçiftlik Park"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                  <input
                    type="text"
                    value={newTicket.date}
                    onChange={(e) => setNewTicket({...newTicket, date: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15 Haziran 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Saat</label>
                  <input
                    type="text"
                    value={newTicket.time}
                    onChange={(e) => setNewTicket({...newTicket, time: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="21:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTicket.price}
                    onChange={(e) => setNewTicket({...newTicket, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="250"
                  />
                  <p className="text-xs text-gray-500 mt-1">+3₺ hizmet bedeli otomatik eklenecek</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stok Adedi *</label>
                <input
                  type="number"
                  value={newTicket.stock}
                  onChange={(e) => setNewTicket({...newTicket, stock: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görsel URL</label>
                <input
                  type="url"
                  value={newTicket.imageUrl}
                  onChange={(e) => setNewTicket({...newTicket, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                {newTicket.imageUrl && (
                  <div className="mt-2">
                    <img src={newTicket.imageUrl} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Etkinlik hakkında kısa açıklama..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleAddTicket}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Etkinliği Düzenle</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {selectedTicket.imageUrl && (
                <div className="mb-4">
                  <img src={selectedTicket.imageUrl} alt={selectedTicket.name} className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Adı</label>
                <input
                  type="text"
                  value={selectedTicket.name}
                  onChange={(e) => setSelectedTicket({...selectedTicket, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Görsel URL</label>
                <input
                  type="url"
                  value={selectedTicket.imageUrl || ''}
                  onChange={(e) => setSelectedTicket({...selectedTicket, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={typeof selectedTicket.price === 'string' ? parseFloat(selectedTicket.price.replace(/[^\d.]/g, '')) : selectedTicket.price}
                    onChange={(e) => setSelectedTicket({...selectedTicket, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stok</label>
                  <input
                    type="number"
                    value={selectedTicket.stock}
                    onChange={(e) => setSelectedTicket({...selectedTicket, stock: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={selectedTicket.active ? 'active' : 'inactive'}
                  onChange={(e) => setSelectedTicket({...selectedTicket, active: e.target.value === 'active'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => handleDeleteTicket(selectedTicket.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                onClick={handleEditTicket}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Bilet Satış Detayları</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{selectedTicket.name}</h3>
              <p className="text-gray-600">{selectedTicket.venue} • {selectedTicket.date}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{selectedTicket.sold || 0}</div>
                <div className="text-sm text-gray-600">Satılan</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{selectedTicket.stock - (selectedTicket.sold || 0)}</div>
                <div className="text-sm text-gray-600">Kalan</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  ₺{((selectedTicket.sold || 0) * ((typeof selectedTicket.price === 'string' ? parseFloat(selectedTicket.price.replace(/[^\d.]/g, '')) : selectedTicket.price) || 0)).toLocaleString('tr-TR')}
                </div>
                <div className="text-sm text-gray-600">Bilet Geliri</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">₺{((selectedTicket.sold || 0) * 3).toLocaleString('tr-TR')}</div>
                <div className="text-sm text-gray-600">Hizmet Bedeli</div>
              </div>
            </div>

            <div className="bg-white border rounded-lg">
              <div className="px-6 py-3 bg-gray-50 border-b">
                <h4 className="font-semibold">Son Satışlar</h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {getTicketPurchases(selectedTicket.id).slice(0, 10).map((purchase) => (
                  <div key={purchase.id} className="px-6 py-3 border-b hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{purchase.userName || 'Kullanıcı'}</div>
                      <div className="text-sm text-gray-500">
                        {purchase.quantity || 1} bilet • {purchase.purchasedAt?.toDate ? purchase.purchasedAt.toDate().toLocaleDateString('tr-TR') : '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">₺{purchase.totalAmount?.toFixed(2) || '0.00'}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        purchase.status === 'used' ? 'bg-gray-100 text-gray-600' :
                        purchase.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {purchase.status === 'used' ? 'Kullanıldı' :
                         purchase.status === 'cancelled' ? 'İptal' : 'Aktif'}
                      </div>
                    </div>
                  </div>
                ))}
                {getTicketPurchases(selectedTicket.id).length === 0 && (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Henüz satış yok
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
