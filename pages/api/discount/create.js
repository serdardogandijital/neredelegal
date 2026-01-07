import admin from '../../../lib/firebase-admin';

const db = admin.firestore();

// Generate unique discount code
function generateCode(venueId, userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DISC-${venueId.substring(0, 4)}-${userId.substring(0, 4)}-${random}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, merchantId } = req.body;

    console.log('🎁 Creating discount for user:', userId, 'merchant:', merchantId);

    if (!userId || !merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Kullanıcı ID ve İşletme ID gerekli'
      });
    }

    // Get user info
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    const userData = userDoc.data();
    console.log('👤 User found:', userData.name);

    // Get merchant's first venue
    const venuesSnapshot = await db.collection('venues')
      .where('merchantId', '==', merchantId)
      .limit(1)
      .get();

    if (venuesSnapshot.empty) {
      return res.status(404).json({
        success: false,
        message: 'İşletmeye ait mekan bulunamadı'
      });
    }

    const venueDoc = venuesSnapshot.docs[0];
    const venueData = venueDoc.data();
    console.log('🏪 Venue found:', venueData.name);

    // Generate code
    const code = generateCode(venueDoc.id, userId);
    const codeId = `${userId}_instant_${Date.now()}`;

    // Calculate validity (24 hours from now)
    const validFrom = admin.firestore.Timestamp.now();
    const validUntil = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    // Create discount code
    const discountData = {
      code,
      userId,
      userName: userData.name || 'Kullanıcı',
      userPhone: userData.phone || '',
      
      campaignId: 'instant_discount',
      campaignName: 'Anlık İndirim',
      campaignType: 'instant',
      
      venueId: venueDoc.id,
      venueName: venueData.name,
      merchantId,
      
      discountType: 'percentage',
      discountValue: 10, // %10 indirim
      discount: '%10 İndirim',
      
      status: 'active',
      
      validFrom,
      validUntil,
      
      usedAt: null,
      usedAmount: null,
      
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('discount_codes').doc(codeId).set(discountData);
    console.log('✅ Discount code created:', code);

    // Send push notification to user
    try {
      if (userData.pushToken) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: userData.pushToken,
            sound: 'default',
            title: '🎉 İndirim Kodunuz Hazır!',
            body: `${venueData.name} - %10 indirim kodunuz oluşturuldu`,
            data: {
              type: 'discount_created',
              code,
              venueName: venueData.name,
            },
          }),
        });
        console.log('📱 Push notification sent');
      }
    } catch (notifError) {
      console.log('⚠️ Push notification failed:', notifError.message);
      // Don't fail the request
    }

    return res.status(200).json({
      success: true,
      code,
      codeId,
      message: 'İndirim kodu oluşturuldu',
      data: {
        code,
        userName: userData.name,
        venueName: venueData.name,
        discount: '%10 İndirim',
        validUntil: validUntil.toDate().toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Create discount error:', error);
    return res.status(500).json({
      success: false,
      message: 'İndirim kodu oluşturulurken hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

