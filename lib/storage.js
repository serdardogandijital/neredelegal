// Server-side upload kullanarak CORS sorununu bypass et
export const uploadFile = async (file, path) => {
  try {
    console.log('Upload başladı:', file.name, file.size, file.type);
    
    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Sadece JPG, PNG ve WebP formatları desteklenir');
    }

    // FormData oluştur
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    console.log('Server\'a gönderiliyor...');

    // API endpoint'e gönder
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorMessage = 'Yükleme başarısız';
      
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } else {
        const text = await response.text();
        console.error('Server response:', text);
        errorMessage = `Server hatası (${response.status})`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Upload başarılı:', data.url);
    
    return data.url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Çoklu dosya yükleme
export const uploadMultipleFiles = async (files, path) => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadFile(file, path));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

