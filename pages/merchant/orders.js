import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';
import toast from 'react-hot-toast';
import { FEATURES } from '../../lib/features';

export default function MerchantOrdersPage() {
  const isOrdersEnabled = FEATURES.ENABLE_ONLINE_ORDERS;
  const [user, setUser] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        if (isOrdersEnabled) {
          await loadVenues(authUser.uid);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [isOrdersEnabled, router]);

  useEffect(() => {
    if (!isOrdersEnabled || !selectedVenue) {
      return;
    }
    const unsubscribe = loadOrders();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedVenue, activeTab, isOrdersEnabled]);

  const loadVenues = async (userId) => {
    try {
      const venuesRef = collection(db, 'venues');
      const q = query(venuesRef, where('merchantId', '==', userId));
      const snapshot = await getDocs(q);
      const venuesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVenues(venuesList);
      
      if (venuesList.length > 0) {
        setSelectedVenue(venuesList[0]);
      }
    } catch (error) {
      console.error('Venues load error:', error);
      toast.error('Mekanlar yüklenemedi');
    }
  };

  const loadOrders = () => {
    if (!selectedVenue) return;

    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      let q;

      if (activeTab === 'active') {
        q = query(
          ordersRef,
          where('venueId', '==', selectedVenue.id),
          where('status', 'in', ['pending', 'confirmed', 'preparing', 'ready', 'delivering']),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(
          ordersRef,
          where('venueId', '==', selectedVenue.id),
          where('status', 'in', ['completed', 'cancelled']),
          orderBy('createdAt', 'desc')
        );
      }

      // Real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOrders(ordersList);
        setLoading(false);
      }, (error) => {
        console.error('Orders listener error:', error);
        toast.error('Siparişler yüklenemedi');
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Orders load error:', error);
      toast.error('Siparişler yüklenemedi');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Sipariş durumu güncellendi');
      setShowDetailModal(false);
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'Beklemede', color: 'yellow', icon: '⏳', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      confirmed: { label: 'Onaylandı', color: 'blue', icon: '✓', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      preparing: { label: 'Hazırlanıyor', color: 'purple', icon: '👨‍🍳', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
      ready: { label: 'Hazır', color: 'green', icon: '✓', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      delivering: { label: 'Yolda', color: 'cyan', icon: '🚗', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
      completed: { label: 'Tamamlandı', color: 'green', icon: '✓', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      cancelled: { label: 'İptal', color: 'red', icon: '✕', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'completed'
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Onayla',
      confirmed: 'Hazırlanıyor Olarak İşaretle',
      preparing: 'Hazır Olarak İşaretle',
      ready: 'Teslimat Başlat',
      delivering: 'Tamamla'
    };
    return labels[currentStatus] || 'İlerlet';
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>;
  }

  if (!isOrdersEnabled) {
    return (
      <MerchantLayout user={user}>
        <div className="max-w-2xl mx-auto bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-4">🛑</div>
          <h1 className="text-2xl font-semibold mb-2">Online siparişler devre dışı</h1>
          <p className="text-gray-600">
            Sipariş yönetimi özelliği şu anda kullanılamıyor. Özellik yeniden açıldığında bu sayfa otomatik olarak geri dönecek.
          </p>
        </div>
      </MerchantLayout>
    );
  }

  return (
    <MerchantLayout user={user}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-gray-600">Gelen siparişleri yönetin</p>
        </div>

        {/* Mekan Seçici */}
        {venues.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Mekan Seç</label>
            <select
              value={selectedVenue?.id || ''}
              onChange={(e) => {
                const venue = venues.find(v => v.id === e.target.value);
                setSelectedVenue(venue);
              }}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'active'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Aktif Siparişler ({orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Geçmiş Siparişler
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'active' ? 'Aktif sipariş yok' : 'Geçmiş sipariş yok'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'active' 
                ? 'Yeni siparişler geldiğinde burada görünecek' 
                : 'Tamamlanan siparişler burada görünecek'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowDetailModal(true);
                      }}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-gray-900">#{order.orderNumber || order.id.slice(-6)}</div>
                        <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900">{order.userName}</div>
                      <div className="text-sm text-gray-600">{order.userPhone}</div>
                    </div>

                    {/* Order Type */}
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {order.orderType === 'delivery' ? '🚗 Teslimat' : '🏃 Gel-Al'}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="mb-3 text-sm text-gray-600">
                      {order.items?.length || 0} ürün
        </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Toplam</span>
                      <span className="text-lg font-bold text-green-600">₺{order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Order Detail Modal */}
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Sipariş #{selectedOrder.orderNumber || selectedOrder.id.slice(-6)}
                    </h2>
                    <p className="text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

                {/* Status */}
              <div className="mb-6">
                  <div className={`inline-flex items-center px-4 py-2 rounded-lg ${getStatusInfo(selectedOrder.status).bgColor}`}>
                    <span className="text-2xl mr-2">{getStatusInfo(selectedOrder.status).icon}</span>
                    <span className={`font-semibold ${getStatusInfo(selectedOrder.status).textColor}`}>
                      {getStatusInfo(selectedOrder.status).label}
                </span>
                </div>
              </div>

                {/* Customer Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Müşteri Bilgileri</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="text-gray-600">Ad:</span> <span className="font-medium">{selectedOrder.userName}</span></div>
                    <div><span className="text-gray-600">Telefon:</span> <span className="font-medium">{selectedOrder.userPhone}</span></div>
              {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                      <div><span className="text-gray-600">Adres:</span> <span className="font-medium">{selectedOrder.deliveryAddress.fullAddress}</span></div>
                    )}
                  </div>
                </div>

                {/* Items */}
              <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Ürünler</h3>
                  <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                            <div className="text-sm text-gray-600">{item.description}</div>
                        )}
                          <div className="text-sm text-gray-600">x{item.quantity}</div>
                      </div>
                        <div className="font-semibold text-gray-900">₺{item.subtotal?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

                {/* Special Instructions */}
                {selectedOrder.specialInstructions && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">⚠️ Özel Talimatlar</h3>
                    <p className="text-sm text-gray-700">{selectedOrder.specialInstructions}</p>
                  </div>
                )}

              {/* Price Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Ara Toplam</span>
                    <span className="font-medium">₺{selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Teslimat</span>
                      <span className="font-medium">₺{selectedOrder.deliveryFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.serviceFee > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Servis Ücreti</span>
                      <span className="font-medium">₺{selectedOrder.serviceFee?.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>İndirim</span>
                      <span className="font-medium">-₺{selectedOrder.discount?.toFixed(2)}</span>
                    </div>
                  )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                      <span>Toplam</span>
                      <span className="text-green-600">₺{selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

                {/* Actions */}
                {!['completed', 'cancelled'].includes(selectedOrder.status) && (
                  <div className="flex gap-3">
                    {getNextStatus(selectedOrder.status) && (
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status))}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        {getNextStatusLabel(selectedOrder.status)}
                      </button>
                  )}
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
                </div>
            </div>
          </div>
        )}
      </div>
    </MerchantLayout>
  );
}
