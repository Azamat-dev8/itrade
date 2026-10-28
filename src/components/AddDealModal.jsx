import React from 'react';

export default function AddDealModal({
  showAddModal, selectedCategory, DEVICE_CATALOG, addForm, setAddForm,
  setPickerMode, setModelCategory, setShowModelPicker,
  addFormPhotos, setAddFormPhotos, uploadingAddPhoto, handleAddModalPhotoUpload, deletePhotosFromStorage,
  onClose, onSave, isActionLoading, haptic
}) {
  if (!showAddModal || !selectedCategory) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>+ Добавить в {selectedCategory}</h3>
        
        {selectedCategory !== 'Аксессуары' && DEVICE_CATALOG[selectedCategory] ? (
          <div className="input-field" onClick={() => { setPickerMode('addManual'); setModelCategory(selectedCategory); setShowModelPicker(true); haptic(); }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: addForm.model ? 'var(--text-main)' : 'var(--text-muted)' }}>{addForm.model || 'Выберите модель...'}</span>
            <span style={{ opacity: 0.5 }}>▼</span>
          </div>
        ) : (
          <input className="input-field" type="text" placeholder="Название (например, Стекло iPhone 15)" value={addForm.model} onChange={(e) => setAddForm({ ...addForm, model: e.target.value })} />
        )}
        
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input-field" type="text" inputMode="numeric" placeholder="Цена закупа (за 1 шт)" value={addForm.buy_price} onChange={(e) => setAddForm({ ...addForm, buy_price: e.target.value.replace(/[^\d]/g, '') })} style={{ flex: 1 }} />
          <input className="input-field" type="text" inputMode="numeric" placeholder="Кол-во" value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value.replace(/[^\d]/g, '') })} style={{ width: 90 }} />
        </div>
        
        <textarea className="input-field" placeholder="Описание (необязательно)" value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} style={{ minHeight: 60, resize: 'vertical' }} />
        
        <input className="input-field" type="text" placeholder="Место хранения (необязательно)" value={addForm.location} onChange={(e) => setAddForm({ ...addForm, location: e.target.value })} />
        
        {(selectedCategory === 'iPhone' || selectedCategory === 'iPad' || selectedCategory === 'MacBook' || selectedCategory === 'Apple Watch') && (
          <input className="input-field" type="text" placeholder="IMEI (необязательно)" value={addForm.imei} onChange={(e) => setAddForm({ ...addForm, imei: e.target.value })} />
        )}

        <div style={{ marginBottom: 15, marginTop: 5 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: 8 }}>Фото устройства (до 3 шт):</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {addFormPhotos.map((url, idx) => (
              <div key={idx} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => {
                  const urlToRemove = addFormPhotos[idx];
                  setAddFormPhotos(prev => prev.filter((_, i) => i !== idx));
                  deletePhotosFromStorage([urlToRemove]);
                }} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            {addFormPhotos.length < 3 && (
              <label style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, cursor: 'pointer', backgroundColor: 'rgba(0,122,255,0.05)', boxShadow: '0 0 10px rgba(0,122,255,0.1)' }}>
                {uploadingAddPhoto ? '...' : '+'}
                <input type="file" accept="image/*" multiple onChange={handleAddModalPhotoUpload} style={{ display: 'none' }} disabled={uploadingAddPhoto} />
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 }}>
          <label style={{ fontSize: 13, fontWeight: 'bold' }}>Учитывать в расчётах</label>
          <button onClick={() => { setAddForm({ ...addForm, is_accounted: !addForm.is_accounted }); haptic(); }} style={{ padding: '6px 12px', borderRadius: 20, background: addForm.is_accounted ? '#34c759' : '#e5e5ea', color: addForm.is_accounted ? '#fff' : '#000', border: 'none', fontWeight: 'bold' }}>
            {addForm.is_accounted ? 'ДА' : 'НЕТ'}
          </button>
        </div>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={onSave} disabled={isActionLoading}>{isActionLoading ? 'Сохранение...' : 'Добавить'}</button>
        </div>
      </div>
    </div>
  );
}