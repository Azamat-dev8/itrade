import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const videoTrackRef = useRef(null);
  const controlsRef = useRef(null); // Сохраняем контролы в ref, чтобы иметь к ним доступ при очистке
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('Наведите камеру на штрихкод IMEI');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [screenLightOn, setScreenLightOn] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        const track = stream.getVideoTracks()[0];
        videoTrackRef.current = track;

        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }

        controlsRef.current = await codeReader.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (result) {
              const rawText = result.getText();
              const cleanText = rawText.replace(/\D/g, '');

              if (cleanText.length === 15) {
                // ПРИНУДИТЕЛЬНО ВЫКЛЮЧАЕМ ФОНАРИК ПЕРЕД ЗАКРЫТИЕМ
                if (track.getCapabilities()?.torch) {
                  track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }
                
                onScan(cleanText);
                controlsRef.current.stop();
                track.stop();
                onClose();
              } else {
                setScanStatus('Это не IMEI. Ищем дальше...');
                setTimeout(() => setScanStatus('Наведите камеру на штрихкод IMEI'), 2000);
              }
            }
          }
        );
      } catch (err) {
        setError('Не удалось получить доступ к камере.');
      }
    };

    startScanner();

    // ОЧИСТКА ПРИ ЗАКРЫТИИ (нажатие на "Отмена" или свайп)
    return () => {
      if (videoTrackRef.current) {
        // Если фонарик поддерживается, принудительно выключаем его перед остановкой камеры
        if (videoTrackRef.current.getCapabilities()?.torch) {
          videoTrackRef.current.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
        }
        videoTrackRef.current.stop();
      }
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [onScan, onClose]);

  const toggleTorch = async () => {
    if (videoTrackRef.current && hasTorch) {
      try {
        const newTorchState = !isTorchOn;
        await videoTrackRef.current.applyConstraints({
          advanced: [{ torch: newTorchState }]
        });
        setIsTorchOn(newTorchState);
      } catch (err) {
        console.error("Ошибка фонарика:", err);
      }
    }
  };

  const toggleScreenLight = () => {
    setScreenLightOn(!screenLightOn);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ 
        padding: 15, 
        textAlign: 'center',
        backgroundColor: screenLightOn ? '#ffffff' : 'var(--card-bg)',
        transition: 'background-color 0.2s'
      }}>
        <h3 style={{ color: screenLightOn ? '#000' : 'var(--text-main)' }}>Сканирование IMEI</h3>
        <p style={{ fontSize: 13, color: screenLightOn ? '#333' : 'var(--text-muted)', minHeight: 18 }}>
          {scanStatus}
        </p>
        
        {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 250, backgroundColor: 'black', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '25%', left: '10%', right: '10%', bottom: '25%', border: '2px solid #34c759', borderRadius: 10 }}></div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 15, flexWrap: 'wrap' }}>
          {hasTorch && (
            <button 
              onClick={toggleTorch}
              style={{ 
                flex: '1 0 40%', padding: '14px', 
                backgroundColor: isTorchOn ? '#ff9500' : '#e5e5ea', 
                color: isTorchOn ? 'white' : 'black', 
                border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16 
              }}
            >
              {isTorchOn ? '🔦 Выкл' : '🔦 Вкл'}
            </button>
          )}
          
          <button 
            onClick={toggleScreenLight}
            style={{ 
              flex: '1 0 40%', padding: '14px', 
              backgroundColor: screenLightOn ? '#fff' : '#e5e5ea', 
              color: screenLightOn ? '#000' : 'black', 
              border: '1px solid #ccc', borderRadius: 12, fontWeight: 'bold', fontSize: 16 
            }}
          >
            💡 Экран
          </button>

          <button 
            className="btn-cancel" 
            style={{ flex: '1 0 100%', padding: '14px' }} 
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
        
        {screenLightOn && (
          <p style={{ fontSize: 12, color: '#666', marginTop: 10 }}>
            Направьте белый экран на штрихкод для подсветки.
          </p>
        )}
      </div>
    </div>
  );
}