import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  
  // Поля для новой сделки
  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [storage, setStorage] = useState('')
  const [battery, setBattery] = useState('')
  const [imei, setImei] = useState('')
  const [sellerId, setSellerId] = useState('')
  
  // Поля для нового контакта
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactNote, setContactNote] = useState('')

  // Окна (модалки)
  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')
  const [buyerId, setBuyerId] = useState('')

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
    fetchData()
  }, [])

  const fetchData = async () => {
    // Загружаем сделки (с расходами, продавцом и покупателем)
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*, expenses(*), seller:seller_id(name), buyer:buyer_id(name)')
      .order('created_at', { ascending: false })
    if (dealsData) setDeals(dealsData)

    // Загружаем контакты
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .order('name')
    if (contactsData) setContacts(contactsData)
  }

  const addDeal = async (e) => {
    e.preventDefault()
    if (!model || !buyPrice) return alert('Заполните модель и цену')
    setLoading(true)

    const { error } = await supabase
      .from('deals')
      .insert([{ 
        model: model, 
        buy_price: Number(buyPrice), 
        status: 'in_stock',
        storage_gb: storage ? Number(storage) : null,
        battery_health: battery ? Number(battery) : null,
        imei: imei || null,
        seller_id: sellerId ? Number(sellerId) : null
      }])

    if (!error) {
      setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId('')
      fetchData() 
    } else {
      alert('Ошибка при добавлении: ' + error.message)
    }
    setLoading(false)
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!contactName) return alert('Введите имя')
    
    const { error } = await supabase
      .from('contacts')
      .insert([{ name: contactName, phone: contactPhone, note: contactNote }])

    if (!error) {
      setContactName(''); setContactPhone(''); setContactNote('')
      fetchData()
    } else {
      alert('Ошибка: ' + error.message)
    }
  }

  const openSellModal = (deal) => { setSellingDeal(deal); setSellPrice(''); setBuyerId('') }

  const confirmSell = async () => {
    if (!sellPrice || isNaN(sellPrice) || Number(sellPrice) <= 0) return alert('Введите цену')
    
    const { error } = await supabase
      .from('deals')
      .update({ 
        sell_price: Number(sellPrice), 
        status: 'sold',
        buyer_id: buyerId ? Number(buyerId) : null
      })
      .eq('id', sellingDeal.id)
      
    if (!error) { setSellingDeal(null); fetchData() }
  }

  const openExpenseModal = (deal) => { setExpenseDeal(deal); setExpenseAmount(''); setExpenseCategory('Ремонт') }

  const confirmExpense = async () => {
    if (!expenseAmount || isNaN(expenseAmount) || Number(expenseAmount) <= 0) return alert('Введите сумму')
    const { error } = await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory }])
    if (!error) { setExpenseDeal(null); fetchData() }
  }

  // --- СТАТИСТИКА ---
  const soldDeals = deals.filter(d => d.status === 'sold')
  const inStockDeals = deals.filter(d => d.status === 'in_stock')
  const totalBuy = deals.reduce((sum, deal) => sum + deal.buy_price, 0)
  const totalExp = deals.reduce((sum, deal) => sum + (deal.expenses || []).reduce((s, e) => s + e.amount, 0), 0)
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + deal.sell_price, 0)
  const totalProfit = totalRevenue - totalBuy - totalExp
  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + e.amount, 0);

  const renderSpecs = (deal) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {deal.storage_gb && <span style={{ background: '#e5e5ea', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{deal.storage_gb} GB</span>}
      {deal.battery_health && <span style={{ background: deal.battery_health >= 85 ? '#d1f9d1' : '#ffe4e1', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>🔋 {deal.battery_health}%</span>}
      {deal.imei && <span style={{ background: '#e5e5ea', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#666' }}>IMEI: ...{deal.imei.slice(-4)}</span>}
    </div>
  )

  // --- ЭКРАНЫ ---
  const renderHome = () => (
    <div>
      <h2>Дашборд</h2>
      <div className="card" style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', color: 'white' }}>
        <h3 style={{ color: 'white', marginTop: 0, opacity: 0.8 }}>Чистая прибыль</h3>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalProfit} ₽</div>
        <div style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Выручка:</span> <span>{totalRevenue} ₽</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Закупки:</span> <span>{totalBuy} ₽</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Расходы:</span> <span>{totalExp} ₽</span></div>
        </div>
      </div>
      <div className="card"><h3>На складе</h3><div style={{ fontSize: 24, fontWeight: 'bold' }}>{inStockDeals.length} шт.</div></div>
    </div>
  )

  const renderStock = () => (
    <div>
      <h2>Склад</h2>
      <div className="card">
        <h3>Добавить устройство</h3>
        <form onSubmit={addDeal}>
          <input className="input-field" type="text" placeholder="Модель (iPhone 13 Pro)" value={model} onChange={(e) => setModel(e.target.value)}/>
          <input className="input-field" type="number" placeholder="Цена закупа (₽)" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input-field" type="number" placeholder="Память (ГБ)" value={storage} onChange={(e) => setStorage(e.target.value)}/>
            <input className="input-field" type="number" placeholder="АКБ (%)" value={battery} onChange={(e) => setBattery(e.target.value)}/>
          </div>
          <input className="input-field" type="text" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)}/>
          
          {/* Выбор продавца */}
          <select className="input-field" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">Кто продал? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
          </select>

          <button className="btn-primary" type="submit" disabled={loading}>Добавить</button>
        </form>
      </div>

      {inStockDeals.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #ff9500' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
            {renderSpecs(deal)}
            {deal.seller && <div style={{ fontSize: 13, color: '#888', marginTop: 5 }}>Продавец: {deal.seller.name}</div>}
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
        const margin = deal.sell_price - deal.buy_price - expSum; 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #34c759' }}>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
            {renderSpecs(deal)}
            <div style={{ fontSize: 13, color: '#888', marginTop: 5, marginBottom: 5 }}>
              {deal.seller && <div>Купил у: {deal.seller.name}</div>}
              {deal.buyer && <div>Продал: {deal.buyer.name}</div>}
            </div>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
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

  const renderContacts = () => (
    <div>
      <h2>Контакты</h2>
      <div className="card">
        <h3>Добавить контакт</h3>
        <form onSubmit={addContact}>
          <input className="input-field" type="text" placeholder="Имя" value={contactName} onChange={(e) => setContactName(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Заметка (надежный, торгуется...)" value={contactNote} onChange={(e) => setContactNote(e.target.value)}/>
          <button className="btn-primary" type="submit">Сохранить</button>
        </form>
      </div>

      {contacts.map((c) => (
        <div key={c.id} className="card">
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{c.name}</div>
          {c.phone && <div style={{ fontSize: 14, color: '#2481cc', marginTop: 5 }}>📞 {c.phone}</div>}
          {c.note && <div style={{ fontSize: 13, color: '#888', marginTop: 5, fontStyle: 'italic' }}>📝 {c.note}</div>}
        </div>
      ))}
    </div>
  )

  return (
    <div className="app-container">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'stock' && renderStock()}
      {activeTab === 'deals' && renderDeals()}
      {activeTab === 'contacts' && renderContacts()}

      {/* ОКНО ПРОДАЖИ */}
      {sellingDeal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Продажа: {sellingDeal.model}</h3>
          <input className="input-field" type="number" placeholder="Цена продажи (₽)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} autoFocus/>
          
          <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            <option value="">Кто купил? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
          </select>

          <div className="modal-actions"><button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button><button className="btn-confirm" onClick={confirmSell}>Продать</button></div>
        </div></div>
      )}

      {/* ОКНО РАСХОДА */}
      {expenseDeal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Расход: {expenseDeal.model}</h3>
          <input className="input-field" type="number" placeholder="Сумма (₽)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} autoFocus/>
          <select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}>
            <option value="Ремонт">Ремонт</option><option value="Запчасти">Запчасти</option><option value="Такси/Доставка">Такси/Доставка</option><option value="Комиссия">Комиссия</option><option value="Другое">Другое</option>
          </select>
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setExpenseDeal(null)}>Отмена</button><button className="btn-confirm" style={{backgroundColor: '#ff9500'}} onClick={confirmExpense}>Добавить</button></div>
        </div></div>
      )}

      {/* НИЖНЕЕ МЕНЮ (4 кнопки) */}
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="tab-icon">📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}><span className="tab-icon">📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveTab('deals')}><span className="tab-icon">💰</span> Сделки</button>
        <button className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}><span className="tab-icon">👥</span> Контакты</button>
      </div>
    </div>
  )
}

export default App