import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/browser';

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
    // Настраиваем подсказки для ZXing: ищем ТОЛЬКО штрихкоды (Code 128 / Code 39 / EAN), а не QR
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.EAN_13,
      BarcodeFormat.ITF
    ]);

    const codeReader = new BrowserMultiFormatReader(hints);
    let localStream = null;

    const startScanner = async () => {
      try {
        // Запрашиваем ВЫСОКОЕ разрешение, чтобы тонкие линии IMEI не размывались
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [{ focusMode: 'continuous' }]
          }
        });

        const track = localStream.getVideoTracks()[0];
        videoTrackRef.current = track;

        // Включаем непрерывный автофокус если поддержано железом
        if (track.applyConstraints) {
          track.applyConstraints({
            advanced: [{ focusMode: 'continuous' }]
          }).catch(() => {});
        }

        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if (capabilities.torch) setHasTorch(true);

        controlsRef.current = await codeReader.decodeFromStream(
          localStream,
          videoRef.current,
          (result) => {
            if (result && !isScannedRef.current) {
              const text = result.getText();
              const cleanText = text.replace(/\D/g, ''); // Оставляем только цифры

              // Если нашли 15 цифр (IMEI)
              if (cleanText.length === 15) {
                isScannedRef.current = true; 
                
                // Вибрация успеха
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                }

                // Выключаем фонарик перед закрытием
                if (track.getCapabilities()?.torch) {
                  track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                }

                onScan(cleanText);
              } else if (cleanText.length > 10) {
                setScanStatus('Найден штрихкод, но это не IMEI...');
              }
            }
          }
        );
      } catch (err) {
        console.error("Camera error:", err);
        setError('Не удалось открыть камеру в высоком разрешении. Разрешите доступ к камере.');
      }
    };

    startScanner();

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
      <div className="modal-content" style={{ padding: 15, textAlign: 'center', backgroundColor: 'var(--card-bg)' }}>
        <h3 style={{ color: 'var(--text-main)', marginTop: 5, marginBottom: 5 }}>Сканер IMEI</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 15, minHeight: 18 }}>
          {scanStatus}
        </p>
        
        {error && <p style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 10 }}>{error}</p>}
        
        {/* Окно видоискателя с узким горизонтальным прицелом */}
        <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: 'black', borderRadius: 16, overflow: 'hidden' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
          
          {/* Горизонтальный прицел под длинный штрихкод IMEI */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            right: '5%',
            height: '70px',
            transform: 'translateY(-50%)',
            border: '2px solid #34c759',
            borderRadius: '12px',
            boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center'
          }}>
            {/* Лазерная красная линия по центру */}
            <div style={{ width: '90%', height: '2px', backgroundColor: '#ff3b30', opacity: 0.8, boxShadow: '0 0 8px #ff3b30' }}></div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
          {hasTorch && (
            <button onClick={toggleTorch} style={{ flex: 1, padding: '14px', backgroundColor: isTorchOn ? 'var(--warning)' : 'var(--bg-color)', color: isTorchOn ? 'white' : 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 'bold', fontSize: 15 }}>
              {isTorchOn ? '🔦 Фонарик ВКЛ' : '🔦 Фонарик'}
            </button>
          )}
          <button className="btn-cancel" style={{ flex: 1, padding: '14px' }} onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}