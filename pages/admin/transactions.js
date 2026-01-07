import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import AdminLayout from '../../components/AdminLayout';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
          await loadTransactions();
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

  const loadTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      const transactionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = 
      t.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const stats = {
    total: transactions.length,
    earn: transactions.filter(t => t.type === 'earn').length,
    spend: transactions.filter(t => t.type === 'spend').length,
    bonus: transactions.filter(t => t.type === 'bonus').length,
    totalPoints: transactions.reduce((sum, t) => sum + (t.points || 0), 0)
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'earn': return 'bg-green-100 text-green-800';
      case 'spend': return 'bg-red-100 text-red-800';
      case 'bonus': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'earn': return 'Kazanç';
      case 'spend': return 'Harcama';
      case 'bonus': return 'Bonus';
      default: return type;
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTransactions.map(t => ({
      'Tarih': t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('tr-TR') : '-',
      'Kullanıcı ID': t.userId || '',
      'Mekan': t.venue || '',
      'Tip': getTypeLabel(t.type),
      'Puan': t.points || 0,
      'Açıklama': t.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İşlemler');
    
    const fileName = `islemler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Excel dosyası indirildi');
  };

  const exportToCSV = () => {
    const exportData = filteredTransactions.map(t => ({
      'Tarih': t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString('tr-TR') : '-',
      'Kullanıcı ID': t.userId || '',
      'Mekan': t.venue || '',
      'Tip': getTypeLabel(t.type),
      'Puan': t.points || 0,
      'Açıklama': t.description || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `islemler_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV dosyası indirildi');
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
        <h1 className="text-3xl font-bold text-gray-900">İşlem Geçmişi</h1>
        <p className="text-gray-600 mt-2">Tüm puan işlemlerini görüntüle</p>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam İşlem</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Kazanç</p>
          <p className="text-2xl font-bold text-green-600">{stats.earn}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Harcama</p>
          <p className="text-2xl font-bold text-red-600">{stats.spend}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Bonus</p>
          <p className="text-2xl font-bold text-purple-600">{stats.bonus}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Toplam Puan</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalPoints.toLocaleString()}</p>
        </div>
      </div>

      {/* Filtreler ve Export */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Mekan veya kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm İşlemler</option>
              <option value="earn">Kazanç</option>
              <option value="spend">Harcama</option>
              <option value="bonus">Bonus</option>
            </select>
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

      {/* İşlem Tablosu */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mekan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.createdAt?.toDate 
                      ? transaction.createdAt.toDate().toLocaleString('tr-TR')
                      : transaction.date || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {transaction.userId?.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.venue || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getTypeColor(transaction.type)}`}>
                      {getTypeLabel(transaction.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={transaction.type === 'spend' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.type === 'spend' ? '-' : '+'}{transaction.points || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            İşlem bulunamadı
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

