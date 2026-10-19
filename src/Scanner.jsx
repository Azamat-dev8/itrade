import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const videoTrackRef = useRef(null);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('Наведите камеру на штрихкод IMEI');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls;

    const startScanner = async () => {
      try {
        // Запрашиваем камеру вручную, чтобы получить доступ к видеопотоку
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        // Получаем видеодорожку
        const track = stream.getVideoTracks()[0];
        videoTrackRef.current = track;

        // Проверяем, поддерживает ли устройство фонарик (в основном Android)
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          setHasTorch(true);
        }

        // Запускаем сканер на полученном потоке
        controls = await codeReader.decodeFromStream(
          stream,
          videoRef.current,
          (result, err) => {
            if (result) {
              const rawText = result.getText();
              const cleanText = rawText.replace(/\D/g, '');

              if (cleanText.length === 15) {
                onScan(cleanText);
                controls.stop();
                track.stop(); // Выключаем камеру
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

    // Очистка при закрытии
    return () => {
      if (controls) controls.stop();
      if (videoTrackRef.current) videoTrackRef.current.stop();
    };
  }, [onScan, onClose]);

  // Функция переключения фонарика
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

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ padding: 15, textAlign: 'center' }}>
        <h3>Сканирование IMEI</h3>
        <p style={{ fontSize: 13, color: scanStatus.includes('не IMEI') ? '#ff3b30' : '#666', minHeight: 18 }}>
          {scanStatus}
        </p>
        
        {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 250, backgroundColor: 'black', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: '25%', left: '10%', right: '10%', bottom: '25%', border: '2px solid #34c759', borderRadius: 10 }}></div>
        </div>
        
        {/* Кнопки под камерой */}
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          {hasTorch && (
            <button 
              onClick={toggleTorch}
              style={{ 
                flex: 1, padding: '14px', 
                backgroundColor: isTorchOn ? '#ff9500' : '#e5e5ea', 
                color: isTorchOn ? 'white' : 'black', 
                border: 'none', borderRadius: 12, fontWeight: 'bold', fontSize: 16 
              }}
            >
              {isTorchOn ? '🔦 Выкл' : '🔦 Вкл'}
            </button>
          )}
          
          <button 
            className="btn-cancel" 
            style={{ flex: hasTorch ? 1 : 2 }} 
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}