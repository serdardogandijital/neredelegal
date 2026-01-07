import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { auth } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function RoutesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([
    { 
      id: '1', 
      name: 'Tarihi Yarımada Turu', 
      description: 'Sultanahmet, Ayasofya, Topkapı Sarayı',
      venueCount: 5,
      duration: '3 saat',
      difficulty: 'Kolay',
      city: 'İstanbul',
      active: true
    },
    { 
      id: '2', 
      name: 'Bohem Beyoğlu', 
      description: 'İstiklal, Galata, Karaköy',
      venueCount: 8,
      duration: '4 saat',
      difficulty: 'Orta',
      city: 'İstanbul',
      active: true
    },
    { 
      id: '3', 
      name: 'Boğaz Keyfi', 
      description: 'Ortaköy, Bebek, Rumeli Hisarı',
      venueCount: 6,
      duration: '5 saat',
      difficulty: 'Kolay',
      city: 'İstanbul',
      active: false
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    duration: '',
    difficulty: 'Kolay',
    city: 'İstanbul',
    active: true
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const filteredRoutes = routes.filter(route =>
    route.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: routes.length,
    active: routes.filter(r => r.active).length,
    totalVenues: routes.reduce((sum, r) => sum + r.venueCount, 0),
  };

  const handleEditRoute = (route) => {
    setSelectedRoute(route);
    setEditFormData({
      name: route.name || '',
      description: route.description || '',
      duration: route.duration || '',
      difficulty: route.difficulty || 'Kolay',
      city: route.city || 'İstanbul',
      active: route.active !== undefined ? route.active : true
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    const updatedRoutes = routes.map(r => 
      r.id === selectedRoute.id 
        ? { ...r, ...editFormData }
        : r
    );
    setRoutes(updatedRoutes);
    toast.success('Rota güncellendi');
    setShowEditModal(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Yükleniyor...</div>
    </div>;
  }

  return (
    <AdminLayout title="Keşfet Rotaları">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Keşfet Rotaları</h1>
          <p className="text-gray-600 mt-2">Kullanıcılar için özel şehir rotaları yönetin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Toplam Rota</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Aktif Rota</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.totalVenues}</div>
            <div className="text-sm text-gray-600">Toplam Mekan</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rota ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Routes List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rota Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mekan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Süre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zorluk
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
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">🗺️ {route.name}</div>
                    <div className="text-sm text-gray-500">{route.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{route.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{route.venueCount} mekan</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">⏱️ {route.duration}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">🎯 {route.difficulty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      route.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="text-gray-500">Rota bulunamadı</div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="font-semibold text-blue-900 mb-2">📝 Keşfet Rotaları Hakkında</div>
          <div className="text-blue-800 text-sm">
            Keşfet rotaları kullanıcıların şehirde gezebilecekleri özel rotalar sunar.
            Her rota birden fazla mekanı içerir ve kullanıcılara puan kazandırır.
          </div>
        </div>

        {/* Edit Route Modal */}
        {showEditModal && selectedRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Rota Düzenle</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rota Adı</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                      <input
                        type="text"
                        value={editFormData.city}
                        onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Süre</label>
                      <input
                        type="text"
                        value={editFormData.duration}
                        onChange={(e) => setEditFormData({...editFormData, duration: e.target.value})}
                        placeholder="Örn: 3 saat"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zorluk Seviyesi</label>
                    <select
                      value={editFormData.difficulty}
                      onChange={(e) => setEditFormData({...editFormData, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kolay">Kolay</option>
                      <option value="Orta">Orta</option>
                      <option value="Zor">Zor</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editFormData.active}
                        onChange={(e) => setEditFormData({...editFormData, active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Rota Aktif</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

