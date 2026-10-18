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
  
  // Окно продажи
  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')

  // Окно добавления расхода
  const [expenseDeal, setExpenseDeal] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Ремонт')

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
    // Теперь мы загружаем сделки ВМЕСТЕ с их расходами (благодаря связи в базе)
    const { data, error } = await supabase
      .from('deals')
      .select('*, expenses(*)')
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

  const openSellModal = (deal) => {
    setSellingDeal(deal)
    setSellPrice('') 
  }

  const confirmSell = async () => {
    if (!sellPrice || isNaN(sellPrice) || Number(sellPrice) <= 0) return alert('Введите цену')

    const { error } = await supabase
      .from('deals')
      .update({ sell_price: Number(sellPrice), status: 'sold' })
      .eq('id', sellingDeal.id)

    if (!error) {
      setSellingDeal(null) 
      fetchDeals() 
    }
  }

  // Добавление расхода
  const openExpenseModal = (deal) => {
    setExpenseDeal(deal)
    setExpenseAmount('')
    setExpenseCategory('Ремонт')
  }

  const confirmExpense = async () => {
    if (!expenseAmount || isNaN(expenseAmount) || Number(expenseAmount) <= 0) return alert('Введите сумму')

    const { error } = await supabase
      .from('expenses')
      .insert([{ 
        deal_id: expenseDeal.id, 
        amount: Number(expenseAmount), 
        category: expenseCategory 
      }])

    if (!error) {
      setExpenseDeal(null)
      fetchDeals() // Обновляем список, чтобы расходы подтянулись
    } else {
      alert('Ошибка: ' + error.message)
    }
  }

  // --- ПОДСЧЕТ СТАТИСТИКИ (ТЕПЕРЬ С УЧЕТОМ РАСХОДОВ) ---
  const soldDeals = deals.filter(d => d.status === 'sold')
  const inStockDeals = deals.filter(d => d.status === 'in_stock')
  
  // Сумма всех закупов
  const totalBuy = deals.reduce((sum, deal) => sum + deal.buy_price, 0)
  // Сумма всех расходов (ремонт, такси и т.д.)
  const totalExp = deals.reduce((sum, deal) => {
    const dealExpenses = deal.expenses || [];
    return sum + dealExpenses.reduce((s, e) => s + e.amount, 0);
  }, 0)
  
  // Выручка с продаж
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + deal.sell_price, 0)
  // ЧИСТАЯ ПРИБЫЛЬ: Выручка минус (Закуп + Все расходы)
  const totalProfit = totalRevenue - totalBuy - totalExp

  // Вспомогательная функция для подсчета суммы расходов по одному телефону
  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + e.amount, 0);


  // --- ЭКРАНЫ ---
  const renderHome = () => (
    <div>
      <h2>Дашборд</h2>
      <div className="card" style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', color: 'white' }}>
        <h3 style={{ color: 'white', marginTop: 0, opacity: 0.8 }}>Чистая прибыль</h3>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalProfit} ₽</div>
        <div style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Выручка:</span> <span>{totalRevenue} ₽</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span>Закупки:</span> <span>{totalBuy} ₽</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Расходы:</span> <span>{totalExp} ₽</span>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>На складе</h3>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>{inStockDeals.length} шт.</div>
      </div>
    </div>
  )

  const renderStock = () => (
    <div>
      <h2>Склад</h2>
      <div className="card">
        <h3>Добавить устройство</h3>
        <form onSubmit={addDeal}>
          <input className="input-field" type="text" placeholder="Модель" value={model} onChange={(e) => setModel(e.target.value)}/>
          <input className="input-field" type="number" placeholder="Цена закупа (₽)" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}/>
          <button className="btn-primary" type="submit" disabled={loading}>Добавить</button>
        </form>
      </div>

      {inStockDeals.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #ff9500' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
              Закуп: {deal.buy_price} ₽ {expSum > 0 && <span style={{color: '#ff3b30'}}>+ Расходы: {expSum} ₽</span>}
            </div>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn-success" style={{ margin: 0, flex: 1, backgroundColor: '#ff9500' }} onClick={() => openExpenseModal(deal)}>+ Расход</button>
              <button className="btn-success" style={{ margin: 0, flex: 1 }} onClick={() => openSellModal(deal)}>Продать</button>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderDeals = () => (
    <div>
      <h2>История сделок</h2>
      {soldDeals.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        // Чистая маржа = Продажа - Закуп - Расходы
        const margin = deal.sell_price - deal.buy_price - expSum; 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #34c759' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
            <div style={{ fontSize: 14, color: '#666', marginTop: 5, marginBottom: 5 }}>
              Закуп: {deal.buy_price} ₽ | Расходы: {expSum} ₽ | Продажа: {deal.sell_price} ₽
            </div>
            <div style={{ fontWeight: 'bold', color: margin >= 0 ? '#34c759' : '#ff3b30' }}>
              Чистая прибыль: {margin} ₽
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

      {/* ОКНО ПРОДАЖИ */}
      {sellingDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Продажа: {sellingDeal.model}</h3>
            <input className="input-field" type="number" placeholder="Цена продажи (₽)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} autoFocus/>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button>
              <button className="btn-confirm" onClick={confirmSell}>Продать</button>
            </div>
          </div>
        </div>
      )}

      {/* ОКНО РАСХОДА */}
      {expenseDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Расход: {expenseDeal.model}</h3>
            <input className="input-field" type="number" placeholder="Сумма (₽)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} autoFocus/>
            
            <select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
              <option value="Ремонт">Ремонт</option>
              <option value="Запчасти">Запчасти</option>
              <option value="Такси/Доставка">Такси/Доставка</option>
              <option value="Комиссия">Комиссия</option>
              <option value="Другое">Другое</option>
            </select>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setExpenseDeal(null)}>Отмена</button>
              <button className="btn-confirm" style={{backgroundColor: '#ff9500'}} onClick={confirmExpense}>Добавить</button>
            </div>
          </div>
        </div>
      )}

      {/* Нижнее меню */}
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="tab-icon">📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}><span className="tab-icon">📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveTab('deals')}><span className="tab-icon">💰</span> Сделки</button>
      </div>
    </div>
  )
}

export default App