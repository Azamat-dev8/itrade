import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const videoTrackRef = useRef(null);
  const controlsRef = useRef(null);
  const isScannedRef = useRef(false); 
  
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('Поместите штрихкод IMEI в рамку');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    // Используем стандартный ридер, он поддерживает всё, но мы ускорим его через настройки камеры
    const codeReader = new BrowserMultiFormatReader();
    let localStream = null;

    const startScanner = async () => {
      try {
        // Запрашиваем Full HD разрешение, чтобы тонкие линии IMEI были четкими
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        });

        const track = localStream.getVideoTracks()[0];
        videoTrackRef.current = track;

        // Включаем автофокус, если железо позволяет
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          await track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          }).catch(() => {});
        }
        
        if (capabilities.torch) setHasTorch(true);

        controlsRef.current = await codeReader.decodeFromStream(
          localStream,
          videoRef.current,
          (result) => {
            if (result && !isScannedRef.current) {
              const text = result.getText();
              const cleanText = text.replace(/\D/g, ''); // Только цифры

              if (cleanText.length === 15) {
                isScannedRef.current = true; 
                
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }

                if (videoTrackRef.current?.getCapabilities()?.torch) {
                  videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }

                onScan(cleanText);
              }
            }
          }
        );
      } catch (err) {
        console.error("Camera error:", err);
        setError('Ошибка камеры. Разрешите доступ в настройках.');
      }
    };

    startScanner();

    return () => {
      isScannedRef.current = true;
      if (controlsRef.current) try { controlsRef.current.stop(); } catch (e) {}
      if (localStream) localStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
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
      <div className="modal-content" style={{ padding: 15, textAlign: 'center', backgroundColor: 'var(--card-bg)', borderRadius: 24 }}>
        <h3 style={{ color: 'var(--text-main)', margin: '10px 0' }}>Сканер IMEI</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 15 }}>{scanStatus}</p>
        
        {error && <p style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 280, backgroundColor: 'black', borderRadius: 16, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
          
          {/* Рамка прицела */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '10%',
            right: '10%',
            height: '60px',
            transform: 'translateY(-50%)',
            border: '2px solid #34c759',
            borderRadius: '12px',
            boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#ff3b30', opacity: 0.7, boxShadow: '0 0 8px #ff3b30' }}></div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {hasTorch && (
            <button onClick={toggleTorch} style={{ flex: 1, padding: '14px', backgroundColor: isTorchOn ? 'var(--warning)' : 'var(--bg-color)', color: isTorchOn ? 'white' : 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 'bold' }}>
              {isTorchOn ? '🔦 Выкл' : '🔦 Фонарик'}
            </button>
          )}
          <button className="btn-cancel" style={{ flex: 1, padding: '14px' }} onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}