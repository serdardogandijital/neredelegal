import admin from '../../../lib/firebase-admin';

async function verifyAdminRequest(adminToken) {
  if (!adminToken) {
    throw new Error('Admin token eksik');
  }

  const decodedToken = await admin.auth().verifyIdToken(adminToken);
  const adminDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new Error('Yetkisiz erişim');
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email,
    name: adminDoc.data().name || decodedToken.email,
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { adminToken, user } = req.body || {};

      if (!user?.email || !user?.password) {
        return res.status(400).json({ error: 'E-posta ve şifre gereklidir' });
      }

      if (user.password.length < 6) {
        return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
      }

      const adminUser = await verifyAdminRequest(adminToken);

      const userParams = {
        email: user.email.toLowerCase(),
        password: user.password,
        displayName: user.name?.trim() || undefined,
      };

      if (user.phone && user.phone.trim().startsWith('+')) {
        userParams.phoneNumber = user.phone.trim();
      }

      const createdUser = await admin.auth().createUser(userParams);

      await admin.firestore().collection('users').doc(createdUser.uid).set({
        name: user.name?.trim() || '',
        email: user.email.toLowerCase(),
        phone: user.phone?.trim() || null,
        role: user.role || 'user',
        city: user.city?.trim() || '',
        points: user.points ?? 0,
        level: user.level ?? 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: {
          uid: adminUser.uid,
          email: adminUser.email,
          name: adminUser.name || null,
        },
      });

      await admin.firestore().collection('admin_logs').add({
        action: 'create_user',
        adminId: adminUser.uid,
        adminEmail: adminUser.email,
        targetUserId: createdUser.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({
        success: true,
        user: {
          uid: createdUser.uid,
          email: createdUser.email,
          name: user.name || '',
          role: user.role || 'user',
        },
      });
    }

    if (req.method === 'DELETE') {
      const { adminToken, userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({ error: 'Kullanıcı ID gereklidir' });
      }

      const requester = await verifyAdminRequest(adminToken);

      if (userId === requester.uid) {
        return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
      }

      await admin.auth().deleteUser(userId).catch((err) => {
        if (err.code !== 'auth/user-not-found') {
          throw err;
        }
      });

      await admin.firestore().collection('users').doc(userId).delete();

      await admin.firestore().collection('admin_logs').add({
        action: 'delete_user',
        adminId: requester.uid,
        adminEmail: requester.email,
        targetUserId: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({
      error: error.message || 'İşlem başarısız oldu',
    });
  }
}
