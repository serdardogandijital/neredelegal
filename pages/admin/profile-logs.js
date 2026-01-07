import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ProfileLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, email, phone
  const [searchUserId, setSearchUserId] = useState('');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'profileChangeLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().changedAt),
      }));

      // Filter by type if needed
      let filtered = logsData;
      if (filter === 'email') {
        filtered = logsData.filter(log => log.changedFields?.includes('email'));
      } else if (filter === 'phone') {
        filtered = logsData.filter(log => log.changedFields?.includes('phone'));
      }

      // Filter by user ID if searching
      if (searchUserId.trim()) {
        filtered = filtered.filter(log => 
          log.userId?.toLowerCase().includes(searchUserId.toLowerCase())
        );
      }

      setLogs(filtered);
    } catch (error) {
      console.error('Load logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLogs();
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profil Değişiklik Logları</h1>
          <p className="text-gray-600 mt-2">
            Kullanıcıların email ve telefon değişiklik geçmişi
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Değişiklik Tipi
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                <option value="email">Email Değişiklikleri</option>
                <option value="phone">Telefon Değişiklikleri</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kullanıcı ID Ara
              </label>
              <input
                type="text"
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                placeholder="Kullanıcı ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ara
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Toplam Değişiklik</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{logs.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Email Değişiklikleri</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {logs.filter(log => log.changedFields?.includes('email')).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-sm font-medium text-gray-600">Telefon Değişiklikleri</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {logs.filter(log => log.changedFields?.includes('phone')).length}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loglar yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Henüz log kaydı yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Değişiklik Tipi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eski Değer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yeni Değer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {log.userId?.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          {log.changedFields?.includes('email') && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Email
                            </span>
                          )}
                          {log.changedFields?.includes('phone') && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Telefon
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.changedFields?.includes('email') && (
                          <div className="mb-1">
                            <span className="font-medium">Email:</span> {log.oldEmail || '-'}
                          </div>
                        )}
                        {log.changedFields?.includes('phone') && (
                          <div>
                            <span className="font-medium">Tel:</span> {log.oldPhone || '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {log.changedFields?.includes('email') && (
                          <div className="mb-1">
                            <span className="font-medium">Email:</span> {log.newEmail || '-'}
                          </div>
                        )}
                        {log.changedFields?.includes('phone') && (
                          <div>
                            <span className="font-medium">Tel:</span> {log.newPhone || '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const csv = [
                ['Tarih', 'Kullanıcı ID', 'Değişiklik Tipi', 'Eski Email', 'Yeni Email', 'Eski Telefon', 'Yeni Telefon'],
                ...logs.map(log => [
                  formatDate(log.timestamp),
                  log.userId,
                  log.changedFields?.join(', '),
                  log.oldEmail || '',
                  log.newEmail || '',
                  log.oldPhone || '',
                  log.newPhone || '',
                ])
              ].map(row => row.join(',')).join('\n');
              
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `profil-degisiklik-loglari-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📥 CSV İndir
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

