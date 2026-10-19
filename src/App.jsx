import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Scanner from './Scanner'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
    const [isDarkTheme, setIsDarkTheme] = useState(false)
      const [isLeaderboardJoined, setIsLeaderboardJoined] = useState(false)
  const [generalExpenses, setGeneralExpenses] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [storage, setStorage] = useState('')
  const [battery, setBattery] = useState('')
  const [imei, setImei] = useState('')
  const [sellerId, setSellerId] = useState('')
  
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactNote, setContactNote] = useState('')

  const [editingContact, setEditingContact] = useState(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactNote, setEditContactNote] = useState('')

  const [genExpAmount, setGenExpAmount] = useState('')
  const [genExpCategory, setGenExpCategory] = useState('Реклама/Авито')
  const [genExpNote, setGenExpNote] = useState('')

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
      tg.ready(); 
      tg.expand(); 
      setUser(tg.initDataUnsafe?.user || null) 

      // МАГИЯ ТЕМНОЙ ТЕМЫ
      const applyTheme = () => {
        const isDark = tg.colorScheme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        setIsDarkTheme(isDark);
      }

      applyTheme() // Применяем при загрузке
      tg.onEvent('themeChanged', applyTheme) // Слушаем смену темы

      return () => {
        tg.offEvent('themeChanged', applyTheme)
      }
    }
    fetchData()
  }, [])  

  useEffect(() => { setSearchQuery('') }, [activeTab])
  const openExternalLink = (url) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }
  const haptic = (type = 'light') => {
    const tg = window.Telegram?.WebApp
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(type)
  }
  const toggleTheme = () => {
    const isNowDark = !isDarkTheme;
    setIsDarkTheme(isNowDark);
    document.body.classList.toggle('dark-theme', isNowDark);
    haptic('medium');
  }
  const fetchData = async () => {
     const fetchData = async () => {
    if (!user) return; // Ждем, пока загрузится пользователь
    
    // 1. Загружаем сделки ТОЛЬКО текущего пользователя
    const { data: dealsData } = await supabase
      .from('deals')
      .select('*, expenses(*), seller:seller_id(name), buyer:buyer_id(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (dealsData) setDeals(dealsData)

    // 2. Загружаем контакты ТОЛЬКО текущего пользователя
    const { data: contactsData } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name')
    if (contactsData) setContacts(contactsData)

    // 3. Загружаем общие расходы ТОЛЬКО текущего пользователя
    const { data: genExpData } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .is('deal_id', null)
      .order('created_at', { ascending: false })
    if (genExpData) setGeneralExpenses(genExpData)

    // 4. Загружаем профиль (проверяем, включен ли рейтинг)
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('telegram_id', user.id)
      .single()
    
    if (profileData) {
      setIsLeaderboardJoined(profileData.show_in_leaderboard)
    } else {
      // Если профиля нет (пользователь зашел впервые) — создаем его
      await supabase.from('user_profiles').insert([{ 
        telegram_id: user.id, 
        user_name: user.first_name || user.username || 'Аноним', 
        show_in_leaderboard: false 
      }])
    }

    // 5. Загружаем топ-10 рейтинга
    const { data: lbData } = await supabase
      .from('public_leaderboard')
      .select('*')
      .order('gross_profit', { ascending: false })
      .limit(10)
    if (lbData) setLeaderboard(lbData)
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
    if (!error) { 
      setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId(''); 
      fetchData(); haptic('medium'); 
    } else { alert('Ошибка: ' + error.message) }
    setLoading(false)
  }

  const addGeneralExpense = async (e) => {
    e.preventDefault()
    if (!genExpAmount || isNaN(genExpAmount)) return alert('Введите сумму')
    const { error } = await supabase.from('expenses').insert([{ amount: Number(genExpAmount), category: genExpCategory, note: genExpNote || null }])
    if (!error) { setGenExpAmount(''); setGenExpNote(''); fetchData(); haptic('medium'); }
  }

  const addQuickGeneralExpense = async (amount, category) => {
    haptic('medium');
    await supabase.from('expenses').insert([{ amount, category, note: 'Быстрый ввод' }])
    fetchData()
  }

  const addQuickDealExpense = async (amount, category) => {
    haptic('medium');
    await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount, category }])
    setExpenseDeal(null)
    fetchData()
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!contactName) return alert('Введите имя')
    const { error } = await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote }])
    if (!error) { setContactName(''); setContactPhone(''); setContactNote(''); fetchData(); haptic('medium'); }
  }

  const openEditContactModal = (contact) => {
    haptic();
    setEditingContact(contact)
    setEditContactName(contact.name)
    setEditContactPhone(contact.phone || '')
    setEditContactNote(contact.note || '')
  }

  const saveEditContact = async () => {
    if (!editContactName) return alert('Введите имя')
    const { error } = await supabase.from('contacts').update({
      name: editContactName,
      phone: editContactPhone || null,
      note: editContactNote || null
    }).eq('id', editingContact.id)
    
    if (!error) { setEditingContact(null); fetchData(); haptic('medium'); }
  }

  const deleteContact = async (id) => {
    if (!window.confirm('Удалить этот контакт?')) return
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (!error) { fetchData(); haptic('heavy'); }
  }

  const openEditModal = (deal) => {
    haptic();
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
    if (!error) { setEditingDeal(null); fetchData(); haptic('medium'); } 
  }

  const deleteDeal = async (id) => {
    if (!window.confirm('Удалить это устройство?')) return
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (!error) { fetchData(); haptic('heavy'); }
  }

  const openSellModal = (deal) => { haptic(); setSellingDeal(deal); setSellPrice(''); setBuyerId('') }
  const confirmSell = async () => {
    if (!sellPrice || isNaN(sellPrice) || Number(sellPrice) <= 0) return alert('Введите цену')
    const { error } = await supabase.from('deals').update({ 
        sell_price: Number(sellPrice), status: 'sold', 
        buyer_id: buyerId ? Number(buyerId) : null, sold_at: new Date().toISOString() 
      }).eq('id', sellingDeal.id)
    if (!error) { setSellingDeal(null); fetchData(); haptic('medium'); }
  }

  const openExpenseModal = (deal) => { haptic(); setExpenseDeal(deal); setExpenseAmount(''); setExpenseCategory('Ремонт') }
  const confirmExpense = async () => {
    if (!expenseAmount || isNaN(expenseAmount) || Number(expenseAmount) <= 0) return alert('Введите сумму')
    const { error } = await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory }])
    if (!error) { setExpenseDeal(null); fetchData(); haptic('medium'); }
  }

  const exportToCSV = () => {
    haptic();
    if (deals.length === 0) return alert('Нет данных для экспорта')
    const headers = ['Модель', 'Память', 'АКБ', 'IMEI', 'Закупка', 'Расходы', 'Продажа', 'Прибыль', 'Дата закупа', 'Дата продажи', 'Продавец', 'Покупатель'];
    const rows = deals.map(d => {
      const exp = getDealExpensesSum(d);
      const margin = d.sell_price ? d.sell_price - d.buy_price - exp : '';
      return [
        `"${d.model}"`, d.storage_gb || '', d.battery_health || '', d.imei || '',
        d.buy_price, exp, d.sell_price || '', margin,
        new Date(d.created_at).toLocaleDateString('ru-RU'),
        d.sold_at ? new Date(d.sold_at).toLocaleDateString('ru-RU') : '',
        d.seller ? `"${d.seller.name}"` : '', d.buyer ? `"${d.buyer.name}"` : ''
      ].join(';'); 
    });
    const csvString = [headers.join(';'), ...rows].join('\n');
    setCsvData(csvString);
    setShowExportModal(true);
  }

  const soldDeals = deals.filter(d => d.status === 'sold')
  const inStockDeals = deals.filter(d => d.status === 'in_stock')
  const totalBuy = deals.reduce((sum, deal) => sum + deal.buy_price, 0)
  const totalDealExp = deals.reduce((sum, deal) => sum + (deal.expenses || []).reduce((s, e) => s + e.amount, 0), 0)
  const totalGenExp = generalExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + deal.sell_price, 0)
  const totalProfit = totalRevenue - totalBuy - totalDealExp - totalGenExp
  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + e.amount, 0);

  const monthlyProfits = soldDeals.reduce((acc, deal) => {
    const date = new Date(deal.sold_at || deal.created_at);
    const monthYear = date.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
    const expSum = getDealExpensesSum(deal);
    const profit = deal.sell_price - deal.buy_price - expSum;
    if (!acc[monthYear]) acc[monthYear] = 0;
    acc[monthYear] += profit;
    return acc;
  }, {});
  
  const chartData = Object.entries(monthlyProfits).map(([name, profit]) => ({ name, profit })).reverse();

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
    let badgeClass = 'badge-gray';
    if (status === 'in_stock') {
      if (days >= 30) badgeClass = 'badge-red';
      else if (days >= 15) badgeClass = 'badge-yellow';
      else badgeClass = 'badge-green';
    }
    return <span className={`badge ${badgeClass}`}>⏱ {days} дн.</span>
  }

  const renderSpecs = (deal) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 10 }}>
      {renderDaysBadge(getDaysOnStock(deal), deal.status)}
      {deal.storage_gb && <span className="badge badge-gray">{deal.storage_gb} GB</span>}
      {deal.battery_health && <span className="badge badge-gray">🔋 {deal.battery_health}%</span>}
      {deal.imei && <span className="badge badge-gray">IMEI: ...{deal.imei.slice(-4)}</span>}
    </div>
  )

  const renderSearchBar = () => (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <input className="input-field" type="text" placeholder="Поиск по модели или IMEI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }}/>
      <span style={{ position: 'absolute', left: 14, top: 15, fontSize: 16, color: '#888' }}>🔍</span>
    </div>
  )

  const renderHome = () => (
    <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Статистика</h2>
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border)', 
            borderRadius: '50%', 
            width: 40, height: 40, 
            fontSize: 18, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          {isDarkTheme ? '☀️' : '🌙'}
        </button>
      </div>  
      
      <div className="main-profit-card">
        <h3>Чистая прибыль</h3>
        <div className="main-profit-value">{totalProfit} ₽</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <div className="stat-row"><span>Выручка:</span> <span>{totalRevenue} ₽</span></div>
          <div className="stat-row"><span>Закупки:</span> <span>{totalBuy} ₽</span></div>
          <div className="stat-row" style={{ marginBottom: 0 }}><span>Всего расходов:</span> <span>{totalDealExp + totalGenExp} ₽</span></div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#666' }}>На складе</h3>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{inStockDeals.length} шт.</div>
        </div>
        <button className="btn-success" onClick={exportToCSV} style={{ padding: '12px 16px' }}>
          📥 Экспорт
        </button>
      </div>

      {chartData.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 15 }}>Прибыль по месяцам</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                                <Tooltip 
                  cursor={{ fill: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} 
                  contentStyle={{ 
                    borderRadius: 12, border: 'none', 
                    backgroundColor: isDarkTheme ? '#1c1c1e' : '#ffffff',
                    color: isDarkTheme ? '#ffffff' : '#000000',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)' 
                  }} 
                />
                   <Bar dataKey="profit" fill="#34c759" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )

  const renderFinance = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Финансы</h2>
      <div className="card">
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Быстрые расходы</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn-cancel" style={{ flex: '1 0 30%', padding: '10px 8px', fontSize: 14 }} onClick={() => addQuickGeneralExpense(1000, 'Реклама/Авито')}>Авито 1000₽</button>
          <button className="btn-cancel" style={{ flex: '1 0 30%', padding: '10px 8px', fontSize: 14 }} onClick={() => addQuickGeneralExpense(500, 'Бензин')}>Бензин 500₽</button>
          <button className="btn-cancel" style={{ flex: '1 0 30%', padding: '10px 8px', fontSize: 14 }} onClick={() => addQuickGeneralExpense(300, 'Прочее')}>Такси 300₽</button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Свой расход</h3>
        <form onSubmit={addGeneralExpense}>
          <input className="input-field" type="number" placeholder="Сумма (₽)" value={genExpAmount} onChange={(e) => setGenExpAmount(e.target.value)}/>
          <select className="input-field" value={genExpCategory} onChange={(e) => setGenExpCategory(e.target.value)}>
            <option value="Реклама/Авито">Реклама/Авито</option><option value="Аренда">Аренда</option><option value="Бензин">Бензин</option><option value="Прочее">Прочее</option>
          </select>
          <button className="btn-primary" type="submit" style={{backgroundColor: 'var(--danger)'}}>Добавить</button>
        </form>
      </div>

      <h3 style={{ fontSize: 18, marginTop: 24 }}>История</h3>
      {generalExpenses.map(exp => (
        <div key={exp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginBottom: 8 }}>
          <div><div style={{ fontWeight: 600 }}>{exp.category}</div>{exp.note && <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{exp.note}</div>}</div>
          <div style={{ fontWeight: 700, color: 'var(--danger)' }}>-{exp.amount} ₽</div>
        </div>
      ))}
    </div>
  )

  const renderStock = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Склад</h2>
      <div className="card">
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Добавить</h3>
        <form onSubmit={addDeal}>
          <input className="input-field" type="text" placeholder="Модель (iPhone 13 Pro)" value={model} onChange={(e) => setModel(e.target.value)}/>
          <input className="input-field" type="number" placeholder="Цена закупа (₽)" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <input className="input-field" type="number" placeholder="Память (ГБ)" value={storage} onChange={(e) => setStorage(e.target.value)}/>
            <input className="input-field" type="number" placeholder="АКБ (%)" value={battery} onChange={(e) => setBattery(e.target.value)}/>
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="input-field" type="text" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} style={{ flex: 1, marginBottom: 10 }}/>
            <button type="button" onClick={() => setShowScanner(true)} style={{ marginBottom: 10, padding: '14px 16px', backgroundColor: 'var(--warning)', color: 'white', border: 'none', borderRadius: 12 }}>📷</button>
          </div>

          <select className="input-field" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">Кто продал? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" type="submit" disabled={loading}>Сохранить на склад</button>
        </form>
      </div>

      {inStockDeals.length > 0 && renderSearchBar()}
      {filteredStock.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="card-header">
              <div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model}</div>
              <div><button className="icon-btn" onClick={() => openEditModal(deal)}>✏️</button><button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button></div>
            </div>
            {renderSpecs(deal)}
            <div style={{ fontSize: 15, color: '#333', fontWeight: 500 }}>
              Закуп: {deal.buy_price} ₽ {expSum > 0 && <span style={{color: 'var(--danger)'}}>+ Расходы: {expSum} ₽</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-cancel" style={{ padding: '12px', backgroundColor: '#fff3cd', color: '#b28900' }} onClick={() => openExpenseModal(deal)}>+ Расход</button>
              <button className="btn-success" style={{ flex: 1, padding: '12px' }} onClick={() => openSellModal(deal)}>Продать</button>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderDeals = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Сделки</h2>
      {soldDeals.length > 0 && renderSearchBar()}
      {filteredSold.map((deal) => {
        const expSum = getDealExpensesSum(deal);
        const margin = deal.sell_price - deal.buy_price - expSum; 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="card-header">
              <div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model}</div>
              <div><button className="icon-btn" onClick={() => openEditModal(deal)}>✏️</button><button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button></div>
            </div>
            {renderSpecs(deal)}
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              Закуп: {deal.buy_price} ₽ | Расходы: {expSum} ₽ | Продажа: {deal.sell_price} ₽
            </div>
            <div style={{ fontWeight: 700, color: margin >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
              Прибыль: {margin} ₽
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderContacts = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50  }}>Контакты</h2>
      
      <div className="card">
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Добавить контакт</h3>
        <form onSubmit={addContact}>
          <input className="input-field" type="text" placeholder="Имя" value={contactName} onChange={(e) => setContactName(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Комментарий (надёжный, торгуется...)" value={contactNote} onChange={(e) => setContactNote(e.target.value)}/>
          <button className="btn-primary" type="submit">Сохранить</button>
        </form>
      </div>

      {contacts.length === 0 ? <p style={{textAlign: 'center', color: '#888', marginTop: 20}}>Список контактов пуст</p> : null}

      {contacts.map((c) => (
        <div key={c.id} className="card" style={{ padding: 16 }}>
          <div className="card-header" style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
            <div>
              <button className="icon-btn" onClick={() => openEditContactModal(c)}>✏️</button>
              <button className="icon-btn" onClick={() => deleteContact(c.id)}>🗑️</button>
            </div>
          </div>
          {c.phone && <div style={{ color: 'var(--accent)', marginTop: 4, fontSize: 14 }}>📞 {c.phone}</div>}
          {c.note && <div style={{ color: '#888', fontSize: 13, marginTop: 6, fontStyle: 'italic' }}>📝 {c.note}</div>}
          
          <div style={{ color: '#aaa', fontSize: 11, marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
            Добавлен: {new Date(c.created_at).toLocaleDateString('ru-RU')}
          </div>
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

      {sellingDeal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Продажа: {sellingDeal.model}</h3>
          <input className="input-field" type="number" placeholder="Цена продажи (₽)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} autoFocus/>
          <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}><option value="">Кто купил?</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button><button className="btn-confirm" style={{ flex: 1, backgroundColor: 'var(--success)' }} onClick={confirmSell}>Продать</button></div>
        </div></div>
      )}

      {expenseDeal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Расход: {expenseDeal.model}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 15 }}>
            <button className="btn-cancel" style={{ flex: '1 0 45%', padding: 12 }} onClick={() => addQuickDealExpense(500, 'Такси/Доставка')}>Такси 500₽</button>
            <button className="btn-cancel" style={{ flex: '1 0 45%', padding: 12 }} onClick={() => addQuickDealExpense(1000, 'Запчасти')}>Запчасти 1000₽</button>
            <button className="btn-cancel" style={{ flex: '1 0 45%', padding: 12 }} onClick={() => addQuickDealExpense(5000, 'Ремонт')}>Ремонт 5000₽</button>
            <button className="btn-cancel" style={{ flex: '1 0 45%', padding: 12 }} onClick={() => addQuickDealExpense(1500, 'Комиссия')}>Комиссия 1500₽</button>
          </div>
          <p style={{textAlign:'center', color: '#888', fontSize: 13}}>Или введите свой:</p>
          <input className="input-field" type="number" placeholder="Сумма (₽)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} autoFocus/>
          <select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}><option value="Ремонт">Ремонт</option><option value="Запчасти">Запчасти</option><option value="Такси">Такси</option></select>
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setExpenseDeal(null)}>Отмена</button><button className="btn-confirm" style={{ flex: 1, backgroundColor: 'var(--warning)' }} onClick={confirmExpense}>Добавить</button></div>
        </div></div>
      )}

      {editingDeal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <h3>Редактировать устройство</h3>
          <label style={{fontSize: 12, color: '#888'}}>Модель</label><input className="input-field" type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)}/>
          <label style={{fontSize: 12, color: '#888'}}>Цена закупа (₽)</label><input className="input-field" type="number" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value)}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label style={{fontSize: 12, color: '#888'}}>Память</label><input className="input-field" type="number" value={editStorage} onChange={(e) => setEditStorage(e.target.value)}/></div>
            <div style={{ flex: 1 }}><label style={{fontSize: 12, color: '#888'}}>АКБ</label><input className="input-field" type="number" value={editBattery} onChange={(e) => setEditBattery(e.target.value)}/></div>
          </div>
          <label style={{fontSize: 12, color: '#888'}}>IMEI</label><input className="input-field" type="text" value={editImei} onChange={(e) => setEditImei(e.target.value)}/>
          {editingDeal.status === 'sold' && (
            <>
              <label style={{fontSize: 12, color: '#888', marginTop: 10, display: 'block'}}>Цена продажи (₽)</label><input className="input-field" type="number" value={editSellPrice} onChange={(e) => setEditSellPrice(e.target.value)}/>
            </>
          )}
          <div className="modal-actions" style={{ marginTop: 20 }}><button className="btn-cancel" onClick={() => setEditingDeal(null)}>Отмена</button><button className="btn-confirm" style={{ flex: 1, backgroundColor: 'var(--accent)' }} onClick={saveEdit}>Сохранить</button></div>
        </div></div>
      )}

      {editingContact && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Редактировать контакт</h3>
          <label style={{fontSize: 12, color: '#888'}}>Имя</label>
          <input className="input-field" type="text" value={editContactName} onChange={(e) => setEditContactName(e.target.value)} />
          <label style={{fontSize: 12, color: '#888'}}>Телефон</label>
          <input className="input-field" type="text" value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)} />
          <label style={{fontSize: 12, color: '#888'}}>Комментарий</label>
          <input className="input-field" type="text" value={editContactNote} onChange={(e) => setEditContactNote(e.target.value)} />
          
          <div className="modal-actions" style={{ marginTop: 20 }}>
            <button className="btn-cancel" onClick={() => setEditingContact(null)}>Отмена</button>
            <button className="btn-confirm" style={{ flex: 1, backgroundColor: 'var(--accent)' }} onClick={saveEditContact}>Сохранить</button>
          </div>
        </div></div>
      )}

      {showExportModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Экспорт</h3>
            <textarea value={csvData} readOnly onClick={(e) => e.target.select()} style={{ flex: 1, minHeight: '150px', padding: 10, borderRadius: 12, border: '1px solid #ccc', fontSize: 12, marginBottom: 15 }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowExportModal(false)}>Закрыть</button>
              <button className="btn-confirm" style={{ flex: 1, backgroundColor: 'var(--success)' }} onClick={() => {
                const textArea = document.createElement("textarea"); textArea.value = csvData; document.body.appendChild(textArea); textArea.select();
                try { document.execCommand('copy'); alert('✅ Скопировано!'); setShowExportModal(false); } catch (err) { alert('Скопируйте вручную'); }
                document.body.removeChild(textArea);
              }}>Копировать</button>
            </div>
        </div></div>
      )}

      {showScanner && (
        <Scanner onScan={(text) => setImei(text)} onClose={() => setShowScanner(false)} />
      )}
      {/* КНОПКА ГАМБУРГЕР */}
      <button 
        className="hamburger-btn" 
        onClick={() => { setIsMenuOpen(true); haptic(); }}
        style={{ position: 'absolute', top: '16px', left: '16px' }} // absolute, чтобы не перекрывать контент при скролле
      >
        ☰
      </button>

      {/* ОВЕРЛЕЙ И САМО МЕНЮ */}
      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        
        {/* Профиль пользователя */}
        <div className="profile-section">
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>
  {user?.photo_url ? (
    <img src={user.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  ) : (
    user?.first_name ? user.first_name[0].toUpperCase() : 'U'
  )}
</div>
          <div>
            <div className="profile-name">{user?.first_name || 'Пользователь'}</div>
            <div className="profile-status">{user?.username ? `@${user.username}` : 'iTrade Pro'}</div>
          </div>
        </div>

               {/* Ссылки в меню */}
        <div className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
           <button 
             className="sidebar-pro-btn" 
             onClick={() => { setShowSubModal(true); setIsMenuOpen(false); haptic(); }}
           >
             ⭐ Подписка
           </button>
        </div>

        {/* Юридическая информация и поддержка (в самом низу) */}
        <div className="sidebar-footer">
          <div style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 'bold'}}>
            Настройки и поддержка
          </div>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Polzovatelskoe-soglashenie-10-19-40'); }}>Пользовательское соглашение</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Politika-konfidencialnosti-10-19-87'); }}>Политика конфиденциальности</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://t.me/primestore8'); }} style={{ color: 'var(--accent)' }}>Служба поддержки: @primestore8</a>
        </div>
      </div> {/* <-- ЭТА ЗАКРЫВАЮЩАЯ СКОБКА ЗАКРЫВАЕТ SIDEBAR */}
            {/* МОДАЛКА ПОДПИСКИ */}
      {showSubModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxHeight: '90vh' }}>
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>PrimeTrade PRO</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginBottom: 15 }}>
              Ваш статус: <strong style={{ color: '#34c759' }}>Пробный период (осталось 14 дней)</strong>
            </p>

            <div className="card" style={{ padding: 15, marginBottom: 15 }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: 14 }}>Что дает подписка:</h4>
              <ul className="pro-features">
                <li><span>📦</span> Неограниченное количество сделок</li>
                <li><span>📊</span> Продвинутая аналитика и графики</li>
                <li><span>📷</span> Сканер IMEI без ограничений</li>
                <li><span>💾</span> Экспорт в Excel и CRM в 1 клик</li>
              </ul>
            </div>

            <div className="pricing-grid">
              {/* 1 месяц */}
              <div className="pricing-card" onClick={() => alert('Переход к оплате за 390 ₽...')}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>1 месяц</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>390 ₽ / мес</div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Выбрать</div>
              </div>

              {/* 6 месяцев */}
              <div className="pricing-card" onClick={() => alert('Переход к оплате за 1990 ₽...')}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>6 месяцев</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1990 ₽ (332 ₽/мес)</div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Выбрать</div>
              </div>

              {/* 12 месяцев */}
              <div className="pricing-card best-value" onClick={() => alert('Переход к оплате за 3590 ₽...')}>
                <div className="best-value-badge">ВЫГОДНО</div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>12 месяцев</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>3590 ₽ (299 ₽/мес)</div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Выбрать</div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-cancel" onClick={() => setShowSubModal(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); haptic(); }}><span className="tab-icon">📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => { setActiveTab('stock'); haptic(); }}><span className="tab-icon">📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => { setActiveTab('deals'); haptic(); }}><span className="tab-icon">💰</span> Сделки</button>
        <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => { setActiveTab('finance'); haptic(); }}><span className="tab-icon">💵</span> Финансы</button>
        <button className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); haptic(); }}><span className="tab-icon">👥</span> Контакты</button>
      </div>
    </div>
  )
  
}

export default App