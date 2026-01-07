import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          // Prefer back camera, fallback to any camera (including Mac's built-in camera)
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          const facingCamera = devices.find(d => d.label.toLowerCase().includes('facetime') || d.label.toLowerCase().includes('camera'));
          setSelectedCamera(backCamera?.id || facingCamera?.id || devices[0].id);
        } else {
          onError?.('Kamera bulunamadı. Lütfen kamera izinlerini kontrol edin.');
        }
      })
      .catch((err) => {
        const errorMsg = err.name === 'NotAllowedError' 
          ? 'Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera erişimini açın.'
          : err.name === 'NotFoundError'
          ? 'Kamera bulunamadı. Cihazınızda kamera olduğundan emin olun.'
          : 'Kamera erişim hatası: ' + err.message;
        
        onError?.(errorMsg);
      });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      onError?.('Kamera bulunamadı. Lütfen kamera seçin.');
      return;
    }

    try {
      // Clean up any existing scanner first
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
          await html5QrCodeRef.current.clear();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
        html5QrCodeRef.current = null;
      }

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');
      
      // Use facingMode constraint directly with camera ID
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };
      
      await html5QrCodeRef.current.start(
        { facingMode: "environment" }, // Use facingMode instead of camera ID for iOS
        config,
        (decodedText, decodedResult) => {
          // Parse QR data
          try {
            const data = JSON.parse(decodedText);
            // Check if it's a discount code or user QR
            if (data.type === 'discount' && data.code) {
              onScan(data.code);
              stopScanning();
            } else if (data.userId) {
              // User QR code
              onScan(decodedText);
              stopScanning();
            } else {
              // Other JSON QR
              onScan(decodedText);
              stopScanning();
            }
          } catch (e) {
            // If not JSON, treat as plain code
            onScan(decodedText);
            stopScanning();
          }
        },
        (errorMessage) => {
          // Ignore scan errors (too frequent during scanning)
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera start error:', err);
      let errorMsg = 'Kamera başlatılamadı';
      
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Kamera izni reddedildi. Safari ayarlarından kamera erişimini açın.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Kamera bulunamadı. Lütfen başka bir kamera seçin.';
      } else if (err.name === 'NotReadableError') {
        errorMsg = 'Kamera kullanımda. Lütfen diğer uygulamaları kapatın.';
      } else if (err.message) {
        errorMsg += ': ' + err.message;
      }
      
      onError?.(errorMsg);
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = await html5QrCodeRef.current.getState();
        // Only stop if scanner is running (state 2 = SCANNING)
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
        // Force cleanup even if error occurs
        try {
          if (html5QrCodeRef.current) {
            html5QrCodeRef.current.clear();
            html5QrCodeRef.current = null;
          }
        } catch (clearErr) {
          console.error('Error clearing scanner:', clearErr);
        }
        setScanning(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera Selection */}
      {cameras.length > 1 && !scanning && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kamera Seç
          </label>
          <select
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label || `Kamera ${camera.id}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* QR Reader Container */}
      <div className="relative">
        <div
          id="qr-reader"
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{ minHeight: scanning ? '400px' : '0px' }}
        />
        
        {!scanning && (
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-gray-600 mb-4">QR Kodu Tara</p>
              <button
                onClick={startScanning}
                disabled={!selectedCamera}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all font-semibold"
              >
                Kamerayı Başlat
              </button>
            </div>
          </div>
        )}

        {scanning && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={stopScanning}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold shadow-lg"
            >
              Taramayı Durdur
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {scanning && (
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-sm text-emerald-800 text-center">
            📱 QR kodu kamera önüne tutun
          </p>
        </div>
      )}
    </div>
  );
}

