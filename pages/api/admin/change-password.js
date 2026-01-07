import admin from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, newPassword, adminToken } = req.body;

    if (!userId || !newPassword || !adminToken) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify admin token
    const decodedToken = await admin.auth().verifyIdToken(adminToken);
    
    // Check if user is admin
    const adminUser = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    
    if (!adminUser.exists || adminUser.data().role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Update user password
    await admin.auth().updateUser(userId, {
      password: newPassword,
    });

    // Log the password change
    await admin.firestore().collection('admin_logs').add({
      action: 'password_change',
      adminId: decodedToken.uid,
      adminEmail: decodedToken.email,
      targetUserId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to change password', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

