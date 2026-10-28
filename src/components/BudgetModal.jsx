import React from 'react';

export default function BudgetModal({ isOpen, tempBudget, setTempBudget, onClose, onSave }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="modal-content">
        <h3>Изменить бюджет</h3>
        <input 
          className="input-field" 
          type="text" 
          inputMode="numeric" 
          placeholder="Бюджет (₽)" 
          value={tempBudget} 
          onChange={(e) => setTempBudget(e.target.value.replace(/[^\d]/g, ''))} 
          autoFocus 
        />
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={onSave}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}