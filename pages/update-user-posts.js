import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function UpdateUserPosts() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('❌ Kullanıcılar yüklenemedi: ' + error.message);
    }
  };

  const updateUserPosts = async () => {
    if (!selectedUser) {
      setMessage('⚠️ Lütfen kullanıcı seçin');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setStats(null);

      // Seçili kullanıcının bilgilerini al
      const user = users.find(u => u.id === selectedUser);
      if (!user) {
        setMessage('❌ Kullanıcı bulunamadı');
        return;
      }

      console.log('Updating posts for user:', user.name, user.avatar);

      // 1. Community posts'ları güncelle
      const communityPostsRef = collection(db, 'communityPosts');
      const communityQuery = query(communityPostsRef, where('userId', '==', selectedUser));
      const communitySnapshot = await getDocs(communityQuery);
      
      let communityUpdated = 0;
      for (const postDoc of communitySnapshot.docs) {
        await updateDoc(doc(db, 'communityPosts', postDoc.id), {
          userName: user.name || 'Kullanıcı',
          userAvatar: user.avatar || user.photoURL || ''
        });
        communityUpdated++;
      }

      // 2. Check-in'leri güncelle
      const checkInsRef = collection(db, 'checkIns');
      const checkInsQuery = query(checkInsRef, where('userId', '==', selectedUser));
      const checkInsSnapshot = await getDocs(checkInsQuery);
      
      let checkInsUpdated = 0;
      for (const checkInDoc of checkInsSnapshot.docs) {
        await updateDoc(doc(db, 'checkIns', checkInDoc.id), {
          userName: user.name || 'Kullanıcı',
          userAvatar: user.avatar || user.photoURL || ''
        });
        checkInsUpdated++;
      }

      // 3. Comments'leri güncelle (venue comments)
      const venueCommentsRef = collection(db, 'venueComments');
      const commentsQuery = query(venueCommentsRef, where('userId', '==', selectedUser));
      const commentsSnapshot = await getDocs(commentsQuery);
      
      let commentsUpdated = 0;
      for (const commentDoc of commentsSnapshot.docs) {
        await updateDoc(doc(db, 'venueComments', commentDoc.id), {
          userName: user.name || 'Kullanıcı',
          userAvatar: user.avatar || user.photoURL || ''
        });
        commentsUpdated++;
      }

      setStats({
        communityPosts: communityUpdated,
        checkIns: checkInsUpdated,
        comments: commentsUpdated,
        total: communityUpdated + checkInsUpdated + commentsUpdated
      });

      setMessage('✅ Tüm gönderiler başarıyla güncellendi!');
    } catch (error) {
      console.error('Error updating posts:', error);
      setMessage('❌ Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u.id === selectedUser);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>🔄 Kullanıcı Gönderilerini Güncelle</h1>

      <div style={{
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        marginBottom: '30px',
        borderLeft: '4px solid #ffc107'
      }}>
        <h3>ℹ️ Bu Araç Ne İşe Yarar?</h3>
        <p>Kullanıcı profil fotoğrafını veya ismini değiştirdiğinde, eski gönderilerdeki bilgiler otomatik olarak güncellenmez. Bu araç, seçili kullanıcının tüm eski gönderilerini (topluluk gönderileri, check-in'ler, yorumlar) yeni profil bilgileriyle günceller.</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Kullanıcı Seç:
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">-- Kullanıcı Seçin --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name || user.email || user.id}
              {user.role === 'admin' && ' (Admin)'}
              {user.role === 'merchant' && ' (Merchant)'}
            </option>
          ))}
        </select>
      </div>

      {selectedUserData && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Seçili Kullanıcı Bilgileri:</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
            {selectedUserData.avatar && (
              <img 
                src={selectedUserData.avatar} 
                alt="Avatar" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #0057FF'
                }} 
              />
            )}
            <div>
              <p style={{ margin: '5px 0' }}><strong>İsim:</strong> {selectedUserData.name || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Email:</strong> {selectedUserData.email || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Rol:</strong> {selectedUserData.role || 'user'}</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                <strong>Avatar URL:</strong> {selectedUserData.avatar || 'Yok'}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={updateUserPosts}
        disabled={loading || !selectedUser}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#ccc' : '#0057FF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '⏳ Güncelleniyor...' : '🔄 Tüm Gönderileri Güncelle'}
      </button>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '8px',
          fontSize: '16px'
        }}>
          {message}
        </div>
      )}

      {stats && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h3 style={{ marginTop: 0, color: '#155724' }}>📊 Güncelleme İstatistikleri:</h3>
          <ul style={{ margin: '10px 0', paddingLeft: '20px', color: '#155724' }}>
            <li><strong>Topluluk Gönderileri:</strong> {stats.communityPosts} adet güncellendi</li>
            <li><strong>Check-in'ler:</strong> {stats.checkIns} adet güncellendi</li>
            <li><strong>Yorumlar:</strong> {stats.comments} adet güncellendi</li>
            <li style={{ marginTop: '10px', fontSize: '18px' }}>
              <strong>TOPLAM:</strong> {stats.total} kayıt güncellendi
            </li>
          </ul>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
        <h3>📝 Kullanım Talimatları:</h3>
        <ol>
          <li>Yukarıdan profil fotoğrafını değiştirdiğiniz kullanıcıyı seçin</li>
          <li>"Tüm Gönderileri Güncelle" butonuna tıklayın</li>
          <li>İşlem tamamlandığında istatistikleri göreceksiniz</li>
          <li>Mobil uygulamada Topluluk ekranına gidip gönderileri kontrol edin</li>
        </ol>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <strong>Not:</strong> Bu işlem geri alınamaz. Tüm eski gönderiler, seçili kullanıcının güncel profil bilgileriyle güncellenecektir.
        </p>
      </div>
    </div>
  );
}

