import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  
  // Состояния для окна продажи
  const [sellingDeal, setSellingDeal] = useState(null) // Какой телефон продаем
  const [sellPrice, setSellPrice] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe?.user || null)
    }
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setDeals(data)
  }

  const addDeal = async (e) => {
    e.preventDefault()
    if (!model || !buyPrice) return
    setLoading(true)

    const { error } = await supabase
      .from('deals')
      .insert([{ model: model, buy_price: Number(buyPrice), status: 'in_stock' }])

    if (!error) {
      setModel('')
      setBuyPrice('')
      fetchDeals() 
    } else {
      alert('Ошибка при добавлении: ' + error.message)
    }
    setLoading(false)
  }

  // Открываем окно продажи
  const openSellModal = (deal) => {
    setSellingDeal(deal)
    setSellPrice('') // Очищаем поле
  }

  // Подтверждаем продажу
  const confirmSell = async () => {
    if (!sellPrice || isNaN(sellPrice) || Number(sellPrice) <= 0) {
      alert('Введите корректную цену')
      return
    }

    const { error } = await supabase
      .from('deals')
      .update({ sell_price: Number(sellPrice), status: 'sold' })
      .eq('id', sellingDeal.id)

    if (!error) {
      setSellingDeal(null) // Закрываем окно
      fetchDeals() // Обновляем данные
    } else {
      alert('Ошибка: ' + error.message)
    }
  }

  // --- ПОДСЧЕТ СТАТИСТИКИ ---
  const totalInvested = deals.reduce((sum, deal) => sum + deal.buy_price, 0)
  const soldDeals = deals.filter(d => d.status === 'sold')
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + deal.sell_price, 0)
  const totalProfit = totalRevenue - soldDeals.reduce((sum, deal) => sum + deal.buy_price, 0)
  const inStockDeals = deals.filter(d => d.status === 'in_stock')

  // --- ЭКРАНЫ ---
  const renderHome = () => (
    <div>
      <h2>Дашборд</h2>
      <div className="card" style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', color: 'white' }}>
        <h3 style={{ color: 'white', marginTop: 0, opacity: 0.8 }}>Чистая прибыль</h3>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalProfit} ₽</div>
        <div style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Всего вложено:</span> <span>{totalInvested} ₽</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Всего выручка:</span> <span>{totalRevenue} ₽</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>На складе</h3>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{inStockDeals.length} шт.</div>
        <div style={{ color: '#888', fontSize: 14 }}>устройств ждут своего покупателя</div>
      </div>
    </div>
  )

  const renderStock = () => (
    <div>
      <h2>Склад</h2>
      <div className="card">
        <h3>Добавить устройство</h3>
        <form onSubmit={addDeal}>
          <input 
            className="input-field"
            type="text" 
            placeholder="Модель (например, iPhone 13)" 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
          />
          <input 
            className="input-field"
            type="number" 
            placeholder="Цена закупа (₽)" 
            value={buyPrice} 
            onChange={(e) => setBuyPrice(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : 'Добавить'}
          </button>
        </form>
      </div>

      {inStockDeals.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Склад пуст</p> : null}

      {inStockDeals.map((deal) => (
        <div key={deal.id} className="card" style={{ borderLeft: '4px solid #ff9500' }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
          <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>Закуп: {deal.buy_price} ₽</div>
          <button className="btn-success" onClick={() => openSellModal(deal)}>Продать</button>
        </div>
      ))}
    </div>
  )

  const renderDeals = () => (
    <div>
      <h2>История сделок</h2>
      {soldDeals.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Проданных устройств пока нет</p> : null}
      
      {soldDeals.map((deal) => {
        const margin = deal.sell_price - deal.buy_price;
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #34c759' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 5, marginBottom: 5 }}>
              Закуп: {deal.buy_price} ₽ | Продажа: {deal.sell_price} ₽
            </div>
            <div style={{ fontWeight: 'bold', color: margin >= 0 ? '#34c759' : '#ff3b30' }}>
              Прибыль: {margin} ₽
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="app-container">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'stock' && renderStock()}
      {activeTab === 'deals' && renderDeals()}

      {/* МОДАЛЬНОЕ ОКНО ПРОДАЖИ */}
      {sellingDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Продажа: {sellingDeal.model}</h3>
            <p style={{ fontSize: 14, color: '#666', marginTop: 0 }}>
              Закуп: {sellingDeal.buy_price} ₽
            </p>
            <input 
              className="input-field"
              type="number" 
              placeholder="Цена продажи (₽)" 
              value={sellPrice} 
              onChange={(e) => setSellPrice(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button>
              <button className="btn-confirm" onClick={confirmSell}>Продать</button>
            </div>
          </div>
        </div>
      )}

      {/* Нижнее меню */}
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <span className="tab-icon">📊</span> Главная
        </button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <span className="tab-icon">📦</span> Склад
        </button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveTab('deals')}>
          <span className="tab-icon">💰</span> Сделки
        </button>
      </div>
    </div>
  )
}

export default App