import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls;

    const startScanner = async () => {
      try {
        // Запускаем камеру (заднюю, если есть)
        controls = await codeReader.decodeFromVideoDevice(
          null, 
          videoRef.current, 
          (result, err) => {
            if (result) {
              onScan(result.getText()); // Передаем отсканированный текст наверх
              controls.stop();         // Останавливаем камеру
              onClose();               // Закрываем окно
            }
          }
        );
      } catch (err) {
        setError('Не удалось получить доступ к камере. Разрешите доступ в настройках.');
      }
    };

    startScanner();

    // Очистка при закрытии
    return () => {
      if (controls) controls.stop();
    };
  }, [onScan, onClose]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ padding: 15, textAlign: 'center' }}>
        <h3>Сканирование IMEI</h3>
        <p style={{ fontSize: 13, color: '#666' }}>Наведите камеру на штрихкод коробки</p>
        
        {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 250, backgroundColor: 'black', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Прицел по центру */}
          <div style={{ position: 'absolute', top: '20%', left: '10%', right: '10%', bottom: '20%', border: '2px solid #34c759', borderRadius: 10 }}></div>
        </div>
        
        <button className="btn-cancel" style={{ marginTop: 15 }} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}