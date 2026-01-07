import admin from '../../../lib/firebase-admin';

const db = admin.firestore();

// Send push notification via Expo
async function sendPushNotification(pushToken, { title, body, data }) {
  try {
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    // Silent fail - notification is not critical
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { codeId, billAmount, merchantId } = req.body;
    
    console.log('🎫 Using discount code:', { codeId, billAmount, merchantId });

    if (!codeId || !billAmount || !merchantId) {
      return res.status(400).json({
        success: false,
        message: 'Eksik parametreler'
      });
    }

    // Get code
    const codeRef = db.collection('discount_codes').doc(codeId);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Kod bulunamadı'
      });
    }

    const codeData = codeDoc.data();

    // Verify merchant
    if (codeData.merchantId !== merchantId) {
      return res.status(403).json({
        success: false,
        message: 'Bu kod bu işletme için geçerli değil'
      });
    }

    // Check if already used
    if (codeData.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Kod zaten kullanılmış veya geçersiz'
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (codeData.discountType === 'percentage') {
      discountAmount = (billAmount * codeData.discountValue) / 100;
    } else {
      discountAmount = codeData.discountValue;
    }

    // Make sure discount doesn't exceed bill amount
    if (discountAmount > billAmount) {
      discountAmount = billAmount;
    }

    const finalAmount = billAmount - discountAmount;

    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      // FIRST: Do all reads
      let campaignExists = false;
      let campaignRef = null;
      
      if (codeData.campaignId) {
        campaignRef = db.collection('campaigns').doc(codeData.campaignId);
        const campaignDoc = await transaction.get(campaignRef);
        campaignExists = campaignDoc.exists;
        
        if (!campaignExists) {
          console.log('⚠️ Campaign not found, skipping campaign update:', codeData.campaignId);
        }
      }
      
      // THEN: Do all writes
      // Update code
      transaction.update(codeRef, {
        status: 'used',
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        usedAmount: discountAmount,
        billAmount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update campaign usage (only if campaign exists)
      if (campaignExists && campaignRef) {
        transaction.update(campaignRef, {
          usageCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Create usage record
      const usageRef = db.collection('discount_usage').doc();
      transaction.set(usageRef, {
        codeId,
        userId: codeData.userId,
        userName: codeData.userName,
        merchantId,
        venueId: codeData.venueId,
        venueName: codeData.venueName,
        campaignId: codeData.campaignId,
        campaignName: codeData.campaignName,
        billAmount,
        discountAmount,
        finalAmount,
        discountType: codeData.discountType,
        discountValue: codeData.discountValue,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Send push notification to user
    try {
      const userDoc = await db.collection('users').doc(codeData.userId).get();
      const userData = userDoc.data();
      
      if (userData?.pushToken) {
        await sendPushNotification(userData.pushToken, {
          title: '✅ İndiriminiz Kullanıldı!',
          body: `${codeData.venueName} - ${discountAmount.toFixed(2)} TL indirim uygulandı`,
          data: {
            type: 'discount_used',
            discountAmount,
            finalAmount,
            venueName: codeData.venueName,
          },
        });
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
    }

    return res.status(200).json({
      success: true,
      discountAmount,
      finalAmount,
      message: 'İndirim başarıyla uygulandı'
    });
  } catch (error) {
    console.error('❌ Error using discount:', error);
    return res.status(500).json({
      success: false,
      message: 'İşlem hatası',
      error: error.message
    });
  }
}

