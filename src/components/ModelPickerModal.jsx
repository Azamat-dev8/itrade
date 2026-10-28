import React from 'react';

export default function ModelPickerModal({
  showModelPicker, pickerMode, setShowModelPicker,
  modelSearch, setModelSearch, modelCategory, setModelCategory,
  DEVICE_CATALOG, filterModels, handleModelSelect
}) {
  if (!showModelPicker) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginTop: 0 }}>{pickerMode === 'purchase' ? 'Выберите устройство' : pickerMode === 'addManual' ? 'Выберите модель' : 'Выберите модели'}</h3>
        <input className="input-field" type="text" placeholder="Поиск..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} style={{ marginBottom: 10 }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 10, marginBottom: 10, justifyContent: 'center' }}>
          {Object.keys(DEVICE_CATALOG).map(cat => (
            <button key={cat} onClick={() => setModelCategory(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', backgroundColor: modelCategory === cat ? 'var(--accent)' : 'var(--bg-color)', color: modelCategory === cat ? '#fff' : 'var(--text-main)', fontWeight: 'bold', fontSize: 13 }}>{cat}</button>
          ))}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {(DEVICE_CATALOG[modelCategory] || []).filter(m => String(m).toLowerCase().includes(modelSearch.toLowerCase())).map(m => {
            const isSelected = pickerMode !== 'purchase' && pickerMode !== 'addManual' && filterModels.includes(m);
            return (
              <div key={m} onClick={() => handleModelSelect(m)} style={{ padding: '12px 16px', backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-color)', color: isSelected ? 'white' : 'var(--text-main)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, display: 'flex', justifyContent: 'space-between' }}>
                {m}{isSelected && <span>✓</span>}
              </div>
            )
          })}
        </div>
        
        <div className="modal-actions" style={{ marginTop: 15 }}>
          <button className="btn-primary" onClick={() => setShowModelPicker(false)}>
            {pickerMode === 'purchase' || pickerMode === 'addManual' ? 'Отмена' : 'Готово'}
          </button>
        </div>
      </div>
    </div>
  );
}