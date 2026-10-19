import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const videoTrackRef = useRef(null);
  const controlsRef = useRef(null);
  const isScannedRef = useRef(false); 
  
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('Наведите камеру на штрихкод IMEI');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [screenLightOn, setScreenLightOn] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let localStream = null;

    const startScanner = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        const track = localStream.getVideoTracks()[0];
        videoTrackRef.current = track;

        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) setHasTorch(true);

        controlsRef.current = await codeReader.decodeFromStream(
          localStream,
          videoRef.current,
          (result, err) => {
            if (result && !isScannedRef.current) {
              const cleanText = result.getText().replace(/\D/g, '');

              if (cleanText.length === 15) {
                isScannedRef.current = true; 
                if (track.getCapabilities()?.torch) {
                  track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }
                onScan(cleanText); // Передаем наверх, окно закроет React
              } else {
                setScanStatus('Это не IMEI. Ищем дальше...');
                setTimeout(() => {
                  if (!isScannedRef.current) setScanStatus('Наведите камеру на штрихкод IMEI');
                }, 2000);
              }
            }
          }
        );
      } catch (err) {
        setError('Не удалось открыть камеру. Попробуйте еще раз.');
      }
    };

    startScanner();

    // ПОЛНАЯ ОЧИСТКА
    return () => {
      isScannedRef.current = true;
      if (controlsRef.current) try { controlsRef.current.stop(); } catch (e) {}
      if (localStream) localStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
      if (videoRef.current && videoRef.current.srcObject) {
         videoRef.current.srcObject.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
         videoRef.current.srcObject = null;
      }
    };
  }, [onScan]);

  const toggleTorch = async () => {
    if (videoTrackRef.current && hasTorch) {
      try {
        const newTorchState = !isTorchOn;
        await videoTrackRef.current.applyConstraints({ advanced: [{ torch: newTorchState }] });
        setIsTorchOn(newTorchState);
      } catch (err) {}
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ 
        padding: 15, textAlign: 'center',
        backgroundColor: screenLightOn ? '#ffffff' : 'var(--card-bg)',
      }}>
        <h3 style={{ color: screenLightOn ? '#000' : 'var(--text-main)' }}>Сканирование IMEI</h3>
        <p style={{ fontSize: 13, color: screenLightOn ? '#333' : 'var(--text-muted)', minHeight: 18 }}>
          {scanStatus}
        </p>
        
        {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 250, backgroundColor: 'black', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
          <div style={{ position: 'absolute', top: '25%', left: '10%', right: '10%', bottom: '25%', border: '2px solid #34c759', borderRadius: 10 }}></div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 15, flexWrap: 'wrap' }}>
          {hasTorch && (
            <button onClick={toggleTorch} style={{ flex: '1 0 40%', padding: '14px', backgroundColor: isTorchOn ? '#ff9500' : '#e5e5ea', color: isTorchOn ? 'white' : 'black', border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16 }}>
              {isTorchOn ? '🔦 Выкл' : '🔦 Вкл'}
            </button>
          )}
          <button onClick={() => setScreenLightOn(!screenLightOn)} style={{ flex: '1 0 40%', padding: '14px', backgroundColor: screenLightOn ? '#fff' : '#e5e5ea', color: screenLightOn ? '#000' : 'black', border: '1px solid #ccc', borderRadius: 12, fontWeight: 'bold', fontSize: 16 }}>
            💡 Экран
          </button>
          <button className="btn-cancel" style={{ flex: '1 0 100%', padding: '14px' }} onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}