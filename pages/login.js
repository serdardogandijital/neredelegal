import { useState } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin' || userData.role === 'merchant') {
          toast.success('Giriş başarılı!');
          router.push(userData.role === 'admin' ? '/admin' : '/merchant');
        } else {
          toast.error('Yetkisiz erişim');
          await auth.signOut();
        }
      } else {
        toast.error('Kullanıcı bulunamadı');
        await auth.signOut();
      }
    } catch (error) {
      toast.error('Giriş hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">nerede?</h2>
          <p className="text-sm text-gray-600 mt-2 font-medium">İşletme ve admin yönetim sistemi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="admin@nerede.app"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none transition-all font-semibold"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center mb-3">Demo Hesaplar</p>
          <div className="space-y-2">
            <button
              onClick={() => { setEmail('admin@nerede.app'); setPassword('admin123'); }}
              className="w-full py-2.5 px-4 border-2 border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 text-sm font-medium transition-all"
            >
              👨‍💼 Admin Demo
            </button>
            <button
              onClick={() => { setEmail('merchant@nerede.app'); setPassword('merchant123'); }}
              className="w-full py-2.5 px-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 text-sm font-medium transition-all"
            >
              🏪 İşletme Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

