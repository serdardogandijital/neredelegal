import admin from '../../../lib/firebase-admin';

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;

    console.log('🔍 Validating discount code:', code);

    if (!code) {
      return res.status(400).json({
        valid: false,
        message: 'Kod gerekli'
      });
    }

    // Find discount code
    const codesRef = db.collection('discount_codes');
    const snapshot = await codesRef.where('code', '==', code).get();
    
    console.log('📊 Query result:', { empty: snapshot.empty, size: snapshot.size });

    if (snapshot.empty) {
      return res.status(200).json({
        valid: false,
        message: 'Geçersiz kod'
      });
    }

    const codeDoc = snapshot.docs[0];
    const codeData = codeDoc.data();

    // Check status
    if (codeData.status !== 'active') {
      return res.status(200).json({
        valid: false,
        message: codeData.status === 'used' ? 'Bu kod zaten kullanıldı' : 'Kod geçersiz'
      });
    }

    // Check expiry
    const validUntil = codeData.validUntil?.toDate() || new Date();
    const now = new Date();

    if (now > validUntil) {
      // Mark as expired
      await codeDoc.ref.update({
        status: 'expired',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        valid: false,
        message: 'Kodun süresi dolmuş'
      });
    }

    // Return valid code data
    console.log('✅ Code is valid:', codeDoc.id);
    return res.status(200).json({
      valid: true,
      data: {
        id: codeDoc.id,
        code: codeData.code,
        userId: codeData.userId,
        userName: codeData.userName,
        userPhone: codeData.userPhone,
        campaignId: codeData.campaignId,
        campaignName: codeData.campaignName,
        venueId: codeData.venueId,
        venueName: codeData.venueName,
        merchantId: codeData.merchantId,
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        validUntil: validUntil.toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Validation error:', error);
    return res.status(500).json({
      valid: false,
      message: 'Doğrulama hatası',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

