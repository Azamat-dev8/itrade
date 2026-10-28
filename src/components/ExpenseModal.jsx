import React from 'react';

export default function ExpenseModal({ expenseDeal, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, onClose, onConfirm, isActionLoading }) {
  if (!expenseDeal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Расход: {expenseDeal.model}</h3>
        <input 
          className="input-field" 
          type="text" 
          inputMode="numeric" 
          placeholder="Сумма (₽)" 
          value={expenseAmount} 
          onChange={(e) => setExpenseAmount(e.target.value.replace(/[^\d]/g, ''))} 
          autoFocus 
        />
        <select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
          <option value="Ремонт">Ремонт</option>
          <option value="Запчасти">Запчасти</option>
          <option value="Такси">Такси</option>
          <option value="Реклама/Авито">Реклама/Авито</option>
          <option value="Бензин">Бензин</option>
        </select>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" onClick={onConfirm} disabled={isActionLoading}>
            {isActionLoading ? 'Добавление...' : 'Добавить'}
          </button>
        </div>
      </div>
    </div>
  );
}