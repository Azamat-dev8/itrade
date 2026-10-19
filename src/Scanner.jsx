import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function Scanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('Наведите камеру на штрихкод IMEI');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls;

    const startScanner = async () => {
      try {
        controls = await codeReader.decodeFromVideoDevice(
          null, 
          videoRef.current, 
          (result, err) => {
            if (result) {
              const rawText = result.getText();
              
              // Очищаем текст от всех символов, кроме цифр
              const cleanText = rawText.replace(/\D/g, '');

              // Проверяем, что это ровно 15 цифр (стандарт IMEI)
              if (cleanText.length === 15) {
                onScan(cleanText); // Передаем чистый IMEI наверх
                controls.stop();   // Останавливаем камеру
                onClose();         // Закрываем окно
              } else {
                // Если это S/N или UPS, показываем подсказку и сканируем дальше
                setScanStatus('Это не IMEI. Ищем дальше...');
                setTimeout(() => setScanStatus('Наведите камеру на штрихкод IMEI'), 2000);
              }
            }
          }
        );
      } catch (err) {
        setError('Не удалось получить доступ к камере. Разрешите доступ в настройках.');
      }
    };

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [onScan, onClose]);

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ padding: 15, textAlign: 'center' }}>
        <h3>Сканирование IMEI</h3>
        <p style={{ fontSize: 13, color: scanStatus.includes('не IMEI') ? '#ff3b30' : '#666' }}>
          {scanStatus}
        </p>
        
        {error && <p style={{ color: 'red', fontSize: 12 }}>{error}</p>}
        
        <div style={{ position: 'relative', width: '100%', height: 250, backgroundColor: 'black', borderRadius: 10, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {/* Прицел по центру */}
          <div style={{ position: 'absolute', top: '25%', left: '10%', right: '10%', bottom: '25%', border: '2px solid #34c759', borderRadius: 10 }}></div>
        </div>
        
        <button className="btn-cancel" style={{ marginTop: 15 }} onClick={onClose}>
          Отмена
        </button>
      </div>
    </div>
  );
}