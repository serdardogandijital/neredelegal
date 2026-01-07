import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';
import QRScanner from '../../components/QRScanner';
import toast from 'react-hot-toast';

export default function ScanUserPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannedUser, setScannedUser] = useState(null);
  const [points, setPoints] = useState(50);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const scanningRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && (userDoc.data().role === 'merchant' || userDoc.data().role === 'admin')) {
          setUser({ ...userDoc.data(), uid: firebaseUser.uid });
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

  const handleQRScan = async (data) => {
    if (scanningRef.current) return;
    scanningRef.current = true;

    try {
      let userId;
      
      // Try to parse as JSON first
      try {
        const userData = JSON.parse(data);
        userId = userData.userId;
      } catch (e) {
        // If not JSON, check if it's NEREDE_USER_ format
        if (data.startsWith('NEREDE_USER_')) {
          userId = data.replace('NEREDE_USER_', '');
        } else {
          toast.error('Geçersiz QR kod formatı');
          scanningRef.current = false;
          return;
        }
      }
      
      if (!userId) {
        toast.error('Geçersiz QR kod');
        scanningRef.current = false;
        return;
      }

      // Fetch user details from Firestore
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        toast.error('Kullanıcı bulunamadı');
        scanningRef.current = false;
        return;
      }

      const userData = userDoc.data();
      setScannedUser({
        ...userData,
        uid: userId,
      });
      
      toast.success(`${userData.name || 'Kullanıcı'} bilgileri yüklendi`);
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error('QR kod okunamadı: ' + error.message);
      scanningRef.current = false;
    }
  };

  const handleQRError = (error) => {
    toast.error(error);
  };

  const handleGivePoints = async () => {
    if (!scannedUser || !points || points <= 0) {
      toast.error('Lütfen geçerli bir puan miktarı girin');
      return;
    }

    setProcessing(true);
    try {
      // Check if merchant already awarded points to this customer today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      const todayEndISO = todayEnd.toISOString();

      const transactionsRef = collection(db, 'transactions');
      const dailyCheckQuery = query(
        transactionsRef,
        where('userId', '==', scannedUser.uid),
        where('merchantId', '==', user.uid),
        where('type', '==', 'earn'),
        where('date', '>=', todayStart)
      );

      const existingTransactions = await getDocs(dailyCheckQuery);
      
      // Filter client-side for today's end time
      const todayTransactions = existingTransactions.docs.filter(doc => {
        const txDate = doc.data().date;
        return txDate <= todayEndISO;
      });
      
      if (todayTransactions.length > 0) {
        toast.error('Bu müşteriye bugün zaten puan verilmiş. Günde sadece bir kere puan verilebilir.');
        setProcessing(false);
        return;
      }

      // Update user points
      await updateDoc(doc(db, 'users', scannedUser.uid), {
        points: increment(points),
        updatedAt: serverTimestamp(),
      });

      // Create transaction
      await addDoc(collection(db, 'transactions'), {
        userId: scannedUser.uid,
        merchantId: user.uid,
        merchantName: user.name || 'Merchant',
        points: points,
        type: 'earn',
        venue: user.venueName || 'Venue',
        venueId: user.venueId || user.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      toast.success(`${scannedUser.name || scannedUser.email} adlı kullanıcıya ${points} puan verildi! 🎉`);
      
      // Reset
      setScannedUser(null);
      setPoints(50);
    } catch (error) {
      console.error('Give points error:', error);
      if (error.message?.includes('bugün zaten puan verilmiş') || error.message?.includes('Günde sadece bir kere')) {
        toast.error('Bu müşteriye bugün zaten puan verilmiş. Günde sadece bir kere puan verilebilir.');
      } else {
        toast.error('Puan verilemedi');
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setScannedUser(null);
    setPoints(50);
    scanningRef.current = false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <MerchantLayout user={user}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Müşteri QR Okut</h1>
          <p className="text-gray-600 mt-2">Müşterinin QR kodunu okutun ve puan verin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Taraf - QR Okuma */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Kod Okut</h2>
            
            {/* QR Scanner */}
            <div className="mb-6">
              {!scannedUser ? (
                <QRScanner onScan={handleQRScan} onError={handleQRError} />
              ) : (
                <div className="aspect-square bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-300">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-green-800 font-semibold">QR Kod Tarandı</p>
                  </div>
                </div>
              )}
            </div>

            {scannedUser && (
              <button
                onClick={handleReset}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Yeni QR Okut
              </button>
            )}
          </div>

          {/* Sağ Taraf - Müşteri Bilgileri */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Müşteri Bilgileri</h2>

            {!scannedUser ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👤</div>
                <p className="text-gray-600">QR kod okutulduğunda müşteri bilgileri burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Müşteri Profil */}
                <div className="bg-blue-50 rounded-lg p-4">
                  {scannedUser.photoURL && (
                    <img 
                      src={scannedUser.photoURL} 
                      alt={scannedUser.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-300"
                    />
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {scannedUser.name || scannedUser.email}
                    </h3>
                    <p className="text-sm text-gray-600">{scannedUser.email}</p>
                  </div>
                </div>

                {/* Mevcut Puan */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mevcut Puan</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      ⭐ {scannedUser.points || 0}
                    </span>
                  </div>
                </div>

                {/* Puan Ver */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verilecek Puan
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    placeholder="50"
                    min="1"
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl font-bold"
                  />
                </div>

                {/* Yeni Toplam */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Yeni Toplam</span>
                    <span className="text-3xl font-bold text-green-600">
                      {(scannedUser.points || 0) + (points || 0)} puan
                    </span>
                  </div>
                </div>

                {/* Puan Ver Butonu */}
                <button
                  onClick={handleGivePoints}
                  disabled={processing || !points || points <= 0}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
                >
                  {processing ? 'İşleniyor...' : `${points} Puan Ver 🎉`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Kullanım Talimatları */}
        <div className="mt-8 bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Nasıl Kullanılır?</h3>
          <ol className="space-y-2 text-gray-700">
            <li>1. 📱 Müşteriden uygulamadan QR kodunu göstermesini isteyin</li>
            <li>2. 📷 QR kodu kamera ile okutun</li>
            <li>3. ✅ Müşteri bilgilerini kontrol edin</li>
            <li>4. ⭐ Verilecek puan miktarını belirleyin (varsayılan 50)</li>
            <li>5. 🎉 "Puan Ver" butonuna basın</li>
            <li>6. ✨ Puan otomatik olarak müşterinin hesabına eklenir</li>
          </ol>
        </div>
      </div>
    </MerchantLayout>
  );
}

