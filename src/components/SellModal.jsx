import React from 'react';

export default function SellModal({
  sellingDeal,
  sellPrice, setSellPrice,
  sellQuantity, setSellQuantity,
  buyerId, setBuyerId,
  sellWarranty, setSellWarranty,
  isTradeIn, setIsTradeIn,
  tradeInModel, setTradeInModel,
  tradeInPrice, setTradeInPrice,
  contacts,
  onClose, onConfirm,
  isActionLoading,
  formatMoney,
  haptic
}) {
  if (!sellingDeal) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 4000 }}>
      <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <h3>Продажа: {sellingDeal.model}</h3>
        <div style={{ backgroundColor: 'var(--bg-color)', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          В наличии: <b>{sellingDeal.quantity} шт.</b>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цена продажи (за 1 шт)</label>
            <input 
              className="input-field" 
              type="text" 
              inputMode="numeric" 
              placeholder="Цена (₽)" 
              value={sellPrice} 
              onChange={(e) => setSellPrice(e.target.value.replace(/[^\d]/g, ''))} 
            />
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Кол-во</label>
            <input 
              className="input-field" 
              type="text" 
              inputMode="numeric" 
              placeholder="1" 
              value={sellQuantity} 
              onChange={(e) => setSellQuantity(e.target.value.replace(/[^\d]/g, ''))} 
            />
          </div>
        </div>

        <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
          <option value="">Кто купил?</option>
          {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
        </select>
        
        <label style={{ fontSize: 12, color: '#888', marginTop: 5, display: 'block' }}>Гарантия</label>
        <select className="input-field" value={sellWarranty} onChange={(e) => setSellWarranty(e.target.value)}>
          <option value="0">Без гарантии</option>
          <option value="1">1 месяц</option>
          <option value="3">3 месяца</option>
          <option value="6">6 месяцев</option>
          <option value="12">1 год</option>
        </select>

        {/* КРАСИВЫЙ БЛОК TRADE-IN */}
        <div style={{ marginTop: 15, padding: 12, backgroundColor: isTradeIn ? 'rgba(175, 82, 222, 0.1)' : 'var(--bg-color)', border: `1px solid ${isTradeIn ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 12, transition: 'all 0.3s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🔄</span>
              <span style={{ fontWeight: 'bold', fontSize: 14, color: isTradeIn ? 'var(--accent)' : 'var(--text-main)' }}>Принять в Trade-in</span>
            </div>
            <button onClick={() => { setIsTradeIn(!isTradeIn); haptic(); }} style={{ padding: '6px 12px', borderRadius: 20, background: isTradeIn ? 'var(--accent)' : '#e5e5ea', color: isTradeIn ? '#fff' : '#000', border: 'none', fontWeight: 'bold' }}>
              {isTradeIn ? 'ДА' : 'НЕТ'}
            </button>
          </div>

          {isTradeIn && (
            <div style={{ marginTop: 15, animation: 'fadeIn 0.3s ease-out' }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Какое устройство принимаем?</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Например: iPhone 11 128gb" 
                value={tradeInModel} 
                onChange={(e) => setTradeInModel(e.target.value)} 
              />
              
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>В какую сумму оцениваем? (₽)</label>
              <input 
                className="input-field" 
                type="text" 
                inputMode="numeric" 
                placeholder="Цена оценки (₽)" 
                value={tradeInPrice} 
                onChange={(e) => setTradeInPrice(e.target.value.replace(/[^\d]/g, ''))} 
              />
              
              {sellPrice && tradeInPrice && (
                <div style={{ marginTop: 10, padding: 12, backgroundColor: 'rgba(52, 199, 89, 0.15)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--success)' }}>К доплате от клиента:</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>
                    {formatMoney((Number(sellPrice) * (Number(sellQuantity) || 1)) - Number(tradeInPrice))}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={onConfirm} disabled={isActionLoading}>
            {isActionLoading ? 'Продажа...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}