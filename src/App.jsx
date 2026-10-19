import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Scanner from './Scanner'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [generalExpenses, setGeneralExpenses] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')

  // Состояния интерфейса
  const [showExportModal, setShowExportModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
    const [showGuideModal, setShowGuideModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isLeaderboardJoined, setIsLeaderboardJoined] = useState(false)

  // Поля для сделки
  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [storage, setStorage] = useState('')
  const [battery, setBattery] = useState('')
  const [imei, setImei] = useState('')
  const [sellerId, setSellerId] = useState('')
  
  // Поля для контакта
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactNote, setContactNote] = useState('')
  
  const [editingContact, setEditingContact] = useState(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactNote, setEditContactNote] = useState('')

  // Поля для расходов
  const [genExpAmount, setGenExpAmount] = useState('')
  const [genExpCategory, setGenExpCategory] = useState('Реклама/Авито')
  const [genExpNote, setGenExpNote] = useState('')
  const [expenseDeal, setExpenseDeal] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Ремонт')

  // Продажа и редактирование
  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')
  const [buyerId, setBuyerId] = useState('')
  
  const [editingDeal, setEditingDeal] = useState(null)
  const [editModel, setEditModel] = useState('')
  const [editBuyPrice, setEditBuyPrice] = useState('')
  const [editStorage, setEditStorage] = useState('')
  const [editBattery, setEditBattery] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) { 
      tg.ready(); tg.expand(); setUser(tg.initDataUnsafe?.user || null) 
      const applyTheme = () => {
        const isDark = tg.colorScheme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        setIsDarkTheme(isDark);
      }
      applyTheme()
      tg.onEvent('themeChanged', applyTheme)
      return () => tg.offEvent('themeChanged', applyTheme)
    }
  }, [])

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  useEffect(() => { setSearchQuery('') }, [activeTab])

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

  const toggleLeaderboard = async () => {
    if (!user) return;
    const newValue = !isLeaderboardJoined;
    setIsLeaderboardJoined(newValue);
    haptic('medium');

    await supabase.from('user_profiles').update({ show_in_leaderboard: newValue }).eq('telegram_id', user.id);
    
    if (newValue) {
      const { data: lbData } = await supabase.from('public_leaderboard').select('*').order('gross_profit', { ascending: false }).limit(10)
      if (lbData) setLeaderboard(lbData)
    }
  }

  const openExternalLink = (url) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank');
  }

  const fetchData = async () => {
    if (!user) return;
    
    // 1. Сделки пользователя
    const { data: dealsData } = await supabase.from('deals')
      .select('*, expenses(*), seller:seller_id(name), buyer:buyer_id(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (dealsData) setDeals(dealsData)

    // 2. Контакты пользователя
    const { data: contactsData } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('name')
    if (contactsData) setContacts(contactsData)

    // 3. Общие расходы
    const { data: genExpData } = await supabase.from('expenses').select('*').eq('user_id', user.id).is('deal_id', null).order('created_at', { ascending: false })
    if (genExpData) setGeneralExpenses(genExpData)

    // 4. Профиль и рейтинг
    const { data: profileData } = await supabase.from('user_profiles').select('*').eq('telegram_id', user.id).single()
    if (profileData) {
      setIsLeaderboardJoined(profileData.show_in_leaderboard)
    } else {
      await supabase.from('user_profiles').insert([{ telegram_id: user.id, user_name: user.first_name || 'Аноним', show_in_leaderboard: false }])
    }

    const { data: lbData } = await supabase.from('public_leaderboard').select('*').order('gross_profit', { ascending: false }).limit(10)
    if (lbData) setLeaderboard(lbData)
  }

  const addDeal = async (e) => {
    e.preventDefault()
    if (!model || !buyPrice || !user) return alert('Заполните модель и цену')
    setLoading(true)
    const { error } = await supabase.from('deals').insert([{ 
        model, buy_price: Number(buyPrice), status: 'in_stock',
        storage_gb: storage ? Number(storage) : null, battery_health: battery ? Number(battery) : null,
        imei: imei || null, seller_id: sellerId ? Number(sellerId) : null,
        user_id: user.id, user_name: user.first_name || 'Аноним'
      }])
    if (!error) { 
      setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId(''); 
      fetchData(); haptic('medium'); 
    } else { alert('Ошибка: ' + error.message) }
    setLoading(false)
  }

  const addGeneralExpense = async (e) => {
    e.preventDefault()
    if (!genExpAmount || !user) return alert('Введите сумму')
    const { error } = await supabase.from('expenses').insert([{ amount: Number(genExpAmount), category: genExpCategory, note: genExpNote || null, user_id: user.id }])
    if (!error) { setGenExpAmount(''); setGenExpNote(''); fetchData(); haptic('medium'); }
  }

  const addContact = async (e) => {
    e.preventDefault()
    if (!contactName || !user) return alert('Введите имя')
    const { error } = await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote, user_id: user.id }])
    if (!error) { setContactName(''); setContactPhone(''); setContactNote(''); fetchData(); haptic('medium'); }
  }

  const saveEditContact = async () => {
    if (!editContactName) return alert('Введите имя')
    const { error } = await supabase.from('contacts').update({ 
      name: editContactName, 
      phone: editContactPhone, 
      note: editContactNote 
    }).eq('id', editingContact.id)
    if (!error) { setEditingContact(null); fetchData(); haptic('medium'); }
  }

  const deleteContact = async (id) => {
    if (!window.confirm('Удалить контакт?')) return
    await supabase.from('contacts').delete().eq('id', id); fetchData(); haptic('heavy');
  }

  const saveEdit = async () => {
    if (!editModel || !editBuyPrice) return alert('Заполните данные')
    const updates = { 
      model: editModel, 
      buy_price: Number(editBuyPrice),
      storage_gb: editStorage ? Number(editStorage) : null,
      battery_health: editBattery ? Number(editBattery) : null
    }
    const { error } = await supabase.from('deals').update(updates).eq('id', editingDeal.id)
    if (!error) { setEditingDeal(null); fetchData(); haptic('medium'); } 
  }

  const deleteDeal = async (id) => {
    if (!window.confirm('Удалить устройство?')) return
    await supabase.from('deals').delete().eq('id', id); fetchData();
  }

  const confirmSell = async () => {
    if (!sellPrice) return alert('Введите цену')
    await supabase.from('deals').update({ sell_price: Number(sellPrice), status: 'sold', buyer_id: buyerId ? Number(buyerId) : null, sold_at: new Date().toISOString() }).eq('id', sellingDeal.id)
    setSellingDeal(null); fetchData();
  }

  const confirmExpense = async () => {
    if (!expenseAmount || !user) return alert('Введите сумму')
    await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory, user_id: user.id }])
    setExpenseDeal(null); fetchData();
  }

  const exportToCSV = () => {
    if (deals.length === 0) return alert('Нет данных')
    const headers = ['Модель', 'Закупка', 'Продажа', 'Прибыль', 'Дата'];
    const rows = deals.map(d => { const exp = getDealExpensesSum(d); const m = d.sell_price ? d.sell_price - d.buy_price - exp : ''; return [`"${d.model}"`, d.buy_price, d.sell_price || '', m, new Date(d.created_at).toLocaleDateString('ru-RU')].join(';'); });
    setCsvData([headers.join(';'), ...rows].join('\n')); setShowExportModal(true);
  }

  // СТАТИСТИКА
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
    const profit = deal.sell_price - deal.buy_price - getDealExpensesSum(deal);
    if (!acc[monthYear]) acc[monthYear] = 0; acc[monthYear] += profit; return acc;
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
    return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
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
      {deal.storage_gb && (
        <span className="badge badge-gray">
          {deal.storage_gb >= 1024 ? `${deal.storage_gb / 1024} TB` : `${deal.storage_gb} GB`}
        </span>
      )}
      {deal.battery_health && <span className="badge badge-gray">🔋 {deal.battery_health}%</span>}
      {deal.imei && <span className="badge badge-gray">IMEI: ...{deal.imei.slice(-4)}</span>}
    </div>
  )

  const renderSearchBar = () => (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <input className="input-field" type="text" placeholder="Поиск..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 40 }}/>
      <span style={{ position: 'absolute', left: 14, top: 15, fontSize: 16, color: '#888' }}>🔍</span>
    </div>
  )

  const renderHome = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Статистика</h2>
      <div className="main-profit-card">
        <h3>Чистая прибыль</h3>
        <div className="main-profit-value">{totalProfit} ₽</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <div className="stat-row"><span>Выручка:</span> <span>{totalRevenue} ₽</span></div>
          <div className="stat-row"><span>Закупки:</span> <span>{totalBuy} ₽</span></div>
          <div className="stat-row" style={{ marginBottom: 0 }}><span>Расходы:</span> <span>{totalDealExp + totalGenExp} ₽</span></div>
        </div>
      </div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h3 style={{ margin: 0, fontSize: 16, color: '#666' }}>На складе</h3><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{inStockDeals.length} шт.</div></div>
        <button className="btn-success" onClick={exportToCSV} style={{ padding: '12px 16px' }}>📥 Экспорт</button>
      </div>
      
      {/* ОБНОВЛЕННЫЙ ГРАФИК */}
      {chartData.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 15 }}>Прибыль по месяцам</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                <Tooltip cursor={{ fill: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: isDarkTheme ? '#1c1c1e' : '#ffffff', color: isDarkTheme ? '#fff' : '#000' }} />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#34c759' : '#ff3b30'} />
                  ))}
                </Bar>
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
        <form onSubmit={addGeneralExpense}>
          <input className="input-field" type="number" placeholder="Сумма (₽)" value={genExpAmount} onChange={(e) => setGenExpAmount(e.target.value)}/>
          <select className="input-field" value={genExpCategory} onChange={(e) => setGenExpCategory(e.target.value)}><option value="Реклама/Авито">Реклама/Авито</option><option value="Аренда">Аренда</option><option value="Прочее">Прочее</option></select>
          <button className="btn-primary" type="submit" style={{backgroundColor: 'var(--danger)'}}>Добавить</button>
        </form>
      </div>
      {generalExpenses.map(exp => (
        <div key={exp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginBottom: 8 }}>
          <div><div style={{ fontWeight: 600 }}>{exp.category}</div></div><div style={{ fontWeight: 700, color: 'var(--danger)' }}>-{exp.amount} ₽</div>
        </div>
      ))}
    </div>
  )

  const renderStock = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Склад</h2>
      <div className="card">
        <form onSubmit={addDeal}>
          <input className="input-field" type="text" placeholder="Модель" value={model} onChange={(e) => setModel(e.target.value)}/>
                    <input 
            className="input-field" 
            type="text" 
            inputMode="numeric" 
            placeholder="Цена закупа (₽)" 
            value={buyPrice} 
            onChange={(e) => setBuyPrice(e.target.value.replace(/[^\d]/g, ''))}
          />
          
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="input-field" value={storage} onChange={(e) => setStorage(e.target.value)}>
              <option value="">Память (ГБ)</option>
              <option value="64">64 GB</option>
              <option value="128">128 GB</option>
              <option value="256">256 GB</option>
              <option value="512">512 GB</option>
              <option value="1024">1 TB</option>
              <option value="2048">2 TB</option>
            </select>

            <input 
              className="input-field" 
              type="number" 
              placeholder="АКБ (%)" 
              min="0" 
              max="100"
              value={battery} 
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val > 100) val = 100;
                if (val < 0) val = 0;
                setBattery(val || '');
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="input-field" type="text" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} style={{ flex: 1, marginBottom: 10 }}/>
            <button type="button" onClick={() => setShowScanner(true)} style={{ marginBottom: 10, padding: '14px', backgroundColor: 'var(--warning)', color: 'white', border: 'none', borderRadius: 12 }}>📷</button>
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
        const expSum = getDealExpensesSum(deal); // Считаем расходы
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="card-header">
              <div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model}</div>
              <div>
                <button className="icon-btn" onClick={() => {
                  setEditingDeal(deal); 
                  setEditModel(deal.model); 
                  setEditBuyPrice(deal.buy_price);
                  setEditStorage(deal.storage_gb || '');
                  setEditBattery(deal.battery_health || '');
                }}>✏️</button>
                <button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button>
              </div>
            </div>
            
            {renderSpecs(deal)}
            
            {/* ВОТ ТОТ САМЫЙ БЛОК С ЦЕНОЙ И РАСХОДАМИ */}
            <div style={{ fontSize: 15, color: 'var(--text-main)', fontWeight: 500, marginTop: 10 }}>
              Закуп: {deal.buy_price} ₽ 
              {expSum > 0 && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>+ Расходы: {expSum} ₽</span>}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn-cancel" style={{ padding: '12px' }} onClick={() => {setExpenseDeal(deal); setExpenseAmount(''); setExpenseCategory('Ремонт')}}>+ Расход</button>
              <button className="btn-success" style={{ flex: 1, padding: '12px' }} onClick={() => {setSellingDeal(deal); setSellPrice(''); setBuyerId('')}}>Продать</button>
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
        const margin = deal.sell_price - deal.buy_price - getDealExpensesSum(deal); 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="card-header"><div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model}</div><div><button className="icon-btn" onClick={() => {setEditingDeal(deal); setEditModel(deal.model); setEditBuyPrice(deal.buy_price);}}>✏️</button><button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button></div></div>
            {renderSpecs(deal)}
            <div style={{ fontWeight: 700, color: margin >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>Прибыль: {margin} ₽</div>
          </div>
        )
      })}
    </div>
  )

  const renderContacts = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Контакты</h2>
      <div className="card">
        <form onSubmit={addContact}>
          <input className="input-field" type="text" placeholder="Имя" value={contactName} onChange={(e) => setContactName(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}/>
          <input className="input-field" type="text" placeholder="Комментарий (скуп, продавец 17 про макс...)" value={contactNote} onChange={(e) => setContactNote(e.target.value)}/>
          <button className="btn-primary" type="submit">Сохранить</button>
        </form>
      </div>
      {contacts.map((c) => (
        <div key={c.id} className="card" style={{ padding: 16 }}>
          <div className="card-header">
            <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name}</div>
            <div>
              <button className="icon-btn" onClick={() => {
                setEditingContact(c); 
                setEditContactName(c.name); 
                setEditContactPhone(c.phone || '');
                setEditContactNote(c.note || '');
              }}>✏️</button>
              <button className="icon-btn" onClick={() => deleteContact(c.id)}>🗑️</button>
            </div>
          </div>
          {c.phone && <div style={{ color: 'var(--accent)', marginTop: 4 }}>📞 {c.phone}</div>}
          {c.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>📝 {c.note}</div>}
          
          <div style={{ color: '#aaa', fontSize: 11, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            Добавлен: {new Date(c.created_at).toLocaleDateString('ru-RU')}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="app-container">
      <button className="hamburger-btn" onClick={() => { setIsMenuOpen(true); haptic(); }} style={{ position: 'absolute', top: 16, left: 16 }}>☰</button>

      {activeTab === 'home' && renderHome()}
      {activeTab === 'stock' && renderStock()}
      {activeTab === 'deals' && renderDeals()}
      {activeTab === 'finance' && renderFinance()}
      {activeTab === 'contacts' && renderContacts()}

      {/* БОКОВОЕ МЕНЮ */}
      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="profile-section">
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>
            {user?.photo_url ? <img src={user.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.first_name ? user.first_name[0].toUpperCase() : 'U')}
          </div>
          <div><div className="profile-name">{user?.first_name || 'Пользователь'}</div><div className="profile-status">{user?.username ? `@${user.username}` : 'PrimeTrade Pro'}</div></div>
        </div>

        <div className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
           
           <button 
             onClick={() => { setShowSubModal(true); setIsMenuOpen(false); }}
             style={{
               width: '100%', padding: '16px',
               background: 'linear-gradient(135deg, #ff9500, #ff3b30)',
               color: 'white', border: 'none', borderRadius: '12px',
               fontWeight: 'bold', fontSize: '16px',
               display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
               boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)'
             }}
           >
             ⭐ Моя подписка
           </button>
           
           {isLeaderboardJoined && (
             <button 
               onClick={() => { setShowLeaderboardModal(true); setIsMenuOpen(false); }}
               style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
             >
               🏆 Рейтинг перекупов
             </button>
           )}

           <button 
             onClick={() => { setShowGuideModal(true); setIsMenuOpen(false); }}
             style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
           >
             📚 Как пользоваться
           </button>
           
           {/* Кнопка "Пригласи друга" */}
           <button 
             onClick={() => {
               const refLink = `https://t.me/Primetrade8_bot?start=ref_${user?.id}`;
               const shareText = `Привет! Попробуй PrimeTrade — удобное приложение для учета техники Apple прямо в Telegram 🍏`;
               window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
               haptic('medium');
             }}
             style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
           >
             🎁 Пригласи друга
           </button>

           {/* Кнопка "Предложить идею" */}
           <button 
             onClick={() => {
               const feedbackText = `Привет! У меня есть идея по улучшению PrimeTrade: `;
               window.open(`https://t.me/primestore8?text=${encodeURIComponent(feedbackText)}`, '_blank');
               haptic('medium');
             }}
             style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
           >
             💡 Предложить идею
           </button>
           
           <button 
             onClick={() => { setShowSettingsModal(true); setIsMenuOpen(false); }}
             style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}
           >
             ⚙️ Настройки
           </button>
        </div>
        <div className="sidebar-footer">
          <div style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 'bold'}}>Конфиденциальность и поддержка</div>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Polzovatelskoe-soglashenie-10-19-40'); }}>Пользовательское соглашение</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Politika-konfidencialnosti-10-19-87'); }}>Политика конфиденциальности</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://t.me/primestore8'); }} style={{ color: 'var(--accent)' }}>Служба поддержки: @primestore8</a>
        </div>
      </div>

      {/* МОДАЛКИ */}
      {showSettingsModal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Настройки</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}>
            <span>Тёмная тема</span>
            <button onClick={toggleTheme} style={{ padding: '8px 16px', borderRadius: 20, background: isDarkTheme ? '#34c759' : '#e5e5ea', color: isDarkTheme ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65 }}>{isDarkTheme ? 'ВКЛ' : 'ВЫКЛ'}</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div>
              <div style={{ fontWeight: 'bold' }}>Рейтинг перекупов</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Показывать мою прибыль другим</div>
            </div>
            <button onClick={toggleLeaderboard} style={{ padding: '8px 16px', borderRadius: 20, background: isLeaderboardJoined ? '#34c759' : '#e5e5ea', color: isLeaderboardJoined ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65 }}>{isLeaderboardJoined ? 'ВКЛ' : 'ВЫКЛ'}</button>
          </div>

          <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowSettingsModal(false)}>Закрыть</button></div>
        </div></div>
      )}
      {showGuideModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>📚 Как пользоваться</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>1. Добавление на склад</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>
                  Перейдите во вкладку «Склад». Введите модель, цену закупа, память и состояние АКБ. Для быстрого ввода IMEI нажмите на оранжевую кнопку с камерой 📷 и наведите на штрихкод коробки.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>2. Продажа устройства</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>
                  Когда вы продали телефон, найдите его на вкладке «Склад» и нажмите кнопку «Продать». Введите сумму продажи. Телефон автоматически переедет во вкладку «Сделки», а прибыль пересчитается на главном экране.
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>3. Учет расходов</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>
                  Если вы потратились на ремонт, такси или запчасти для конкретного телефона, нажмите «+ Расход» на его карточке. Общие траты (аренда, реклама) вносите во вкладке «Финансы».
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>4. Контакты</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>
                  Записывайте людей, с которыми работаете. Оставляйте заметки («торгуется», «кинул», «скуп»), чтобы в будущем быстрее принимать решения.
                </div>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 25 }}>
              <button className="btn-confirm" style={{ backgroundColor: 'var(--accent)' }} onClick={() => setShowGuideModal(false)}>Понятно</button>
            </div>
          </div>
        </div>
      )}
      {showLeaderboardModal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>🏆 Топ перекупов</h3>
          <p style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 15}}>Рейтинг по общей прибыли с проданных устройств.</p>
          {leaderboard.map((lb, idx) => (
            <div key={lb.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}.`}</span>
                <span style={{ fontWeight: 600 }}>{lb.user_name} {lb.user_id === user.id ? '(Вы)' : ''}</span>
              </div>
              <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{lb.gross_profit} ₽</span>
            </div>
          ))}
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowLeaderboardModal(false)}>Закрыть</button></div>
        </div></div>
      )}

      {showSubModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}><div className="modal-content">
            <h3 style={{ textAlign: 'center' }}>PrimeTrade PRO</h3>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Пробный период: <strong style={{ color: '#34c759' }}>14 дней</strong></p>
            <div className="pricing-grid">
              <div className="pricing-card" onClick={() => alert('Переход к оплате за 390 ₽...')}><div><div style={{ fontWeight: 'bold' }}>1 месяц</div><div style={{ fontSize: 12 }}>390 ₽ / мес</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div>
              <div className="pricing-card" onClick={() => alert('Переход к оплате за 1990 ₽...')}><div><div style={{ fontWeight: 'bold' }}>6 месяцев</div><div style={{ fontSize: 12 }}>1990 ₽</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div>
              <div className="pricing-card best-value" onClick={() => alert('Переход к оплате за 3590 ₽...')}><div className="best-value-badge">ВЫГОДНО</div><div><div style={{ fontWeight: 'bold' }}>12 месяцев</div><div style={{ fontSize: 12 }}>3590 ₽</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div>
            </div>
            <div className="modal-actions" style={{ marginTop: 20 }}><button className="btn-cancel" onClick={() => setShowSubModal(false)}>Закрыть</button></div>
        </div></div>
      )}

            {sellingDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Продажа: {sellingDeal.model}</h3>
            <input 
              className="input-field" 
              type="text" 
              inputMode="numeric" 
              placeholder="Цена (₽)" 
              value={sellPrice} 
              onChange={(e) => setSellPrice(e.target.value.replace(/[^\d]/g, ''))} 
              autoFocus
            />
            <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}>
              <option value="">Кто купил?</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button>
              <button className="btn-confirm" onClick={confirmSell}>Продать</button>
            </div>
          </div>
        </div>
      )}
            {expenseDeal && (
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
            </select>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setExpenseDeal(null)}>Отмена</button>
              <button className="btn-confirm" onClick={confirmExpense}>Добавить</button>
            </div>
          </div>
        </div>
      )}
      {editingDeal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Редактировать: {editingDeal.model}</h3>
            
            <label style={{fontSize: 12, color: '#888'}}>Модель</label>
            <input className="input-field" type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)}/>
            
            <label style={{fontSize: 12, color: '#888'}}>Цена закупа (₽)</label>
            <input 
  className="input-field" 
  type="text" 
  inputMode="numeric" 
  value={editBuyPrice} 
  onChange={(e) => setEditBuyPrice(e.target.value.replace(/[^\d]/g, ''))}
/>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{fontSize: 12, color: '#888'}}>Память</label>
                <select className="input-field" value={editStorage} onChange={(e) => setEditStorage(e.target.value)}>
                  <option value="">Не указано</option>
                  <option value="64">64 GB</option>
                  <option value="128">128 GB</option>
                  <option value="256">256 GB</option>
                  <option value="512">512 GB</option>
                  <option value="1024">1 TB</option>
                  <option value="2048">2 TB</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{fontSize: 12, color: '#888'}}>АКБ (%)</label>
                <input 
                  className="input-field" 
                  type="number" 
                  min="0" 
                  max="100"
                  value={editBattery} 
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 100) val = 100;
                    if (val < 0) val = 0;
                    setEditBattery(val || '');
                  }}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="btn-cancel" onClick={() => setEditingDeal(null)}>Отмена</button>
              <button className="btn-confirm" onClick={saveEdit}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
      
      {editingContact && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Редактировать контакт</h3>
            <label style={{fontSize: 12, color: '#888'}}>Имя</label>
            <input className="input-field" type="text" value={editContactName} onChange={(e) => setEditContactName(e.target.value)}/>
            <label style={{fontSize: 12, color: '#888'}}>Телефон</label>
            <input className="input-field" type="text" value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)}/>
            <label style={{fontSize: 12, color: '#888'}}>Комментарий</label>
            <input className="input-field" type="text" value={editContactNote} onChange={(e) => setEditContactNote(e.target.value)}/>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingContact(null)}>Отмена</button>
              <button className="btn-confirm" onClick={saveEditContact}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
      
      {showExportModal && (<div className="modal-overlay"><div className="modal-content"><h3>Экспорт</h3><textarea value={csvData} readOnly style={{ width: '100%', height: 150, padding: 10, borderRadius: 12, border: '1px solid #ccc', fontSize: 12, marginBottom: 15 }} /><div className="modal-actions"><button className="btn-cancel" onClick={() => setShowExportModal(false)}>Закрыть</button><button className="btn-confirm" onClick={() => { navigator.clipboard.writeText(csvData); alert('Скопировано!'); setShowExportModal(false); }}>Копировать</button></div></div></div>)}
      
      {showScanner && (<Scanner onScan={(text) => setImei(text)} onClose={() => setShowScanner(false)} />)}

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