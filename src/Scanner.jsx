//aaaaaa
import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X } from 'lucide-react';

const Scanner = ({ onScan, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    
    // Запрашиваем камеру с высоким разрешением для 1D штрих-кодов
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        focusMode: 'continuous'
      }
    };

    codeReader.decodeFromConstraints(constraints, videoRef.current, (result, err) => {
      if (result) {
        const text = result.getText();
        // IMEI всегда 15 цифр
        if (/^\d{15}$/.test(text)) {
          onScan(text);
          codeReader.reset();
        }
      }
    }).catch(err => console.error(err));

    return () => codeReader.reset();
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      <div className="absolute top-8 right-8 z-[210]">
        <button onClick={onClose} className="p-3 bg-white/20 rounded-full text-white">
          <X size={30} />
        </button>
      </div>
      
      {/* Сетка наведения */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-72 h-40 border-2 border-blue-500 rounded-3xl relative">
          <div className="absolute -top-10 left-0 right-0 text-center text-white text-sm font-bold animate-pulse">
            Наведите на штрих-код IMEI
          </div>
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/50 shadow-[0_0_10px_red]"></div>
        </div>
        <p className="mt-8 text-gray-400 text-xs px-10 text-center">
          Держите камеру параллельно штрих-коду. Считывание произойдет автоматически при нахождении 15-значного кода.
        </p>
      </div>

      <video 
        ref={videoRef} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default Scanner;