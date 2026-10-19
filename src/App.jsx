import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import Scanner from './Scanner'
import './App.css'

const DEVICE_CATALOG = {
  'iPhone': [
    "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone SE (2020)", "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone SE (2022)", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
    "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 18", "iPhone 18 Pro", "iPhone 18 Pro Max", "iPhone Duo"
  ],
  'iPad': [
    "iPad 9", "iPad 10", "iPad Air 4", "iPad Air 5", "iPad Air 6", "iPad Pro 11 (2021)", "iPad Pro 12.9 (2021)", "iPad Pro 11 (2022)", "iPad Pro 12.9 (2022)", "iPad Pro M4"
  ],
  'MacBook': [
    "MacBook Air M1", "MacBook Air M2", "MacBook Air M3", "MacBook Pro 13 M1", "MacBook Pro 14 M1", "MacBook Pro 16 M1", "MacBook Pro 14 M3", "MacBook Pro 16 M3"
  ],
  'Apple Watch': [
    "Apple Watch Series 4", "Apple Watch Series 5", "Apple Watch Series 6", "Apple Watch SE (2020)", 
    "Apple Watch Series 7", "Apple Watch Series 8", "Apple Watch SE (2022)", "Apple Watch Ultra", 
    "Apple Watch Series 9", "Apple Watch Ultra 2", "Apple Watch Series 10", "Apple Watch Series 11", 
    "Apple Watch Series 12", "Apple Watch Ultra 3"
  ],
  'AirPods': [
    "AirPods 2", "AirPods 3", "AirPods 4", "AirPods 5", 
    "AirPods Pro", "AirPods Pro 2", "AirPods Pro 3", 
    "AirPods Max"
  ]
};

const MY_CHANNEL_URL = "https://t.me/ваш_канал_тут"

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [generalExpenses, setGeneralExpenses] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [showModelPicker, setShowModelPicker] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [modelCategory, setModelCategory] = useState('iPhone')
  const [pickerMode, setPickerMode] = useState('purchase')
  const [filterModels, setFilterModels] = useState([])

  const [showExportModal, setShowExportModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [isLeaderboardJoined, setIsLeaderboardJoined] = useState(false)
  const [showSuccessMsg, setShowSuccessMsg] = useState(false)

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
  const [expenseDeal, setExpenseDeal] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Ремонт')

  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')
  const [buyerId, setBuyerId] = useState('')
  const [sellWarranty, setSellWarranty] = useState('0')
  
  const [editingDeal, setEditingDeal] = useState(null)
  const [editModel, setEditModel] = useState('')
  const [editBuyPrice, setEditBuyPrice] = useState('')

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

  useEffect(() => { if (user) fetchData() }, [user])
  useEffect(() => { setSearchQuery(''); setFilterModels([]); }, [activeTab])

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
      const { data } = await supabase.from('public_leaderboard').select('*').order('gross_profit', { ascending: false }).limit(10)
      if (data) setLeaderboard(data)
    }
  }

  const openExternalLink = (url) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank');
  }

  const fetchData = async () => {
    if (!user) return;
    const { data: dealsData } = await supabase.from('deals').select('*, expenses(*), seller:seller_id(name), buyer:buyer_id(name)').eq('user_id', user.id).order('created_at', { ascending: false })
    if (dealsData) setDeals(dealsData)

    const { data: contactsData } = await supabase.from('contacts').select('*').eq('user_id', user.id).order('name')
    if (contactsData) setContacts(contactsData)

    const { data: genExpData } = await supabase.from('expenses').select('*').eq('user_id', user.id).is('deal_id', null).order('created_at', { ascending: false })
    if (genExpData) setGeneralExpenses(genExpData)

    const { data: profileData } = await supabase.from('user_profiles').select('*').eq('telegram_id', user.id).single()
    if (profileData) setIsLeaderboardJoined(profileData.show_in_leaderboard)
    else await supabase.from('user_profiles').insert([{ telegram_id: user.id, user_name: user.first_name || 'Аноним', show_in_leaderboard: false }])

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
      fetchData(); haptic('medium'); setShowSuccessMsg(true); setTimeout(() => setShowSuccessMsg(false), 3000);
    } else { alert('Ошибка: ' + error.message) }
    setLoading(false)
  }

  const confirmSell = async () => {
    if (!sellPrice) return alert('Введите цену')
    await supabase.from('deals').update({ 
      sell_price: Number(sellPrice), status: 'sold', 
      buyer_id: buyerId ? Number(buyerId) : null, 
      sold_at: new Date().toISOString(),
      warranty_months: Number(sellWarranty)
    }).eq('id', sellingDeal.id)
    setSellingDeal(null); fetchData();
  }

  const clearAllData = async () => {
    if (!window.confirm('ВНИМАНИЕ! Это удалит ВСЕ сделки, расходы и контакты. Продолжить?')) return;
    setLoading(true);
    try {
      await supabase.from('deals').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('contacts').delete().eq('user_id', user.id);
      fetchData(); haptic('heavy');
    } catch (error) { alert('Ошибка: ' + error.message); } 
    finally { setLoading(false); }
  };

  const addGeneralExpense = async (e) => { e.preventDefault(); if (!genExpAmount || !user) return; await supabase.from('expenses').insert([{ amount: Number(genExpAmount), category: genExpCategory, note: genExpNote || null, user_id: user.id }]); setGenExpAmount(''); setGenExpNote(''); fetchData(); }
  const addContact = async (e) => { e.preventDefault(); if (!contactName || !user) return; await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote, user_id: user.id }]); setContactName(''); setContactPhone(''); setContactNote(''); fetchData(); }
  const deleteDeal = async (id) => { if (!window.confirm('Удалить устройство?')) return; await supabase.from('deals').delete().eq('id', id); fetchData(); }
  const confirmExpense = async () => { if (!expenseAmount || !user) return; await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory, user_id: user.id }]); setExpenseDeal(null); fetchData(); }
  const saveEditContact = async () => { if (!editContactName) return; await supabase.from('contacts').update({ name: editContactName, phone: editContactPhone, note: editContactNote }).eq('id', editingContact.id); setEditingContact(null); fetchData(); }
  const deleteContact = async (id) => { if (!window.confirm('Удалить контакт?')) return; await supabase.from('contacts').delete().eq('id', id); fetchData(); }
  const saveEdit = async () => { if (!editModel || !editBuyPrice) return; await supabase.from('deals').update({ model: editModel, buy_price: Number(editBuyPrice) }).eq('id', editingDeal.id); setEditingDeal(null); fetchData(); }

  const handleModelSelect = (modelName) => {
    haptic();
    if (pickerMode === 'purchase') {
      setModel(modelName);
      setShowModelPicker(false);
      setModelSearch('');
    } else {
      setFilterModels(prev => 
        prev.includes(modelName) ? prev.filter(m => m !== modelName) : [...prev, modelName]
      );
    }
  }

  const removeFilterModel = (modelName) => {
    haptic();
    setFilterModels(prev => prev.filter(m => m !== modelName));
  }

  const soldDeals = deals.filter(d => d.status === 'sold')
  const inStockDeals = deals.filter(d => d.status === 'in_stock')
  const totalBuy = deals.reduce((sum, deal) => sum + (Number(deal.buy_price) || 0), 0)
  const totalDealExp = deals.reduce((sum, deal) => sum + (deal.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0), 0)
  const totalGenExp = generalExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0)
  const totalRevenue = soldDeals.reduce((sum, deal) => sum + (Number(deal.sell_price) || 0), 0)
  const totalProfit = totalRevenue - totalBuy - totalDealExp - totalGenExp
  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const monthlyProfits = soldDeals.reduce((acc, deal) => {
    const date = new Date(deal.sold_at || deal.created_at || Date.now());
    const monthYear = date.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
    const profit = (Number(deal.sell_price) || 0) - (Number(deal.buy_price) || 0) - getDealExpensesSum(deal);
    if (!acc[monthYear]) acc[monthYear] = 0; acc[monthYear] += profit; return acc;
  }, {});
  const chartData = Object.entries(monthlyProfits).map(([name, profit]) => ({ name, profit })).reverse();

  const filterDealsByQuery = (list) => {
    return list.filter(deal => {
      const matchesModel = filterModels.length > 0 ? filterModels.includes(deal.model) : true;
      const matchesSearch = searchQuery ? (String(deal.model || '').toLowerCase().includes(searchQuery.toLowerCase()) || (deal.imei && String(deal.imei).includes(searchQuery))) : true;
      return matchesModel && matchesSearch;
    })
  }
  const filteredStock = filterDealsByQuery(inStockDeals);
  const filteredSold = filterDealsByQuery(soldDeals);

  const getDaysOnStock = (deal) => {
    const start = new Date(deal.created_at || Date.now());
    const end = (deal.status === 'sold' && deal.sold_at) ? new Date(deal.sold_at) : new Date();
    return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  }

  const getWarrantyBadge = (deal) => {
    if (!deal.warranty_months || deal.warranty_months === 0) return null;
    const end = new Date(deal.sold_at || Date.now());
    end.setMonth(end.getMonth() + Number(deal.warranty_months));
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) return <span className="badge badge-green" style={{marginTop: 6, display: 'inline-block'}}>🛡️ Гарантия до {end.toLocaleDateString('ru-RU')} ({daysLeft} дн.)</span>
    return <span className="badge badge-red" style={{marginTop: 6, display: 'inline-block'}}>🛡️ Гарантия истекла {end.toLocaleDateString('ru-RU')}</span>
  }

  const renderSpecs = (deal) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 10 }}>
      {getDaysOnStock(deal) > 0 && <span className={`badge ${deal.status === 'sold' ? 'badge-gray' : 'badge-green'}`}>⏱ {getDaysOnStock(deal)} дн.</span>}
      {deal.storage_gb && <span className="badge badge-gray">{deal.storage_gb >= 1024 ? `${deal.storage_gb / 1024} TB` : `${deal.storage_gb} GB`}</span>}
      {deal.battery_health && <span className="badge badge-gray">🔋 {deal.battery_health}%</span>}
      {deal.imei && <span className="badge badge-gray">IMEI: ...{String(deal.imei).slice(-4)}</span>}
    </div>
  )

  const renderHome = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Статистика</h2>
      <div className="main-profit-card">
        <h3>Чистая прибыль</h3>
        <div className="main-profit-value" style={{ fontSize: totalProfit > 999999 ? 28 : 38 }}>{(totalProfit || 0).toLocaleString('ru-RU')} ₽</div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
          <div className="stat-row"><span>Выручка:</span> <span>{(totalRevenue || 0).toLocaleString('ru-RU')} ₽</span></div>
          <div className="stat-row"><span>Закупки:</span> <span>{(totalBuy || 0).toLocaleString('ru-RU')} ₽</span></div>
          <div className="stat-row" style={{ marginBottom: 0 }}><span>Расходы:</span> <span>{((totalDealExp + totalGenExp) || 0).toLocaleString('ru-RU')} ₽</span></div>
        </div>
      </div>

      <button onClick={clearAllData} disabled={loading} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--card-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        🗑️ Очистить статистику
      </button>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h3 style={{ margin: 0, fontSize: 16, color: '#666' }}>На складе</h3><div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{inStockDeals.length} шт.</div></div>
        <button className="btn-success" onClick={() => { setCsvData(''); setShowExportModal(true); }} style={{ padding: '12px 16px' }}>📥 Экспорт</button>
      </div>
      
      {chartData.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 15 }}>Прибыль по месяцам</h3>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                <Tooltip cursor={{ fill: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: isDarkTheme ? '#1c1c1e' : '#ffffff', color: isDarkTheme ? '#fff' : '#000' }} formatter={(value) => [`${(value || 0).toLocaleString('ru-RU')} ₽`, 'Прибыль']} />
                <Bar dataKey="profit" maxBarSize={45} radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#34c759' : '#ff3b30'} />)}
                  <LabelList dataKey="profit" position="center" fill="#ffffff" style={{ fontWeight: 'bold', fontSize: 13, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }} formatter={(value) => { if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M'; if (value >= 1000) return (value / 1000).toFixed(0) + 'k'; return value; }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )

  const renderPurchase = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Покупка</h2>
      <div className="card">
        <h3 style={{ fontSize: 16, marginTop: 0 }}>Добавить устройство</h3>
        <form onSubmit={addDeal}>
          <div className="input-field" onClick={() => { setPickerMode('purchase'); setShowModelPicker(true); haptic(); }} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: model ? 'var(--text-main)' : 'var(--text-muted)' }}>{model || 'Выберите модель устройства...'}</span>
            <span style={{ opacity: 0.5 }}>▼</span>
          </div>

          <input className="input-field" type="text" inputMode="numeric" placeholder="Цена закупа (₽)" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value.replace(/[^\d]/g, ''))}/>
          
          <div style={{ display: 'flex', gap: 10 }}>
            <select className="input-field" value={storage} onChange={(e) => setStorage(e.target.value)}>
              <option value="">Память (ГБ)</option>
              <option value="64">64 GB</option><option value="128">128 GB</option><option value="256">256 GB</option>
              <option value="512">512 GB</option><option value="1024">1 TB</option><option value="2048">2 TB</option>
            </select>
            <input className="input-field" type="text" inputMode="numeric" placeholder="АКБ (%)" min="0" max="100" value={battery} onChange={(e) => { let val = Number(e.target.value.replace(/[^\d]/g, '')); if (val > 100) val = 100; setBattery(val || ''); }}/>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input className="input-field" type="text" placeholder="IMEI" value={imei} onChange={(e) => setImei(e.target.value)} style={{ marginBottom: 10, paddingRight: 35 }}/>
              {imei && <button type="button" onClick={() => { setImei(''); haptic(); }} style={{ position: 'absolute', right: 10, top: 14, background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>✕</button>}
            </div>
            <button type="button" onClick={() => setShowScanner(true)} style={{ marginBottom: 10, padding: '14px', backgroundColor: 'var(--warning)', color: 'white', border: 'none', borderRadius: 12 }}>📷</button>
          </div>
          
          <select className="input-field" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
            <option value="">Кто продал? (Необязательно)</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить на склад'}</button>
          
          {showSuccessMsg && <div style={{ marginTop: 10, padding: 12, backgroundColor: 'rgba(52, 199, 89, 0.15)', color: '#34c759', textAlign: 'center', borderRadius: 12, fontSize: 14, fontWeight: 'bold' }}>✅ Устройство успешно сохранено!</div>}
          
          <button type="button" onClick={() => { setActiveTab('stock'); haptic(); }} style={{ marginTop: 12, width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: 12, fontWeight: 'bold', fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>📦 Перейти на склад</button>
        </form>
      </div>
    </div>
  )

  const renderStock = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Склад</h2>
      {inStockDeals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input className="input-field" type="text" placeholder="Поиск по IMEI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 35 }}/>
              <span style={{ position: 'absolute', left: 12, top: 15, fontSize: 14, color: '#888' }}>🔍</span>
            </div>
            <button className="input-field" style={{ flex: 1, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '14px 16px' }} onClick={() => { setPickerMode('stock'); setShowModelPicker(true); haptic(); }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: filterModels.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{filterModels.length > 0 ? `Выбрано: ${filterModels.length}` : 'Все модели'}</span>
              <span style={{ opacity: 0.5 }}>▼</span>
            </button>
          </div>
          {filterModels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {filterModels.map(m => (
                <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: 'var(--accent)', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>
                  {m}
                  <button onClick={() => removeFilterModel(m)} style={{ background: 'none', border: 'none', color: 'white', padding: 0, fontSize: 14, cursor: 'pointer', display: 'flex' }}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {filteredStock.map((deal) => (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="card-header"><div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model || 'Без названия'}</div><div><button className="icon-btn" onClick={() => {setEditingDeal(deal); setEditModel(deal.model || ''); setEditBuyPrice(deal.buy_price || '');}}>✏️</button><button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button></div></div>
            {renderSpecs(deal)}
            <div style={{ fontSize: 15, color: 'var(--text-main)', fontWeight: 500, marginTop: 10 }}>Закуп: {(Number(deal.buy_price) || 0).toLocaleString('ru-RU')} ₽ {getDealExpensesSum(deal) > 0 && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>+ Расходы: {getDealExpensesSum(deal).toLocaleString('ru-RU')} ₽</span>}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Дата закупа: {new Date(deal.created_at || Date.now()).toLocaleDateString('ru-RU')}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><button className="btn-cancel" style={{ padding: '12px' }} onClick={() => {setExpenseDeal(deal); setExpenseAmount('');}}>+ Расход</button><button className="btn-success" style={{ flex: 1, padding: '12px' }} onClick={() => {setSellingDeal(deal); setSellPrice(''); setSellWarranty('0');}}>Продать</button></div>
          </div>
      ))}
    </div>
  )

  const renderDeals = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Сделки</h2>
      {soldDeals.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input className="input-field" type="text" placeholder="Поиск по IMEI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 35 }}/>
              <span style={{ position: 'absolute', left: 12, top: 15, fontSize: 14, color: '#888' }}>🔍</span>
            </div>
            <button className="input-field" style={{ flex: 1, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '14px 16px' }} onClick={() => { setPickerMode('deals'); setShowModelPicker(true); haptic(); }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: filterModels.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{filterModels.length > 0 ? `Выбрано: ${filterModels.length}` : 'Все модели'}</span>
              <span style={{ opacity: 0.5 }}>▼</span>
            </button>
          </div>
          {filterModels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {filterModels.map(m => (
                <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: 'var(--accent)', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>
                  {m}
                  <button onClick={() => removeFilterModel(m)} style={{ background: 'none', border: 'none', color: 'white', padding: 0, fontSize: 14, cursor: 'pointer', display: 'flex' }}>✕</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {filteredSold.map((deal) => {
        const margin = (Number(deal.sell_price) || 0) - (Number(deal.buy_price) || 0) - getDealExpensesSum(deal); 
        return (
          <div key={deal.id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
            <div className="card-header"><div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model || 'Без названия'}</div><div><button className="icon-btn" onClick={() => {setEditingDeal(deal); setEditModel(deal.model || ''); setEditBuyPrice(deal.buy_price || '');}}>✏️</button><button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button></div></div>
            {renderSpecs(deal)}
            <div style={{ marginBottom: 10 }}>{getWarrantyBadge(deal)}</div>
            <div style={{ fontSize: 15, color: 'var(--text-main)', fontWeight: 500 }}>Закуп: {(Number(deal.buy_price) || 0).toLocaleString('ru-RU')} ₽ | Продажа: {(Number(deal.sell_price) || 0).toLocaleString('ru-RU')} ₽</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Куплен: {new Date(deal.created_at || Date.now()).toLocaleDateString('ru-RU')} • Продан: {deal.sold_at ? new Date(deal.sold_at).toLocaleDateString('ru-RU') : '-'}</div>
            {deal.expenses && deal.expenses.length > 0 && <div style={{ fontSize: 13, color: 'var(--danger)', marginTop: 6, backgroundColor: 'rgba(255, 59, 48, 0.05)', padding: '6px 8px', borderRadius: 6 }}>{deal.expenses.map(e => `${e.category}: ${e.amount}₽`).join(' • ')}</div>}
            <div style={{ fontWeight: 700, color: margin >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16, marginTop: 10 }}>Чистая прибыль: {margin.toLocaleString('ru-RU')} ₽</div>
          </div>
        )
      })}
    </div>
  )

  const renderFinance = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Доп. расходы</h2>
      <div className="card"><form onSubmit={addGeneralExpense}><input className="input-field" type="text" inputMode="numeric" placeholder="Сумма (₽)" value={genExpAmount} onChange={(e) => setGenExpAmount(e.target.value.replace(/[^\d]/g, ''))}/><select className="input-field" value={genExpCategory} onChange={(e) => setGenExpCategory(e.target.value)}><option value="Реклама/Авито">Реклама/Авито</option><option value="Аренда">Аренда</option><option value="Прочее">Прочее</option></select><button className="btn-primary" type="submit" style={{backgroundColor: 'var(--danger)'}}>Добавить</button></form></div>
      {generalExpenses.map(exp => (<div key={exp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginBottom: 8 }}><div><div style={{ fontWeight: 600 }}>{exp.category}</div></div><div style={{ fontWeight: 700, color: 'var(--danger)' }}>-{(Number(exp.amount) || 0).toLocaleString('ru-RU')} ₽</div></div>))}
    </div>
  )

  const renderContacts = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Контакты</h2>
      <div className="card"><form onSubmit={addContact}><input className="input-field" type="text" placeholder="Имя" value={contactName} onChange={(e) => setContactName(e.target.value)}/><input className="input-field" type="text" placeholder="Телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}/><input className="input-field" type="text" placeholder="Комментарий" value={contactNote} onChange={(e) => setContactNote(e.target.value)}/><button className="btn-primary" type="submit">Сохранить</button></form></div>
      {contacts.map((c) => (<div key={c.id} className="card" style={{ padding: 16 }}><div className="card-header"><div style={{ fontWeight: 600, fontSize: 16 }}>{c.name || 'Без имени'}</div><div><button className="icon-btn" onClick={() => {setEditingContact(c); setEditContactName(c.name || ''); setEditContactPhone(c.phone || ''); setEditContactNote(c.note || '');}}>✏️</button><button className="icon-btn" onClick={() => deleteContact(c.id)}>🗑️</button></div></div>{c.phone && <div style={{ color: 'var(--accent)', marginTop: 4 }}>📞 {c.phone}</div>}{c.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>📝 {c.note}</div>}<div style={{ color: '#aaa', fontSize: 11, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>Добавлен: {new Date(c.created_at || Date.now()).toLocaleDateString('ru-RU')}</div></div>))}
    </div>
  )

  return (
    <div className="app-container">
      <button className="hamburger-btn" onClick={() => { setIsMenuOpen(true); haptic(); }} style={{ position: 'absolute', top: 16, left: 16 }}>☰</button>

      {activeTab === 'home' && renderHome()}
      {activeTab === 'purchase' && renderPurchase()}
      {activeTab === 'stock' && renderStock()}
      {activeTab === 'deals' && renderDeals()}
      {activeTab === 'finance' && renderFinance()}
      {activeTab === 'contacts' && renderContacts()}

      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`} style={{ overflow: 'hidden' }}>
        <div className="profile-section">
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>{user?.photo_url ? <img src={user.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.first_name ? user.first_name[0].toUpperCase() : 'U')}</div>
          <div><div className="profile-name">{user?.first_name || 'Пользователь'}</div><div className="profile-status">{user?.username ? `@${user.username}` : 'iTrade Pro'}</div></div>
        </div>

        <div className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, overflowY: 'auto' }}>
           <button onClick={() => { setShowSubModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ff9500, #ff3b30)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(255, 149, 0, 0.3)' }}>⭐ Моя подписка</button>
           <button onClick={() => { openExternalLink(MY_CHANNEL_URL); haptic('medium'); }} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(36, 129, 204, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🛍 Мой канал</button>
           {isLeaderboardJoined && <button onClick={() => { setShowLeaderboardModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🏆 Рейтинг перекупов</button>}
           <button onClick={() => { setShowGuideModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>📚 Как пользоваться</button>
           <button onClick={() => { const refLink = `https://t.me/Primetrade8_bot?start=ref_${user?.id || ''}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Попробуй iTrade!')}`, '_blank'); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🎁 Пригласи друга</button>
           <button onClick={() => { window.open(`https://t.me/primestore8?text=${encodeURIComponent('Привет! Идея: ')}`, '_blank'); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>💡 Предложить идею</button>
           <button onClick={() => { setShowSettingsModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>⚙️ Настройки</button>
        </div>

        <div className="sidebar-footer">
          <div style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, fontWeight: 'bold'}}>Поддержка</div>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Polzovatelskoe-soglashenie-10-19-40'); }}>Пользовательское соглашение</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://telegra.ph/Politika-konfidencialnosti-10-19-87'); }}>Политика конфиденциальности</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); openExternalLink('https://t.me/primestore8'); }} style={{ color: 'var(--accent)' }}>Служба поддержки: @primestore8</a>
        </div>
      </div>

      {showModelPicker && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0 }}>{pickerMode === 'purchase' ? 'Выберите устройство' : 'Выберите модели (можно несколько)'}</h3>
            
            <input className="input-field" type="text" placeholder="Поиск (например, 15 pro)..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} style={{ marginBottom: 10 }}/>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 5, paddingBottom: 10, marginBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
              {Object.keys(DEVICE_CATALOG).map(cat => (
                <button key={cat} onClick={() => setModelCategory(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', backgroundColor: modelCategory === cat ? 'var(--accent)' : 'var(--bg-color)', color: modelCategory === cat ? '#fff' : 'var(--text-main)', fontWeight: 'bold', fontSize: 13, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(DEVICE_CATALOG[modelCategory] || []).filter(m => String(m).toLowerCase().includes(modelSearch.toLowerCase())).map(m => {
                  const isSelected = pickerMode !== 'purchase' && filterModels.includes(m);
                  return (
                    <div key={m} onClick={() => handleModelSelect(m)} style={{ padding: '12px 16px', backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-color)', color: isSelected ? 'white' : 'var(--text-main)', borderRadius: 10, cursor: 'pointer', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {m}
                      {isSelected && <span>✓</span>}
                    </div>
                  )
                })
              }
            </div>
            
            <div className="modal-actions" style={{ marginTop: 15 }}>
              <button className="btn-primary" style={{ backgroundColor: pickerMode === 'purchase' ? 'var(--bg-color)' : 'var(--success)', color: pickerMode === 'purchase' ? 'var(--text-main)' : 'white' }} onClick={() => setShowModelPicker(false)}>
                {pickerMode === 'purchase' ? 'Отмена' : 'Готово'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sellingDeal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Продажа: {sellingDeal.model || 'Устройство'}</h3>
            <input className="input-field" type="text" inputMode="numeric" placeholder="Цена (₽)" value={sellPrice} onChange={(e) => setSellPrice(e.target.value.replace(/[^\d]/g, ''))} autoFocus/>
            <select className="input-field" value={buyerId} onChange={(e) => setBuyerId(e.target.value)}><option value="">Кто купил?</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            
            <label style={{fontSize: 12, color: '#888', marginTop: 5, display: 'block'}}>Гарантия</label>
            <select className="input-field" value={sellWarranty} onChange={(e) => setSellWarranty(e.target.value)}>
              <option value="0">Без гарантии</option>
              <option value="1">1 месяц</option>
              <option value="3">3 месяца</option>
              <option value="6">6 месяцев</option>
              <option value="12">1 год</option>
            </select>

            <div className="modal-actions"><button className="btn-cancel" onClick={() => setSellingDeal(null)}>Отмена</button><button className="btn-confirm" onClick={confirmSell}>Продать</button></div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="modal-overlay"><div className="modal-content">
          <h3>Настройки</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0' }}><span>Тёмная тема</span><button onClick={toggleTheme} style={{ padding: '8px 16px', borderRadius: 20, background: isDarkTheme ? '#34c759' : '#e5e5ea', color: isDarkTheme ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65 }}>{isDarkTheme ? 'ВКЛ' : 'ВЫКЛ'}</button></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', borderTop: '1px solid var(--border)', paddingTop: 20 }}><div><div style={{ fontWeight: 'bold' }}>Рейтинг перекупов</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Показывать мою прибыль</div></div><button onClick={toggleLeaderboard} style={{ padding: '8px 16px', borderRadius: 20, background: isLeaderboardJoined ? '#34c759' : '#e5e5ea', color: isLeaderboardJoined ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65 }}>{isLeaderboardJoined ? 'ВКЛ' : 'ВЫКЛ'}</button></div>
          <div className="modal-actions"><button className="btn-cancel" onClick={() => setShowSettingsModal(false)}>Закрыть</button></div>
        </div></div>
      )}
      
      {showLeaderboardModal && (
        <div className="modal-overlay"><div className="modal-content"><h3>🏆 Топ перекупов</h3>{leaderboard.map((lb, idx) => (<div key={lb.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 18 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}.`}</span><span style={{ fontWeight: 600 }}>{lb.user_name} {lb.user_id === user?.id ? '(Вы)' : ''}</span></div><span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{(Number(lb.gross_profit) || 0).toLocaleString('ru-RU')} ₽</span></div>))}<div className="modal-actions"><button className="btn-cancel" onClick={() => setShowLeaderboardModal(false)}>Закрыть</button></div></div></div>
      )}
      
      {showSubModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}><div className="modal-content"><h3 style={{ textAlign: 'center' }}>iTrade PRO</h3><p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Пробный период: <strong style={{ color: '#34c759' }}>14 дней</strong></p><div className="pricing-grid"><div className="pricing-card" onClick={() => alert('Оплата 390 ₽...')}><div><div style={{ fontWeight: 'bold' }}>1 месяц</div><div style={{ fontSize: 12 }}>390 ₽</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div><div className="pricing-card" onClick={() => alert('Оплата 1990 ₽...')}><div><div style={{ fontWeight: 'bold' }}>6 месяцев</div><div style={{ fontSize: 12 }}>1990 ₽</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div><div className="pricing-card best-value" onClick={() => alert('Оплата 3590 ₽...')}><div className="best-value-badge">ВЫГОДНО</div><div><div style={{ fontWeight: 'bold' }}>12 месяцев</div><div style={{ fontSize: 12 }}>3590 ₽</div></div><div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Выбрать</div></div></div><div className="modal-actions" style={{ marginTop: 20 }}><button className="btn-cancel" onClick={() => setShowSubModal(false)}>Закрыть</button></div></div></div>
      )}
      
      {showGuideModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}><div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}><button onClick={() => setShowGuideModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: '#00000088', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16 }}>✕</button><h3 style={{ paddingRight: 30 }}>📚 Как пользоваться</h3><div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 15 }}><div><div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>1. Добавление на склад</div><div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>Перейдите во вкладку «Покупка». Выберите модель, цену, память и АКБ. IMEI можно отсканировать камерой.</div></div><div><div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>2. Продажа устройства</div><div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>На вкладке «Склад» нажмите «Продать». Укажите цену и срок гарантии. Телефон переедет в «Сделки».</div></div><div><div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>3. Учет расходов</div><div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 5 }}>Нажмите «+ Расход» на карточке телефона для учета ремонта. Общие траты вносите в «Финансах».</div></div></div><div style={{ marginTop: 25 }}><button className="btn-primary" style={{ backgroundColor: 'var(--accent)', width: '100%', padding: '16px' }} onClick={() => setShowGuideModal(false)}>Понятно</button></div></div></div>
      )}

      {expenseDeal && (<div className="modal-overlay"><div className="modal-content"><h3>Расход: {expenseDeal.model || 'Устройство'}</h3><input className="input-field" type="text" inputMode="numeric" placeholder="Сумма (₽)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value.replace(/[^\d]/g, ''))} autoFocus/><select className="input-field" value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}><option value="Ремонт">Ремонт</option><option value="Запчасти">Запчасти</option><option value="Такси">Такси</option></select><div className="modal-actions"><button className="btn-cancel" onClick={() => setExpenseDeal(null)}>Отмена</button><button className="btn-confirm" onClick={confirmExpense}>Добавить</button></div></div></div>)}
      
      {editingDeal && (<div className="modal-overlay"><div className="modal-content"><h3>Редактировать</h3><input className="input-field" type="text" value={editModel} onChange={(e) => setEditModel(e.target.value)}/><input className="input-field" type="text" inputMode="numeric" value={editBuyPrice} onChange={(e) => setEditBuyPrice(e.target.value.replace(/[^\d]/g, ''))}/><div className="modal-actions"><button className="btn-cancel" onClick={() => setEditingDeal(null)}>Отмена</button><button className="btn-confirm" onClick={saveEdit}>Сохранить</button></div></div></div>)}
      
      {editingContact && (<div className="modal-overlay"><div className="modal-content"><h3>Редактировать контакт</h3><input className="input-field" type="text" value={editContactName} onChange={(e) => setEditContactName(e.target.value)}/><input className="input-field" type="text" value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)}/><input className="input-field" type="text" value={editContactNote} onChange={(e) => setEditContactNote(e.target.value)}/><div className="modal-actions"><button className="btn-cancel" onClick={() => setEditingContact(null)}>Отмена</button><button className="btn-confirm" onClick={saveEditContact}>Сохранить</button></div></div></div>)}

      {showScanner && (
        <Scanner key={Date.now()} onScan={(text) => { setImei(text); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
      )}

      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); haptic(); }}><span className="tab-icon">📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`} onClick={() => { setActiveTab('purchase'); haptic(); }}><span className="tab-icon">🛒</span> Покупка</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => { setActiveTab('stock'); haptic(); }}><span className="tab-icon">📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => { setActiveTab('deals'); haptic(); }}><span className="tab-icon">💰</span> Сделки</button>
        <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => { setActiveTab('finance'); haptic(); }}><span className="tab-icon">💵</span> Финансы</button>
        <button className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); haptic(); }}><span className="tab-icon">👥</span> Контакты</button>
      </div>
    </div>
  )
}

export default App