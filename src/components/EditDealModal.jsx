import React from 'react';

export default function EditDealModal({
  editingDeal, editModel, setEditModel, editBuyPrice, setEditBuyPrice,
  editImei, setEditImei, editSellerId, setEditSellerId, editLocation, setEditLocation,
  editDescription, setEditDescription, editPhotos, setEditPhotos,
  uploadingEditPhoto, handleEditPhotoUpload, deletePhotosFromStorage,
  contacts, onClose, onSave, isActionLoading, handleOpenScanner
}) {
  if (!editingDeal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>Редактировать: {editingDeal.model}</h3>

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Модель</label>
        <input className="input-field" type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)} />

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цена закупа (₽)</label>
        <input className="input-field" type="text" inputMode="numeric" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value.replace(/[^\d]/g, ''))} />

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>IMEI</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input className="input-field" type="text" placeholder="IMEI" value={editImei} onChange={(e) => setEditImei(e.target.value)} style={{ marginBottom: 0, paddingRight: 35 }} />
            {editImei && <button type="button" onClick={() => setEditImei('')} style={{ position: 'absolute', right: 10, top: 14, background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>✕</button>}
          </div>
          <button type="button" onClick={() => handleOpenScanner('purchase')} className="scanner-btn">📷</button>
        </div>

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Кто продал</label>
        <select className="input-field" value={editSellerId} onChange={(e) => setEditSellerId(e.target.value)}>
          <option value="">Не указан</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
        </select>

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Место хранения</label>
        <input className="input-field" type="text" placeholder="Место хранения" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />

        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Описание</label>
        <textarea className="input-field" placeholder="Описание" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} />

        <div style={{ marginBottom: 15, marginTop: 5 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: 8 }}>Фото устройства (до 3 шт):</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {editPhotos.map((url, idx) => (
              <div key={idx} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button onClick={() => {
                  const urlToRemove = editPhotos[idx];
                  setEditPhotos(prev => prev.filter((_, i) => i !== idx));
                  deletePhotosFromStorage([urlToRemove]);
                }} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}>✕</button>
              </div>
            ))}
            {editPhotos.length < 3 && (
              <label style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, cursor: 'pointer', backgroundColor: 'rgba(0,122,255,0.05)', boxShadow: '0 0 10px rgba(0,122,255,0.1)' }}>
                {uploadingEditPhoto ? '...' : '+'}
                <input type="file" accept="image/*" multiple onChange={handleEditPhotoUpload} style={{ display: 'none' }} disabled={uploadingEditPhoto} />
              </label>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" onClick={onSave} disabled={isActionLoading}>{isActionLoading ? 'Сохранение...' : 'Сохранить'}</button>
        </div>
      </div>
    </div>
  );
}