import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [generalExpenses, setGeneralExpenses] = useState([]) // Общие расходы
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  
  // Стейт для поиска
  const [searchQuery, setSearchQuery] = useState('')

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

  // Поля для ОБЩЕГО расхода
  const [genExpAmount, setGenExpAmount] = useState('')
  const [genExpCategory, setGenExpCategory] = useState('Реклама/Авито')
  const [genExpNote, setGenExpNote] = useState('')

  // Окна (модалки)
  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')
  const [buyerId, setBuyerId] = useState('')

  const [expenseDeal, setExpenseDeal] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Ремонт')

  const [editingDeal, setEditingDeal] = useState(null)
  const [editModel, setEditModel] = useState('')
  const [editBuyPrice, setEditBuyPrice] = useState('')
  const [editStorage, setEditStorage] = useState('')
  const [editBattery, setEditBattery] = useState('')
  const [editImei, setEditImei] = useState('')
  const [editSellerId, setEditSellerId] = useState('')
  const [editSellPrice, setEditSellPrice] = useState('')
  const [editBuyerId, setEditBuyerId] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready(); tg.expand();
      setUser(tg.initDataUnsafe?.user || null)
    }
    fetchData()
  }, [])

  useEffect(() => { setSearchQuery('') }, [activeTab])

  const fetchData = async () => {
    // Сделки (с расходами и именами)
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*, expenses(*), seller:seller_id(name), buyer:buyer_id(name)')
      .order('created_at', { ascending: false })
    if (dealsData) setDeals(dealsData)

    // Контакты
    const { data: contactsData } = await supabase.from('contacts').select('*').order('name')
    if (contactsData) setContacts(contactsData)

    // ОБЩИЕ РАСХОДЫ (где deal_id = NULL)
    const { data: genExpData } = await supabase
      .from('expenses')
      .select('*')
      .is('deal_id', null)
      .order('created_at', { ascending: false })
    if (genExpData) setGeneralExpenses(genExpData)
  }

  const addDeal = async (e) => {
    e.preventDefault()
    if (!model || !buyPrice) return alert('Заполните модель и цену')
    setLoading(true)
    const { error } = await supabase.from('deals').insert([{ 
        model, buy_price: Number(buyPrice), status: 'in_stock',
        storage_gb: storage ? Number(storage) : null, battery_health: battery ? Number(battery) : null,
        imei: imei || null, seller_id: sellerId ? Number(sellerId) : null
      }])
    if (!error) { setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId(''); fetchData() } 
    else { alert('Ошибка: ' + error.message) }
    setLoading(false)
  }

const addGeneralExpense = async (e) => {
    e.preventDefault()
    if (!genExpAmount || isNaN(genExpAmount)) return alert('Введите сумму')
    
    const { error } = await supabase.from('expenses').insert([{ 
      amount: Number(genExpAmount), 
      category: genExpCategory,
      note: genExpNote || null 
    }])
    
    if (!error) { 
      setGenExpAmount(''); 
      setGenExpNote(''); 
      fetchData() 
    } else {
      alert('Ошибка при добавлении: ' + error.message) // Теперь мы увидим ошибку, если что-то пойдет не так
    }
  }

  const openEditModal = (deal) => {
    setEditingDeal(deal)
    setEditModel(deal.model); setEditBuyPrice(deal.buy_price); setEditStorage(deal.storage_gb || '')
    setEditBattery(deal.battery_health || ''); setEditImei(deal.imei || ''); setEditSellerId(deal.seller_id || '')
    setEditSellPrice(deal.sell_price || ''); setEditBuyerId(deal.buyer_id || '')
  }

  const saveEdit = async () => {
    if (!editModel || !editBuyPrice) return alert('Заполните модель и цену закупа')
    const updates = {
      model: editModel, buy_price: Number(editBuyPrice),
      storage_gb: editStorage ? Number(editStorage) : null, battery_health: editBattery ? Number(editBattery) : null,
      imei: editImei || null, seller_id: editSellerId ? Number(editSellerId) : null,
    }
    if (editingDeal.status === 'sold') {
      updates.sell_price = editSellPrice ? Number(editSellPrice) : null
      updates.buyer_id = editBuyerId ? Number(editBuyerId) : null
    }
    const { error } = await supabase.from('deals').update(updates).eq('id', editingDeal.id)
    if (!error) { setEditingDeal(null); fetchData() } 
  }

  const deleteDeal = async (id) => {
    if (!window.confirm('Удалить это устройство?')) return
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (!error) fetchData()
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!contactName) return alert('Введите имя')
    const { error } = await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote }])
    if (!error) { setContactName(''); setContactPhone(''); setContactNote(''); fetchData() }
  }

  const openSellModal = (deal) => { setSellingDeal(deal); setSellPrice(''); setBuyerId('') }
  const confirmSell = async () => {
    if (!sellPrice || isNaN(sellPrice) || Number(sellPrice) <= 0) return alert('Введите цену')
    const { error } = await supabase.from('deals').update({ 
        sell_price: Number(sellPrice), status: 'sold', 
        buyer_id: buyerId ? Number(buyerId) : null, sold_at: new Date().toISOString() 
      }).eq('id', sellingDeal.id)
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
  const totalDealExp = deals.reduce((sum, deal) => sum + (deal.expenses || []).reduce((s, e) => s + e.amount, 0), 0)
  const totalGenExp = generalExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + deal.sell_price, 0)
  
  // ЧИСТАЯ ПРИБЫЛЬ = Выручка - Закупки - Расходы по сделкам - ОБЩИЕ расходы
  const totalProfit = totalRevenue - totalBuy - totalDealExp - totalGenExp
  
  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + e.amount, 0);

  const filterDealsByQuery = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(deal => deal.model.toLowerCase().includes(q) || (deal.imei && deal.imei.includes(q)))
  }
  const filteredStock = filterDealsByQuery(inStockDeals);
  const filteredSold = filterDealsByQuery(soldDeals);

  const getDaysOnStock = (deal) => {
    const start = new Date(deal.created_at);
    const end = (deal.status === 'sold' && deal.sold_at) ? new Date(deal.sold_at) : new Date();
    const diffTime = Math.abs(end - start);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const renderDaysBadge = (days, status) => {
    let bg = '#e5e5ea'; let color = '#333';
    if (status === 'in_stock') {
      if (days >= 30) { bg = '#ffe4e1'; color = '#ff3b30'; }
      else if (days >= 15) { bg = '#fff3cd'; color = '#856404'; }
      else { bg = '#d1f9d1'; color = '#28a745'; }
    } else { bg = '#f0f0f0'; color = '#666'; }
    return <span style={{ background: bg, color: color, padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>⏱ {days} дн.</span>
  }

  const renderSpecs = (deal) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {renderDaysBadge(getDaysOnStock(deal), deal.status)}
      {deal.storage_gb && <span style={{ background: '#e5e5ea', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{deal.storage_gb} GB</span>}
      {deal.battery_health && <span style={{ background: deal.battery_health >= 85 ? '#d1f9d1' : '#ffe4e1', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>🔋 {deal.battery_health}%</span>}
      {deal.imei && <span style={{ background: '#e5e5ea', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: '#666' }}>IMEI: ...{deal.imei.slice(-4)}</span>}
    </div>
  )

  const renderSearchBar = () => (
    <div style={{ position: 'relative', marginBottom: 15 }}>
      <input className="input-field" type="text" placeholder="Поиск по модели или IMEI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 35 }}/>
      <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 16, color: '#888' }}>🔍</span>
    </div>
  )

  // --- ЭКРАНЫ ---
  const renderHome = () => (
    <div>
      <h2>Дашборд</h2>
      <div className="card" style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', color: 'white' }}>
        <h3 style={{ color: 'white', marginTop: 0, opacity: 0.8 }}>Чистая прибыль</h3>
        <div style={{ fontSize: 32, fontWeight: 'bold' }}>{totalProfit} ₽</div>
        <div style={{ marginTop: 15, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10, fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Выручка:</span> <span>{totalRevenue} ₽</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Закупки:</span> <span>{totalBuy} ₽</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}><span>Расходы по сделкам:</span> <span>{totalDealExp} ₽</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffb3b3' }}><span>Общие расходы:</span> <span>{totalGenExp} ₽</span></div>
        </div>
      </div>
      <div className="card"><h3>На складе</h3><div style={{ fontSize: 24, fontWeight: 'bold' }}>{inStockDeals.length} шт.</div></div>
    </div>
  )

  const renderFinance = () => (
    <div>
      <h2>Финансы</h2>
      <div className="card">
        <h3>Добавить общий расход</h3>
        <p style={{fontSize: 12, color: '#888', marginTop: -5, marginBottom: 10}}>Аренда, реклама, бензин и т.д.</p>
        <form onSubmit={addGeneralExpense}>
          <input className="input-field" type="number" placeholder="Сумма (₽)" value={genExpAmount} onChange={(e) => setGenExpAmount(e.target.value)}/>
          <select className="input-field" value={genExpCategory} onChange={(e) => setGenExpCategory(e.target.value)}>
            <option value="Реклама/Авито">Реклама/Авито</option>
            <option value="Аренда">Аренда</option>
            <option value="Бензин">Бензин</option>
            <option value="Инструменты">Инструменты</option>
            <option value="Подписки">Подписки</option>
            <option value="Прочее">Прочее</option>
          </select>
          <input className="input-field" type="text" placeholder="Комментарий (необязательно)" value={genExpNote} onChange={(e) => setGenExpNote(e.target.value)}/>
          <button className="btn-primary" type="submit" style={{backgroundColor: '#ff3b30'}}>Добавить расход</button>
        </form>
      </div>

      <h3>История общих расходов</h3>
      {generalExpenses.length === 0 ? <p style={{textAlign:'center', color:'#888'}}>Расходов нет</p> : null}
      {generalExpenses.map(exp => (
        <div key={exp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{exp.category}</div>
            {exp.note && <div style={{ fontSize: 12, color: '#888' }}>{exp.note}</div>}
          </div>
          <div style={{ fontWeight: 'bold', color: '#ff3b30' }}>-{exp.amount} ₽</div>
        </div>
      ))}
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
          <select className="input-field" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">Кто продал? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" type="submit" disabled={loading}>Добавить</button>
        </form>
      </div>

      {inStockDeals.length > 0 && renderSearchBar()}
      {filteredStock.length === 0 && searchQuery && <p style={{textAlign:'center', color:'#888'}}>Ничего не найдено</p>}

      {filteredStock.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #ff9500' }}>
            <div className="card-header">
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
              <div className="action-buttons">
                <button className="icon-btn" onClick={() => openEditModal(deal)}>✏️</button>
                <button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button>
              </div>
            </div>
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
      {soldDeals.length > 0 && renderSearchBar()}
      {filteredSold.length === 0 && searchQuery && <p style={{textAlign:'center', color:'#888'}}>Ничего не найдено</p>}
      {filteredSold.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        const margin = deal.sell_price - deal.buy_price - expSum; 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid #34c759' }}>
            <div className="card-header">
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
              <div className="action-buttons">
                <button className="icon-btn" onClick={() => openEditModal(deal)}>✏️</button>
                <button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button>
              </div>
            </div>
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
          <input className="input-field" type="text" placeholder="Заметка" value={contactNote} onChange={(e) => setContactNote(e.target.value)}/>
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
      {activeTab === 'finance' && renderFinance()}
      {activeTab === 'contacts' && renderContacts()}

      {/* МОДАЛКИ */}
      {sellingDeal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Продажа: {sellingDeal.model}</h3>
          <input className="input-field" type="number" placeholder="Цена продажи (₽)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} autoFocus/>
          <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
            <option value="">Кто купил? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button><button className="btn-confirm" onClick={confirmSell}>Продать</button></div>
        </div></div>
      )}

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

      {editingDeal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <h3>Редактировать: {editingDeal.model}</h3>
          <label style={{fontSize: 12, color: '#888'}}>Модель</label>
          <input className="input-field" type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)}/>
          <label style={{fontSize: 12, color: '#888'}}>Цена закупа (₽)</label>
          <input className="input-field" type="number" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value)}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label style={{fontSize: 12, color: '#888'}}>Память</label><input className="input-field" type="number" value={editStorage} onChange={(e) => setEditStorage(e.target.value)}/></div>
            <div style={{ flex: 1 }}><label style={{fontSize: 12, color: '#888'}}>АКБ</label><input className="input-field" type="number" value={editBattery} onChange={(e) => setEditBattery(e.target.value)}/></div>
          </div>
          <label style={{fontSize: 12, color: '#888'}}>IMEI</label>
          <input className="input-field" type="text" value={editImei} onChange={(e) => setEditImei(e.target.value)}/>
          <label style={{fontSize: 12, color: '#888'}}>Продавец</label>
          <select className="input-field" value={editSellerId} onChange={(e) => setEditSellerId(e.target.value)}>
            <option value="">Не указан</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {editingDeal.status === 'sold' && (
            <>
              <label style={{fontSize: 12, color: '#888', marginTop: 10, display: 'block'}}>Цена продажи (₽)</label>
              <input className="input-field" type="number" value={editSellPrice} onChange={(e) => setEditSellPrice(e.target.value)}/>
              <label style={{fontSize: 12, color: '#888'}}>Покупатель</label>
              <select className="input-field" value={editBuyerId} onChange={(e) => setEditBuyerId(e.target.value)}>
                <option value="">Не указан</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </>
          )}
          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn-cancel" onClick={() => setEditingDeal(null)}>Отмена</button>
            <button className="btn-confirm" style={{ backgroundColor: '#2481cc' }} onClick={saveEdit}>Сохранить</button>
          </div>
        </div></div>
      )}

      {/* 5 ВКЛАДОК В МЕНЮ */}
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><span className="tab-icon">📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}><span className="tab-icon">📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => setActiveTab('deals')}><span className="tab-icon">💰</span> Сделки</button>
        <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}><span className="tab-icon">💵</span> Финансы</button>
        <button className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}><span className="tab-icon">👥</span> Контакты</button>
      </div>
    </div>
  )
}

export default App