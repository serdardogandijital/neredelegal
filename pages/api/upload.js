import formidable from 'formidable';
import fs from 'fs';
import admin from '../../lib/firebase-admin';

// Next.js API config
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Bucket'ı handler içinde al (lazy initialization)
    const bucket = admin.storage().bucket();

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const fileArray = files.file;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    
    if (!file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    // Dosya boyutu kontrolü
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Dosya boyutu 5MB\'dan küçük olmalıdır' });
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Sadece JPG, PNG ve WebP formatları desteklenir' });
    }

    // Dosya adını oluştur
    const timestamp = Date.now();
    const sanitizedFileName = file.originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const uploadPath = Array.isArray(fields.path) ? fields.path[0] : (fields.path || 'uploads');
    const destination = `${uploadPath}/${fileName}`;

    // Dosyayı Firebase Storage'a yükle
    const [uploadedFile] = await bucket.upload(file.filepath, {
      destination: destination,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      },
      public: true,
    });

    // Public URL oluştur
    await uploadedFile.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    // Geçici dosyayı sil
    try {
      fs.unlinkSync(file.filepath);
    } catch (unlinkError) {
      // Silent fail - temp dosya zaten silinmiş olabilir
    }

    return res.status(200).json({ 
      success: true, 
      url: publicUrl,
      fileName: fileName 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Dosya yüklenirken hata oluştu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

