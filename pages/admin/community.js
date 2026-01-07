import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, orderBy, limit, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const POST_TYPES = {
  POST: { id: 'post', label: 'Gönderi', icon: '💬', color: '#0057FF', bgColor: '#EFF6FF' },
  QUESTION: { id: 'question', label: 'Soru', icon: '❓', color: '#10B981', bgColor: '#D1FAE5' },
  ANNOUNCEMENT: { id: 'announcement', label: 'İlan', icon: '📢', color: '#F59E0B', bgColor: '#FEF3C7' },
};

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editFormData, setEditFormData] = useState({
    content: '',
    type: 'post'
  });
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0,
    postsByType: {
      post: 0,
      question: 0,
      announcement: 0,
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      loadPosts();
    });

    return () => unsubscribe();
  }, [router]);

  const loadPosts = async () => {
    try {
      setLoading(true);

      const postsQuery = query(
        collection(db, 'communityPosts'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setPosts(postsData);

      // Calculate stats
      const totalPosts = postsData.length;
      const totalLikes = postsData.reduce((sum, p) => sum + (p.likes || 0), 0);
      const totalComments = postsData.reduce((sum, p) => sum + (p.comments || 0), 0);
      const postsByType = {
        post: postsData.filter(p => p.type === 'post').length,
        question: postsData.filter(p => p.type === 'question').length,
        announcement: postsData.filter(p => p.type === 'announcement').length,
      };

      setStats({
        totalPosts,
        totalLikes,
        totalComments,
        postsByType,
      });
    } catch (error) {
      console.error('Load posts error:', error);
      toast.error('Gönderiler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteDoc(doc(db, 'communityPosts', postId));
      toast.success('Gönderi silindi');
      loadPosts();
    } catch (error) {
      console.error('Delete post error:', error);
      toast.error('Gönderi silinemedi');
    }
  };

  const handleTogglePin = async (postId, isPinned) => {
    try {
      await updateDoc(doc(db, 'communityPosts', postId), {
        pinned: !isPinned,
      });
      toast.success(isPinned ? 'Gönderi sabitleme kaldırıldı' : 'Gönderi sabitlendi');
      loadPosts();
    } catch (error) {
      console.error('Toggle pin error:', error);
      toast.error('İşlem başarısız');
    }
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setEditFormData({
      content: post.content || '',
      type: post.type || 'post'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(doc(db, 'communityPosts', selectedPost.id), {
        content: editFormData.content,
        type: editFormData.type,
      });
      toast.success('Gönderi güncellendi');
      setShowEditModal(false);
      loadPosts();
    } catch (error) {
      console.error('Update post error:', error);
      toast.error('Gönderi güncellenemedi');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.type === filter);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🌍 Topluluk Yönetimi</h1>
            <p className="text-gray-600 mt-1">Gönderileri yönet ve moderasyon yap</p>
          </div>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔄 Yenile
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Gönderi</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalPosts}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Beğeni</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.totalLikes}</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Toplam Yorum</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalComments}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Etkileşim Oranı</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalPosts > 0 ? Math.round((stats.totalLikes + stats.totalComments) / stats.totalPosts) : 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gönderi Türleri</h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.values(POST_TYPES).map((type) => (
              <div key={type.id} className="text-center p-4 rounded-lg" style={{ backgroundColor: type.bgColor }}>
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="text-sm font-medium mb-1" style={{ color: type.color }}>{type.label}</div>
                <div className="text-2xl font-bold text-gray-900">{stats.postsByType[type.id]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tümü ({posts.length})
          </button>
          {Object.values(POST_TYPES).map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === type.id ? 'text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              style={filter === type.id ? { backgroundColor: type.color } : {}}
            >
              {type.icon} {type.label} ({stats.postsByType[type.id]})
            </button>
          ))}
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Gönderiler</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredPosts.map((post) => {
              const typeConfig = POST_TYPES[post.type?.toUpperCase()] || POST_TYPES.POST;
              return (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: typeConfig.bgColor, color: typeConfig.color }}
                      >
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                      {post.pinned && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          📌 Sabitlenmiş
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePin(post.id, post.pinned)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition"
                      >
                        {post.pinned ? '📌 Sabitlemeyi Kaldır' : '📌 Sabitle'}
                      </button>
                      <button
                        onClick={() => handleEditPost(post)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                      >
                        ✏️ Düzenle
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                      >
                        🗑️ Sil
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="font-medium text-gray-900 mb-1">
                      {post.userName || 'Bilinmeyen Kullanıcı'}
                    </div>
                    <p className="text-gray-700">{post.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>❤️ {post.likes || 0} beğeni</span>
                    <span>💬 {post.comments || 0} yorum</span>
                    <span>📅 {formatDate(post.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Post Modal */}
        {showEditModal && selectedPost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Gönderiyi Düzenle</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gönderi Türü</label>
                    <select
                      value={editFormData.type}
                      onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.values(POST_TYPES).map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                    <textarea
                      value={editFormData.content}
                      onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Gönderi içeriğini yazın..."
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Kullanıcı:</strong> {selectedPost.userName || 'Bilinmeyen'}<br/>
                      <strong>Tarih:</strong> {formatDate(selectedPost.createdAt)}<br/>
                      <strong>Beğeni:</strong> {selectedPost.likes || 0} | <strong>Yorum:</strong> {selectedPost.comments || 0}
                    </p>
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

