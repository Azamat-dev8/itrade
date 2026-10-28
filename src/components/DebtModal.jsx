import React from 'react';

export default function DebtModal({ 
  isOpen, contacts, debtContactId, setDebtContactId, 
  debtAmount, setDebtAmount, debtType, setDebtType, 
  onClose, onSave 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content">
        <h3>Добавить долг</h3>
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Контакт</label>
        <select className="input-field" value={debtContactId} onChange={(e) => setDebtContactId(e.target.value)}>
          <option value="">Выберите контакт...</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Сумма (₽)</label>
        <input 
          className="input-field" 
          type="text" 
          inputMode="numeric" 
          placeholder="0" 
          value={debtAmount} 
          onChange={(e) => setDebtAmount(e.target.value.replace(/[^\d]/g, ''))} 
        />
        
        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Тип</label>
        <select className="input-field" value={debtType} onChange={(e) => setDebtType(e.target.value)}>
          <option value="they_owe">Мне должны</option>
          <option value="i_owe">Я должен</option>
        </select>
        
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" style={{ backgroundColor: 'var(--warning)' }} onClick={onSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}