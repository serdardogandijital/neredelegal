import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import MerchantLayout from '../../components/MerchantLayout';
import QRScanner from '../../components/QRScanner';
import toast from 'react-hot-toast';

export default function ScanDiscountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [validatedDiscount, setValidatedDiscount] = useState(null);
  const [billAmount, setBillAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();
  const scanningRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'merchant') {
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

  const handleQRScan = async (scannedData) => {
    if (scanningRef.current) {
      console.log('⏭️ Already scanning, ignoring duplicate scan');
      return;
    }
    
    console.log('📷 QR Code scanned:', scannedData);
    scanningRef.current = true;
    
    // Try to parse as JSON (mobile app format)
    try {
      const parsed = JSON.parse(scannedData);
      console.log('📋 Parsed QR data:', parsed);
      
      if (parsed.type === 'discount' && parsed.code) {
        // Mevcut indirim kodu
        const discountCode = parsed.code;
        console.log('✅ Extracted discount code:', discountCode);
        setManualCode(discountCode);
        setShowScanner(false);
        await validateCode(discountCode);
      } else if (parsed.type === 'user' || scannedData.startsWith('NEREDE_USER_') || scannedData.startsWith('nerede_user_')) {
        // Kullanıcı QR kodu - Otomatik indirim kodu oluştur
        console.log('👤 User QR detected, creating discount code...');
        toast.loading('İndirim kodu oluşturuluyor...');
        
        const userId = parsed.userId || scannedData.replace('NEREDE_USER_', '').replace('nerede_user_', '');
        await createDiscountForUser(userId);
      } else {
        console.log('⚠️ Unknown QR code type:', parsed.type);
        toast.error('Geçersiz QR kod. Lütfen kullanıcı veya indirim QR kodunu okutun.');
        scanningRef.current = false;
        return;
      }
    } catch (e) {
      // Not JSON, check if it's a user code format
      if (scannedData.startsWith('NEREDE_USER_') || scannedData.startsWith('nerede_user_')) {
        console.log('👤 User code detected (raw), creating discount code...');
        toast.loading('İndirim kodu oluşturuluyor...');
        
        const userId = scannedData.replace('NEREDE_USER_', '').replace('nerede_user_', '');
        await createDiscountForUser(userId);
      } else {
        // Might be manual discount code entry
        console.log('📝 Using raw code (not JSON):', scannedData);
        setManualCode(scannedData);
        setShowScanner(false);
        await validateCode(scannedData);
      }
    }
    
    // Reset scanning flag after a delay
    setTimeout(() => {
      scanningRef.current = false;
      console.log('✅ Scanner ready for next scan');
    }, 2000);
  };

  const handleQRError = (error) => {
    toast.error(error);
  };

  const createDiscountForUser = async (userId) => {
    try {
      console.log('🎁 Creating discount for user:', userId);
      
      const response = await fetch('/api/discount/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          merchantId: user.uid,
        }),
      });

      const result = await response.json();
      console.log('📋 Create result:', result);

      if (result.success) {
        toast.dismiss();
        toast.success('İndirim kodu oluşturuldu! ✅');
        
        // Otomatik olarak kodu doğrula
        setManualCode(result.code);
        setShowScanner(false);
        await validateCode(result.code);
        
        console.log('✅ Discount created and validated:', result.code);
      } else {
        toast.dismiss();
        toast.error(result.message || 'İndirim kodu oluşturulamadı');
        console.log('❌ Failed to create discount:', result.message);
        scanningRef.current = false;
      }
    } catch (error) {
      toast.dismiss();
      console.error('❌ Create discount error:', error);
      toast.error('İşlem hatası: ' + error.message);
      scanningRef.current = false;
    }
  };

  const validateCode = async (code) => {
    try {
      console.log('🔍 Validating code:', code);
      
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      console.log('📋 Validation result:', result);

      if (result.valid) {
        setValidatedDiscount(result.data);
        toast.success('Kod geçerli! ✅');
        console.log('✅ Discount validated:', result.data);
      } else {
        toast.error(result.message || 'Geçersiz kod');
        setValidatedDiscount(null);
        console.log('❌ Invalid code:', result.message);
      }
    } catch (error) {
      console.error('❌ Validate error:', error);
      toast.error('Doğrulama hatası: ' + error.message);
      setValidatedDiscount(null);
    }
  };

  const handleValidateCode = async () => {
    if (!manualCode || manualCode.length < 5) {
      toast.error('Lütfen geçerli bir kod girin');
      return;
    }
    await validateCode(manualCode);
  };

  const handleUseDiscount = async () => {
    if (!billAmount || parseFloat(billAmount) <= 0) {
      toast.error('Lütfen geçerli bir tutar girin');
      return;
    }

    if (!validatedDiscount) {
      toast.error('Önce kodu doğrulayın');
      return;
    }

    setProcessing(true);
    try {
      console.log('💳 Using discount:', {
        codeId: validatedDiscount.id,
        billAmount: parseFloat(billAmount),
        merchantId: user.uid
      });
      
      const response = await fetch('/api/discount/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId: validatedDiscount.id,
          billAmount: parseFloat(billAmount),
          merchantId: user.uid,
        }),
      });

      const result = await response.json();
      console.log('📋 Use result:', result);

      if (result.success) {
        toast.success('İndirim başarıyla uygulandı! 🎉');
        
        // Show result
        toast.success(
          `Hesap: ${billAmount} TL\nİndirim: -${result.discountAmount.toFixed(2)} TL\nÖdenecek: ${result.finalAmount.toFixed(2)} TL`,
          { duration: 5000 }
        );
        
        // Reset form
        setManualCode('');
        setBillAmount('');
        setValidatedDiscount(null);
        scanningRef.current = false; // Reset scanner
        
        console.log('✅ Discount applied successfully');
      } else {
        toast.error(result.message || 'İndirim uygulanamadı');
        console.log('❌ Failed to apply discount:', result.message);
      }
    } catch (error) {
      console.error('❌ Use discount error:', error);
      toast.error('İşlem hatası: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setManualCode('');
    setBillAmount('');
    setValidatedDiscount(null);
    scanningRef.current = false;
  };

  const calculateDiscount = () => {
    if (!validatedDiscount || !billAmount) return 0;
    
    const amount = parseFloat(billAmount);
    if (validatedDiscount.discountType === 'percentage') {
      return (amount * validatedDiscount.discountValue) / 100;
    }
    return validatedDiscount.discountValue;
  };

  const getFinalAmount = () => {
    const amount = parseFloat(billAmount) || 0;
    const discount = calculateDiscount();
    return amount - discount;
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
          <h1 className="text-3xl font-bold text-gray-900">İndirim Kodu Okut</h1>
          <p className="text-gray-600 mt-2">Müşterinin QR kodunu okutun veya kodu manuel girin</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Taraf - Kod Okutma */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kod Doğrulama</h2>
            
            {/* QR Scanner */}
            <div className="mb-6">
              <QRScanner onScan={handleQRScan} onError={handleQRError} />
            </div>

            {/* Manuel Kod Girişi */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veya Kodu Manuel Girin
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="DISC-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center font-mono text-lg"
                  disabled={validatedDiscount}
                />
              </div>

              <button
                onClick={handleValidateCode}
                disabled={validatedDiscount || !manualCode}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Kodu Doğrula
              </button>

              {validatedDiscount && (
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Yeni Kod Okut
                </button>
              )}
            </div>
          </div>

          {/* Sağ Taraf - İndirim Detayı */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">İndirim Detayı</h2>

            {!validatedDiscount ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-gray-600">Kod doğrulandığında detaylar burada görünecek</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Müşteri Bilgileri */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Müşteri</span>
                    <span className="text-lg font-semibold text-gray-900">{validatedDiscount.userName}</span>
                  </div>
                  {validatedDiscount.userPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Telefon</span>
                      <span className="text-sm text-gray-900">{validatedDiscount.userPhone}</span>
                    </div>
                  )}
                </div>

                {/* Kampanya Bilgileri */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Kampanya</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kampanya Adı</span>
                      <span className="font-medium">{validatedDiscount.campaignName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">İndirim</span>
                      <span className="font-bold text-green-600">
                        {validatedDiscount.discountType === 'percentage' 
                          ? `%${validatedDiscount.discountValue}`
                          : `${validatedDiscount.discountValue} TL`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hesap Tutarı */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hesap Tutarı (TL)
                  </label>
                  <input
                    type="number"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right text-2xl font-bold"
                  />
                </div>

                {/* Hesaplama */}
                {billAmount && parseFloat(billAmount) > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Hesap Tutarı</span>
                      <span>{parseFloat(billAmount).toFixed(2)} TL</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>İndirim</span>
                      <span>-{calculateDiscount().toFixed(2)} TL</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 flex justify-between text-xl font-bold text-gray-900">
                      <span>Ödenecek</span>
                      <span>{getFinalAmount().toFixed(2)} TL</span>
                    </div>
                  </div>
                )}

                {/* Kullan Butonu */}
                <button
                  onClick={handleUseDiscount}
                  disabled={processing || !billAmount || parseFloat(billAmount) <= 0}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                >
                  {processing ? 'İşleniyor...' : 'İndirimi Uygula'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Kullanım Talimatları */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Nasıl Kullanılır?</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🎁 Yöntem 1: Anlık İndirim Oluştur</h4>
              <ol className="space-y-1 text-gray-700 text-sm">
                <li>1. Müşterinin <strong>kullanıcı QR kodunu</strong> okutun (profil QR)</li>
                <li>2. Sistem otomatik olarak %10 indirim kodu oluşturur</li>
                <li>3. Hesap tutarını girin</li>
                <li>4. İndirimi uygula</li>
              </ol>
            </div>
            
            <div className="border-t border-blue-200 pt-3">
              <h4 className="font-semibold text-gray-800 mb-2">🎫 Yöntem 2: Mevcut İndirim Kodunu Kullan</h4>
              <ol className="space-y-1 text-gray-700 text-sm">
                <li>1. Müşteriden <strong>indirim QR kodunu</strong> isteyin</li>
                <li>2. QR kodu okutun veya kodu manuel girin</li>
                <li>3. Kod doğrulandığında kampanya bilgilerini görün</li>
                <li>4. Hesap tutarını girin</li>
                <li>5. İndirimi uygula</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </MerchantLayout>
  );
}

