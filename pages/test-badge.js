import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

const AVAILABLE_BADGES = [
  { id: 'early-bird', name: 'Erken Kuş 🐦', rarity: 'rare' },
  { id: 'explorer', name: 'Şehir Kaşifi 🗺️', rarity: 'epic' },
  { id: 'foodie', name: 'Lezzet Avcısı 🍕', rarity: 'common' },
  { id: 'coffee-lover', name: 'Kahve Tutkunu ☕', rarity: 'common' },
  { id: 'social-butterfly', name: 'Sosyal Kelebek 🦋', rarity: 'rare' },
  { id: 'night-owl', name: 'Gece Kuşu 🦉', rarity: 'rare' },
  { id: 'weekend-warrior', name: 'Hafta Sonu Savaşçısı 🎯', rarity: 'common' },
  { id: 'culture-vulture', name: 'Kültür Akbabası 🎭', rarity: 'epic' },
];

export default function TestBadge() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

  const addBadgeToUser = async () => {
    if (!selectedUser || !selectedBadge) {
      setMessage('⚠️ Lütfen kullanıcı ve rozet seçin');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const userRef = doc(db, 'users', selectedUser);
      await updateDoc(userRef, {
        badges: arrayUnion(selectedBadge)
      });

      setMessage('✅ Rozet başarıyla eklendi!');
      loadUsers(); // Refresh user list
    } catch (error) {
      console.error('Error adding badge:', error);
      setMessage('❌ Hata: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(u => u.id === selectedUser);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px' }}>🎖️ Rozet Ekleme Aracı</h1>

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
          padding: '15px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>Seçili Kullanıcı Bilgileri:</h3>
          <p><strong>İsim:</strong> {selectedUserData.name || 'N/A'}</p>
          <p><strong>Email:</strong> {selectedUserData.email || 'N/A'}</p>
          <p><strong>Rol:</strong> {selectedUserData.role || 'user'}</p>
          <p><strong>Mevcut Rozetler:</strong> {(selectedUserData.badges || []).join(', ') || 'Yok'}</p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Rozet Seç:
        </label>
        <select
          value={selectedBadge}
          onChange={(e) => setSelectedBadge(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}
        >
          <option value="">-- Rozet Seçin --</option>
          {AVAILABLE_BADGES.map(badge => (
            <option key={badge.id} value={badge.id}>
              {badge.name} ({badge.rarity})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={addBadgeToUser}
        disabled={loading || !selectedUser || !selectedBadge}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          fontWeight: 'bold',
          backgroundColor: loading ? '#ccc' : '#0057FF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '⏳ Ekleniyor...' : '✨ Rozet Ekle'}
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

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
        <h3>📝 Kullanım Talimatları:</h3>
        <ol>
          <li>Yukarıdan bir kullanıcı seçin (Admin kullanıcıyı seçebilirsiniz)</li>
          <li>Eklemek istediğiniz rozeti seçin</li>
          <li>"Rozet Ekle" butonuna tıklayın</li>
          <li>Mobil uygulamada Profil → Rozetler'e giderek kontrol edin</li>
        </ol>
      </div>
    </div>
  );
}

