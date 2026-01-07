import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { collection, getDocs, query, orderBy, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function PaymentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        await loadPayments();
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadPayments = async () => {
    try {
      const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const paymentsData = await Promise.all(
        snapshot.docs.map(async (paymentDoc) => {
          const payment = { id: paymentDoc.id, ...paymentDoc.data() };
          
          // Kullanıcı bilgisini al
          if (payment.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', payment.userId));
              if (userDoc.exists()) {
                payment.userName = userDoc.data().name;
                payment.userEmail = userDoc.data().email;
              }
            } catch (error) {
              console.error('Error loading user:', error);
            }
          }

          // Bilet bilgisini al
          if (payment.ticketId) {
            try {
              const ticketDoc = await getDoc(doc(db, 'tickets', payment.ticketId));
              if (ticketDoc.exists()) {
                payment.ticketName = ticketDoc.data().name;
              }
            } catch (error) {
              console.error('Error loading ticket:', error);
            }
          }

          return payment;
        })
      );
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast.error('Ödemeler yüklenirken hata oluştu');
    }
  };

  const getDateFilter = () => {
    const now = new Date();
    switch (filterDate) {
      case 'today':
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        return startOfDay;
      case 'week':
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        return startOfWeek;
      case 'month':
        const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));
        return startOfMonth;
      default:
        return null;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.ticketName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    const dateFilter = getDateFilter();
    const matchesDate = !dateFilter || (payment.createdAt?.toDate && payment.createdAt.toDate() >= dateFilter);
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0),
    serviceFeeRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.serviceFee || 3), 0),
    ticketRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + ((p.amount || 0) - (p.serviceFee || 3)), 0),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Başarılı';
      case 'pending':
        return 'Bekliyor';
      case 'failed':
        return 'Başarısız';
      case 'refunded':
        return 'İade';
      default:
        return status;
    }
  };

  const exportToExcel = () => {
    const exportData = filteredPayments.map(p => ({
      'Tarih': p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('tr-TR') : '-',
      'İşlem ID': p.transactionId || p.id,
      'Kullanıcı': p.userName || '-',
      'E-posta': p.userEmail || '-',
      'Etkinlik': p.ticketName || '-',
      'Adet': p.quantity || 1,
      'Bilet Tutarı': (p.amount || 0) - (p.serviceFee || 3),
      'Hizmet Bedeli': p.serviceFee || 3,
      'Toplam': p.amount || 0,
      'Durum': getStatusLabel(p.status),
      'Kart': p.cardInfo || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ödemeler');
    
    const fileName = `odemeler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel dosyası indirildi');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout title="Ödemeler">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Ödeme Yönetimi</h1>
          <p className="text-gray-600 mt-2">PayTR ile yapılan tüm ödemeleri görüntüleyin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Toplam İşlem</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Başarılı</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Bekleyen</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">Başarısız</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">₺{stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-gray-600">Toplam Gelir</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-orange-600">₺{stats.serviceFeeRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <div className="text-sm text-gray-600">Hizmet Bedeli</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Kullanıcı, etkinlik veya işlem ID ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="completed">Başarılı</option>
                <option value="pending">Bekleyen</option>
                <option value="failed">Başarısız</option>
                <option value="refunded">İade</option>
              </select>
            </div>
            <div>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📊</span>
              Excel İndir
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Etkinlik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kart</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.createdAt?.toDate 
                        ? payment.createdAt.toDate().toLocaleString('tr-TR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {payment.transactionId?.substring(0, 12) || payment.id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.userName || 'Kullanıcı'}</div>
                      <div className="text-xs text-gray-500">{payment.userEmail || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{payment.ticketName || 'Bilet'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.quantity || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">₺{(payment.amount || 0).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        ₺{((payment.amount || 0) - (payment.serviceFee || 3)).toFixed(2)} bilet + ₺{(payment.serviceFee || 3).toFixed(2)} hizmet
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.cardInfo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Ödeme bulunamadı
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-900 mb-2">💳 PayTR Entegrasyonu</div>
          <div className="text-green-800 text-sm">
            • Güvenli kredi kartı ödemeleri<br/>
            • Otomatik 3₺ hizmet bedeli ekleme<br/>
            • Gerçek zamanlı ödeme bildirimleri<br/>
            • İade ve iptal yönetimi<br/>
            • Detaylı ödeme raporları<br/>
            • PCI DSS uyumlu altyapı
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

