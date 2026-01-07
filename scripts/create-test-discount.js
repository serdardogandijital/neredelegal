const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Firebase Admin SDK'yı başlat
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../../neredeapp-68658-firebase-adminsdk-fbsvc-0e21e8c922.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account dosyası bulunamadı:', serviceAccountPath);
  console.log('💡 Lütfen Firebase service account JSON dosyasını şu yola koyun:');
  console.log('   /Users/ajanszero/Documents/codes/nerede/neredeapp-68658-firebase-adminsdk-fbsvc-0e21e8c922.json');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'neredeapp-68658.firebasestorage.app'
  });
}

const db = admin.firestore();

async function createTestDiscount() {
  try {
    console.log('🚀 Test indirim kodu oluşturuluyor...');
    
    // Önce bir merchant bulalım
    const merchantsSnapshot = await db.collection('users').where('role', '==', 'merchant').limit(1).get();
    
    if (merchantsSnapshot.empty) {
      console.error('❌ Sistemde hiç merchant bulunamadı!');
      process.exit(1);
    }
    
    const merchantDoc = merchantsSnapshot.docs[0];
    const merchantId = merchantDoc.id;
    const merchantData = merchantDoc.data();
    
    console.log('✅ Merchant bulundu:', merchantData.name || merchantData.email);
    console.log('🆔 Merchant ID:', merchantId);
    
    // Merchant'ın bir venue'sunu bulalım
    const venuesSnapshot = await db.collection('venues').where('merchantId', '==', merchantId).limit(1).get();
    
    let venueId = 'test_venue';
    let venueName = 'Test Mekanı';
    
    if (!venuesSnapshot.empty) {
      const venueDoc = venuesSnapshot.docs[0];
      venueId = venueDoc.id;
      venueName = venueDoc.data().name;
      console.log('✅ Venue bulundu:', venueName);
    } else {
      console.log('⚠️  Merchant\'ın venue\'su yok, test verisi kullanılıyor');
    }

    const testDiscountData = {
      code: 'DISC-TEST-1234-ABCD',
      userId: 'test_user_id',
      userName: 'Test Kullanıcı',
      userPhone: '+905551234567',
      campaignId: 'test_campaign_id',
      campaignName: 'Test Kampanyası',
      venueId: venueId,
      venueName: venueName,
      merchantId: merchantId,
      discountType: 'percentage',
      discountValue: 20,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
      usedAt: null
    };

    // Firestore'a ekle (collection adı: discount_codes)
    const docRef = await db.collection('discount_codes').add(testDiscountData);
    
    console.log('\n✅ Test indirim kodu başarıyla oluşturuldu!');
    console.log('📄 Document ID:', docRef.id);
    console.log('🎫 Kod:', testDiscountData.code);
    console.log('💰 İndirim:', `%${testDiscountData.discountValue}`);
    console.log('🏢 Merchant ID:', testDiscountData.merchantId);
    console.log('📍 Mekan:', testDiscountData.venueName, `(${testDiscountData.venueId})`);
    console.log('👤 Kullanıcı:', testDiscountData.userName);
    console.log('📅 Son kullanma:', testDiscountData.expiresAt.toLocaleDateString('tr-TR'));
    console.log('\n💡 Bu kodu test etmek için:', merchantData.email, 'ile giriş yapın');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

createTestDiscount();

