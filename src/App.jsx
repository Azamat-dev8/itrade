import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend } from 'recharts'
import Scanner from './Scanner'
import './App.css'

const DEVICE_CATALOG = {
  'iPhone': ["iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "iPhone SE (2020)", "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone SE (2022)", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max", "iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone 18", "iPhone 18 Pro", "iPhone 18 Pro Max", "iPhone Duo"],
  'iPad': ["iPad 9", "iPad 10", "iPad Air 4", "iPad Air 5", "iPad Air 6", "iPad Pro 11 (2021)", "iPad Pro 12.9 (2021)", "iPad Pro 11 (2022)", "iPad Pro 12.9 (2022)", "iPad Pro M4"],
  'MacBook': ["MacBook Air M1", "MacBook Air M2", "MacBook Air M3", "MacBook Pro 13 M1", "MacBook Pro 14 M1", "MacBook Pro 16 M1", "MacBook Pro 14 M3", "MacBook Pro 16 M3"],
  'Apple Watch': ["Apple Watch Series 4", "Apple Watch Series 5", "Apple Watch Series 6", "Apple Watch SE (2020)", "Apple Watch Series 7", "Apple Watch Series 8", "Apple Watch SE (2022)", "Apple Watch Ultra", "Apple Watch Series 9", "Apple Watch Ultra 2", "Apple Watch Series 10", "Apple Watch Series 11", "Apple Watch Series 12", "Apple Watch Ultra 3"],
  'AirPods': ["AirPods 2", "AirPods 3", "AirPods 4", "AirPods 5", "AirPods Pro", "AirPods Pro 2", "AirPods Pro 3", "AirPods Max"]
};

const CATEGORIES = [
  { id: 'iPhone', name: 'iPhone', icon: '📱', color: '#007aff' },
  { id: 'AirPods', name: 'AirPods', icon: '🎧', color: '#34c759' },
  { id: 'iPad', name: 'iPad', icon: '📲', color: '#ff9500' },
  { id: 'Apple Watch', name: 'Apple Watch', icon: '⌚', color: '#af52de' },
  { id: 'MacBook', name: 'MacBook', icon: '💻', color: '#5ac8fa' },
  { id: 'Аксессуары', name: 'Аксессуары', icon: '🔌', color: '#ff2d55' },
];

const MY_CHANNEL_URL = "https://t.me/primesufa"

const detectCategory = (model) => {
  if (!model) return 'Аксессуары';
  if (model.startsWith('iPhone')) return 'iPhone';
  if (model.startsWith('iPad')) return 'iPad';
  if (model.startsWith('MacBook')) return 'MacBook';
  if (model.startsWith('Apple Watch')) return 'Apple Watch';
  if (model.startsWith('AirPods')) return 'AirPods';
  return 'Аксессуары';
};

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [contacts, setContacts] = useState([])
  const [generalExpenses, setGeneralExpenses] = useState([])
  const [debts, setDebts] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const [viewingDeal, setViewingDeal] = useState(null)
  const [viewingPhoto, setViewingPhoto] = useState(null)

  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [restoreJson, setRestoreJson] = useState('')
  const [backupJson, setBackupJson] = useState('')
  const [showBackupInfo, setShowBackupInfo] = useState(false)
  const [photoLimitWarning, setPhotoLimitWarning] = useState(false)

  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  const [showModelPicker, setShowModelPicker] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [modelCategory, setModelCategory] = useState('iPhone')
  const [pickerMode, setPickerMode] = useState('purchase')
  const [filterModels, setFilterModels] = useState([])

  const [showExportModal, setShowExportModal] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannerMode, setScannerMode] = useState('purchase')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('12')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(2)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [isDarkTheme, setIsDarkTheme] = useState(false)
  const [showSuccessMsg, setShowSuccessMsg] = useState(false)

  const [profileData, setProfileData] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [hideAmounts, setHideAmounts] = useState(false)
  const [showChart, setShowChart] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [budget, setBudget] = useState(0)
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [tempBudget, setTempBudget] = useState('')

  const [showDebtModal, setShowDebtModal] = useState(false)
  const [debtContactId, setDebtContactId] = useState('')
  const [debtAmount, setDebtAmount] = useState('')
  const [debtType, setDebtType] = useState('they_owe')

  const [calcModel, setCalcModel] = useState('');
  const [calcBuyPrice, setCalcBuyPrice] = useState('');
  const [calcBuyQty, setCalcBuyQty] = useState('1');
  const [calcSellPrice, setCalcSellPrice] = useState('');
  const [calcSellQty, setCalcSellQty] = useState('1');
  const [calcIsAvitoDelivery, setCalcIsAvitoDelivery] = useState(false);
  const [calcFee, setCalcFee] = useState('7');
  const [calcExtraCosts, setCalcExtraCosts] = useState('');

  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [storage, setStorage] = useState('')
  const [battery, setBattery] = useState('')
  const [imei, setImei] = useState('')
  const [sellerId, setSellerId] = useState('')
  const [newDealExpCat, setNewDealExpCat] = useState('Ремонт')
  const [newDealExpAmount, setNewDealExpAmount] = useState('')
  const [dealLocation, setDealLocation] = useState('')
  const [dealDescription, setDealDescription] = useState('')
  const [dealPhotos, setDealPhotos] = useState([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dealQuantity, setDealQuantity] = useState('1')

  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactNote, setContactNote] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [editContactName, setEditContactName] = useState('')
  const [editContactPhone, setEditContactPhone] = useState('')
  const [editContactNote, setEditContactNote] = useState('')

  const [genExpAmount, setGenExpAmount] = useState('')
  const [genExpCategory, setGenExpCategory] = useState('Авито')
  const [customGenExpCategory, setCustomGenExpCategory] = useState('')

  const [expenseDeal, setExpenseDeal] = useState(null)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState('Ремонт')

  const [sellingDeal, setSellingDeal] = useState(null)
  const [sellPrice, setSellPrice] = useState('')
  const [sellQuantity, setSellQuantity] = useState('1')
  const [buyerId, setBuyerId] = useState('')
  const [sellWarranty, setSellWarranty] = useState('0')
  
  // Добавления для Trade-in
  const [isTradeIn, setIsTradeIn] = useState(false)
  const [tradeInModel, setTradeInModel] = useState('')
  const [tradeInPrice, setTradeInPrice] = useState('')

  // Свайпы на карточках склада
  const [touchStartX, setTouchStartX] = useState(null)
  const [swipedDealId, setSwipedDealId] = useState(null)

  const [editingDeal, setEditingDeal] = useState(null)
  const [editModel, setEditModel] = useState('')
  const [editBuyPrice, setEditBuyPrice] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImei, setEditImei] = useState('')
  const [editSellerId, setEditSellerId] = useState('')
  const [editPhotos, setEditPhotos] = useState([])
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ model: '', description: '', buy_price: '', quantity: '1', location: '', is_accounted: true, imei: '' })
  const [addFormPhotos, setAddFormPhotos] = useState([])
  const [uploadingAddPhoto, setUploadingAddPhoto] = useState(false)

  const [showAdModal, setShowAdModal] = useState(false)
  const [adText, setAdText] = useState('')

  // --- АВТООПРЕДЕЛЕНИЕ МОДЕЛИ ПО IMEI ---
  const checkImeiAuto = async (imeiCode) => {
    if (!imeiCode || imeiCode.length < 8) return;
    const tac = imeiCode.substring(0, 8);
    const localTacMap = {
      "35282009": "iPhone 11", "35282109": "iPhone 11", "35651510": "iPhone 11",
      "35282209": "iPhone 11 Pro", "35651610": "iPhone 11 Pro",
      "35282309": "iPhone 11 Pro Max", "35651710": "iPhone 11 Pro Max",
      "35304910": "iPhone 12 mini", "35305010": "iPhone 12",
      "35305110": "iPhone 12 Pro", "35305210": "iPhone 12 Pro Max",
      "35613831": "iPhone 13 mini", "35613931": "iPhone 13", "35298911": "iPhone 13",
      "35614031": "iPhone 13 Pro", "35301411": "iPhone 13 Pro",
      "35614131": "iPhone 13 Pro Max", "35301511": "iPhone 13 Pro Max",
      "35035759": "iPhone 14", "35674311": "iPhone 14",
      "35035859": "iPhone 14 Plus",
      "35035959": "iPhone 14 Pro", "35674511": "iPhone 14 Pro",
      "35036059": "iPhone 14 Pro Max", "35674611": "iPhone 14 Pro Max",
      "35489182": "iPhone 15", "35105021": "iPhone 15", "35158284": "iPhone 15",
      "35489282": "iPhone 15 Plus",
      "35489382": "iPhone 15 Pro", "35105221": "iPhone 15 Pro", "35158584": "iPhone 15 Pro", "35759325": "iPhone 15 Pro",
      "35489482": "iPhone 15 Pro Max", "35105321": "iPhone 15 Pro Max", "35158684": "iPhone 15 Pro Max",
      "35832145": "iPhone 16", "35832245": "iPhone 16 Plus",
      "35832345": "iPhone 16 Pro", "35832445": "iPhone 16 Pro Max",
    };
    if (localTacMap[tac]) {
      setModel(localTacMap[tac]);
      if (typeof haptic === 'function') haptic('success');
      return;
    }
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/imei-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey },
        body: JSON.stringify({ imei: imeiCode })
      });
      const data = await res.json();
      if (data?.model) {
        setModel(data.model);
        if (typeof haptic === 'function') haptic('success');
      }
    } catch (e) {
      console.error("IMEI check error:", e);
    }
  };

  // --- КАСТОМНЫЙ СКАНЕР ---
  const handleOpenScanner = (mode = 'purchase') => {
    setScannerMode(mode);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    setShowScanner(true); 
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready(); tg.expand(); setUser(tg.initDataUnsafe?.user || null)
      const applyTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        const isDark = storedTheme ? storedTheme === 'dark' : tg.colorScheme === 'dark';
        document.body.classList.toggle('dark-theme', isDark);
        setIsDarkTheme(isDark);
      }
      applyTheme()
      tg.onEvent('themeChanged', applyTheme)
      const urlParams = new URLSearchParams(window.location.search);
      const startapp = urlParams.get('startapp') || tg.initDataUnsafe?.start_param;
      if (startapp && startapp.startsWith('pay_')) {
        const planId = startapp.replace('pay_', '');
        if (['1', '6', '12'].includes(planId)) {
          setSelectedPlan(planId);
          setTimeout(() => setShowSubModal(true), 500); 
        }
      }
      return () => tg.offEvent('themeChanged', applyTheme)
    } else {
      setUser({ id: 123456789, first_name: 'Тест', username: 'test_user' });
    }
  }, [])

  useEffect(() => {
    if (user) {
      const cachedDeals = localStorage.getItem('pt_deals');
      if (cachedDeals) setDeals(JSON.parse(cachedDeals));
      const cachedContacts = localStorage.getItem('pt_contacts');
      if (cachedContacts) setContacts(JSON.parse(cachedContacts));
      fetchData();
    } else {
      setIsInitialLoading(false);
    }
  }, [user])

  const haptic = (style = 'light') => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;
    if (['success', 'error', 'warning'].includes(style)) tg.HapticFeedback.notificationOccurred(style);
    else tg.HapticFeedback.impactOccurred(['light', 'medium', 'heavy', 'rigid', 'soft'].includes(style) ? style : 'light');
  }

  const toggleTheme = () => {
    const isNowDark = !isDarkTheme;
    setIsDarkTheme(isNowDark);
    localStorage.setItem('theme', isNowDark ? 'dark' : 'light');
    document.body.classList.toggle('dark-theme', isNowDark);
    haptic('medium');
  }

  const openExternalLink = (url) => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openLink) tg.openLink(url); else window.open(url, '_blank');
  }

  const handlePhoneCall = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    haptic('medium');
    window.open(`tel:${cleanPhone}`, '_blank');
  };

  const fetchData = async () => {
    if (!user) return;
    try {
      const [
        { data: dealsData },
        { data: contactsData },
        { data: genExpData },
        { data: debtsData },
        { data: profileInfo },
        { data: lbData }
      ] = await Promise.all([
        supabase.from('deals').select('*, expenses(*), seller:seller_id(name, phone), buyer:buyer_id(name, phone)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('contacts').select('*').eq('user_id', user.id).order('name'),
        supabase.from('expenses').select('*').eq('user_id', user.id).is('deal_id', null).order('created_at', { ascending: false }),
        supabase.from('debts').select('*, contact:contact_id(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_profiles').select('*').eq('telegram_id', user.id).single(),
        supabase.from('public_leaderboard').select('*').order('gross_profit', { ascending: false }).limit(10)
      ]);

      if (dealsData) { setDeals(dealsData); localStorage.setItem('pt_deals', JSON.stringify(dealsData)); }
      if (contactsData) { setContacts(contactsData); localStorage.setItem('pt_contacts', JSON.stringify(contactsData)); }
      if (genExpData) setGeneralExpenses(genExpData);
      if (debtsData) setDebts(debtsData);
      if (lbData) setLeaderboard(lbData);

      if (profileInfo) {
        if (!profileInfo.subscription_ends_at) {
          const trialEndsAt = new Date(); trialEndsAt.setDate(trialEndsAt.getDate() + 7);
          const { data: updatedProfile } = await supabase.from('user_profiles').update({ subscription_ends_at: trialEndsAt.toISOString() }).eq('telegram_id', user.id).select().single();
          if (updatedProfile) {
            setProfileData(updatedProfile); setDisplayName(updatedProfile.display_name || user.first_name || 'Аноним'); setBudget(Number(updatedProfile.resale_budget) || 0);
          }
        } else {
          setProfileData(profileInfo); setDisplayName(profileInfo.display_name || user.first_name || 'Аноним');
          setHideAmounts(profileInfo.hide_amounts || false); setShowChart(profileInfo.show_chart !== false);
          setDailySummary(profileInfo.daily_summary || false); setBudget(Number(profileInfo.resale_budget) || 0);
        }
      } else {
        const trialEndsAt = new Date(); trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        const newProf = { telegram_id: user.id, user_name: user.first_name || 'Аноним', display_name: user.first_name || 'Аноним', show_in_leaderboard: false, resale_budget: 0, subscription_ends_at: trialEndsAt.toISOString() }
        const { data: createdProf } = await supabase.from('user_profiles').insert([newProf]).select().single();
        setProfileData(createdProf || newProf); setDisplayName(newProf.display_name);
      }
    } catch (error) { console.error("Ошибка:", error); } finally { setIsInitialLoading(false); }
  }

  const handleBackup = () => {
    haptic('medium');
    const backup = {
      deals: deals.map(d => ({ ...d, seller: undefined, buyer: undefined })),
      dealExpenses: deals.flatMap(d => (d.expenses || []).map(e => ({ ...e, deal_id: d.id }))),
      generalExpenses: generalExpenses,
      contacts: contacts,
      debts: debts,
      profile: { resale_budget: budget }
    };
    setBackupJson(JSON.stringify(backup, null, 2)); setShowBackupModal(true);
  }

  const processRestore = async (jsonString) => {
    if (!user) return;
    if (!jsonString || !jsonString.trim()) return alert('Вставьте текст');
    if (!window.confirm('ВНИМАНИЕ! Текущие данные будут удалены. Продолжить?')) return;
    setIsActionLoading(true);
    try {
      const data = JSON.parse(jsonString);
      await supabase.from('deals').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('contacts').delete().eq('user_id', user.id);
      await supabase.from('debts').delete().eq('user_id', user.id);
      const contactMap = {};
      if (data.contacts) {
        for (const c of data.contacts) {
          const { id, ...rest } = c;
          const { data: newContact } = await supabase.from('contacts').insert([{ ...rest, user_id: user.id }]).select().single();
          if (newContact) contactMap[id] = newContact.id;
        }
      }
      const dealMap = {};
      if (data.deals) {
        for (const d of data.deals) {
          const { id, expenses, ...rest } = d;
          const newDeal = { ...rest, user_id: user.id, seller_id: d.seller_id ? contactMap[d.seller_id] : null, buyer_id: d.buyer_id ? contactMap[d.buyer_id] : null };
          const { data: insertedDeal } = await supabase.from('deals').insert([newDeal]).select().single();
          if (insertedDeal) dealMap[id] = insertedDeal.id;
        }
      }
      if (data.dealExpenses) {
        for (const exp of data.dealExpenses) {
          const { id, deal_id, ...rest } = exp;
          if (dealMap[deal_id]) await supabase.from('expenses').insert([{ ...rest, user_id: user.id, deal_id: dealMap[deal_id] }]);
        }
      }
      if (data.generalExpenses) {
        for (const exp of data.generalExpenses) {
          const { id, ...rest } = exp;
          await supabase.from('expenses').insert([{ ...rest, user_id: user.id, deal_id: null }]);
        }
      }
      if (data.debts) {
        for (const debt of data.debts) {
          const { id, contact, contact_id, ...rest } = debt;
          if (contactMap[contact_id]) await supabase.from('debts').insert([{ ...rest, user_id: user.id, contact_id: contactMap[contact_id] }]);
        }
      }
      if (data.profile && data.profile.resale_budget) {
        await supabase.from('user_profiles').update({ resale_budget: data.profile.resale_budget }).eq('telegram_id', user.id);
      }
      alert('✅ Успешно!'); setShowRestoreModal(false); setRestoreJson(''); fetchData();
    } catch (err) { alert('Ошибка: ' + err.message); } finally { setIsActionLoading(false); }
  }

  const updateSetting = async (key, value) => {
    haptic('medium'); if (!user) return;
    if (key === 'hide_amounts') setHideAmounts(value)
    if (key === 'show_chart') setShowChart(value)
    if (key === 'daily_summary') setDailySummary(value)
    if (key === 'show_in_leaderboard') setProfileData(prev => ({ ...prev, show_in_leaderboard: value }))
    await supabase.from('user_profiles').update({ [key]: value }).eq('telegram_id', user.id)
    if (key === 'show_in_leaderboard') {
      const { data } = await supabase.from('public_leaderboard').select('*').order('gross_profit', { ascending: false }).limit(10)
      if (data) setLeaderboard(data)
    }
  }

  const saveDisplayName = async () => {
    if (!displayName.trim() || !user) return; haptic('medium');
    await supabase.from('user_profiles').update({ display_name: displayName.trim() }).eq('telegram_id', user.id); alert('✅ Обновлено!')
  }

  const saveBudget = async () => {
    if (!tempBudget || !user) return; haptic('medium');
    const newBudget = Number(tempBudget); setBudget(newBudget);
    const { error } = await supabase.from('user_profiles').update({ resale_budget: newBudget }).eq('telegram_id', user.id);
    if (error) alert('Ошибка: ' + error.message); else setShowBudgetModal(false);
  }

  const saveDebt = async () => {
    if (!user) return;
    if (!debtContactId) return alert('Выберите контакт!'); if (!debtAmount || Number(debtAmount) <= 0) return alert('Сумма!');
    haptic('medium');
    const { error } = await supabase.from('debts').insert([{ user_id: user.id, contact_id: Number(debtContactId), amount: Number(debtAmount), type: debtType }]);
    if (error) alert('Ошибка: ' + error.message); else { setDebtContactId(''); setDebtAmount(''); setDebtType('they_owe'); setShowDebtModal(false); fetchData(); }
  }

  const deleteDebt = async (id) => { if (!window.confirm('Удалить?')) return; await supabase.from('debts').delete().eq('id', id); fetchData(); }

  const clearAllData = async () => {
    if (!window.confirm('Удалить ВСЕ данные?')) return; setIsActionLoading(true);
    try {
      await supabase.from('deals').delete().eq('user_id', user.id); await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('contacts').delete().eq('user_id', user.id); await supabase.from('debts').delete().eq('user_id', user.id);
      localStorage.removeItem('pt_deals'); localStorage.removeItem('pt_contacts'); fetchData(); haptic('heavy');
    } catch (error) { alert('Ошибка: ' + error.message); } finally { setIsActionLoading(false); }
  };

  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handleExportClick = () => {
    haptic(); if (deals.length === 0) return alert('Нет данных');
    const headers = ['Категория', 'Модель', 'Описание', 'Кол-во', 'Закупка', 'Продажа', 'Прибыль', 'Дата покупки', 'Дата продажи'];
    const rows = deals.map(d => {
      const exp = getDealExpensesSum(d);
      const initQty = (d.quantity || 0) + (d.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? exp / initQty : 0;
      const m = d.sold_quantity > 0 ? (d.sold_quantity * (Number(d.sell_price) || 0)) - (d.sold_quantity * Number(d.buy_price)) - (d.sold_quantity * perUnitExp) : '';
      return [`"${d.category || ''}"`, `"${d.model}"`, `"${d.description || ''}"`, initQty, d.buy_price, d.sell_price || '', m, new Date(d.created_at).toLocaleDateString('ru-RU'), d.sold_at ? new Date(d.sold_at).toLocaleDateString('ru-RU') : ''].join(';');
    });
    setCsvData([headers.join(';'), ...rows].join('\n')); setShowExportModal(true);
  }

  const downloadCsv = () => {
    const blob = new Blob(["\uFEFF" + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `PrimeTrade.csv`; a.click(); URL.revokeObjectURL(url); setShowExportModal(false);
  }

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas'); let { width, height } = img;
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        }; img.onerror = reject;
      }; reader.onerror = reject;
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files); if (files.length === 0) return;
    if (dealPhotos.length + files.length > 3) { setPhotoLimitWarning(true); setTimeout(() => setPhotoLimitWarning(false), 3000); return; }
    setUploadingPhoto(true); const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        const { error } = await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName); newUrls.push(publicUrl);
      } catch (err) { alert('Ошибка: ' + err.message); }
    }
    setDealPhotos(prev => [...prev, ...newUrls]); setUploadingPhoto(false);
  }

  const handleAddModalPhotoUpload = async (e) => {
    const files = Array.from(e.target.files); if (files.length === 0) return;
    if (addFormPhotos.length + files.length > 3) return alert('Максимум 3 фото');
    setUploadingAddPhoto(true); const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName); newUrls.push(publicUrl);
      } catch (err) {}
    }
    setAddFormPhotos(prev => [...prev, ...newUrls]); setUploadingAddPhoto(false);
  }

  const handleEditPhotoUpload = async (e) => {
    const files = Array.from(e.target.files); if (files.length === 0) return;
    if (editPhotos.length + files.length > 3) return alert('Максимум 3 фото');
    setUploadingEditPhoto(true); const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName); newUrls.push(publicUrl);
      } catch (err) {}
    }
    setEditPhotos(prev => [...prev, ...newUrls]); setUploadingEditPhoto(false);
  }

  const addDeal = async (e) => {
    e.preventDefault(); if (!model || !buyPrice || !user) return alert('Заполните модель и цену');
    setIsActionLoading(true)
    try {
      const qty = Math.max(1, Number(dealQuantity) || 1);
      const { data: newDeals, error } = await supabase.from('deals').insert([{
        model, buy_price: Number(buyPrice), status: 'in_stock', category: detectCategory(model),
        quantity: qty, sold_quantity: 0, is_accounted: true, description: dealDescription || null,
        storage_gb: storage ? Number(storage) : null, battery_health: battery ? Number(battery) : null,
        imei: imei || null, seller_id: sellerId ? Number(sellerId) : null,
        user_id: user.id, user_name: displayName || 'Аноним', location: dealLocation || null,
        photos: dealPhotos.length > 0 ? dealPhotos : null
      }]).select()
      if (error) throw new Error(error.message);
      if (newDeals && newDeals.length > 0) {
        if (newDealExpAmount && Number(newDealExpAmount) > 0) {
          await supabase.from('expenses').insert([{ deal_id: newDeals[0].id, amount: Number(newDealExpAmount), category: newDealExpCat, user_id: user.id }])
        }
        setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId('');
        setNewDealExpAmount(''); setNewDealExpCat('Ремонт'); setDealLocation(''); setDealPhotos([]); setDealDescription(''); setDealQuantity('1');
        await fetchData(); haptic('medium'); setShowSuccessMsg(true); setTimeout(() => setShowSuccessMsg(false), 3000);
      }
    } catch (err) { alert('Ошибка: ' + err.message) } finally { setIsActionLoading(false) }
  }

  const addManualProduct = async () => {
    if (!addForm.model || !addForm.buy_price || !user) return alert('Заполните'); if (!selectedCategory) return;
    setIsActionLoading(true);
    try {
      const qty = Math.max(1, Number(addForm.quantity) || 1);
      const { data: newDeals, error } = await supabase.from('deals').insert([{
        model: addForm.model, category: selectedCategory, buy_price: Number(addForm.buy_price),
        quantity: qty, sold_quantity: 0, is_accounted: addForm.is_accounted, status: 'in_stock',
        description: addForm.description || null, imei: addForm.imei || null, location: addForm.location || null,
        photos: addFormPhotos.length > 0 ? addFormPhotos : null, user_id: user.id, user_name: displayName || 'Аноним'
      }]).select();
      if (error) throw new Error(error.message);
      if (newDeals && newDeals.length > 0) {
        setShowAddModal(false); setAddForm({ model: '', description: '', buy_price: '', quantity: '1', location: '', is_accounted: true, imei: '' });
        setAddFormPhotos([]); await fetchData(); haptic('success');
      }
    } catch (err) { alert('Ошибка: ' + err.message); } finally { setIsActionLoading(false); }
  };

  const confirmSell = async () => {
    if (!sellPrice) return alert('Введите цену');
    const qtyToSell = Number(sellQuantity) || 1;
    if (qtyToSell > sellingDeal.quantity) return alert(`В наличии только ${sellingDeal.quantity} шт.`);
    if (isTradeIn && (!tradeInModel || !tradeInPrice)) return alert('Заполните модель и цену оценки Trade-in');
    
    setIsActionLoading(true);
    try {
      const newQuantity = sellingDeal.quantity - qtyToSell;
      const newSoldQuantity = (sellingDeal.sold_quantity || 0) + qtyToSell;
      const newStatus = newQuantity === 0 ? 'sold' : 'in_stock';
      
      const { error } = await supabase.from('deals').update({
        quantity: newQuantity, sold_quantity: newSoldQuantity, sell_price: Number(sellPrice),
        status: newStatus, buyer_id: buyerId ? Number(buyerId) : null,
        sold_at: newQuantity === 0 ? new Date().toISOString() : sellingDeal.sold_at,
        warranty_months: Number(sellWarranty)
      }).eq('id', sellingDeal.id);
      if (error) throw new Error(error.message);

      if (isTradeIn) {
        const { error: tradeInError } = await supabase.from('deals').insert([{
          model: tradeInModel, buy_price: Number(tradeInPrice), status: 'in_stock',
          category: detectCategory(tradeInModel), quantity: 1, sold_quantity: 0, is_accounted: true,
          user_id: user.id, user_name: displayName || 'Аноним', seller_id: buyerId ? Number(buyerId) : null,
          description: `🔄 Принято по Trade-in при продаже ${sellingDeal.model}`
        }]);
        if (tradeInError) throw new Error("Ошибка Trade-in: " + tradeInError.message);
      }
      setSellingDeal(null); setIsTradeIn(false); setTradeInModel(''); setTradeInPrice(''); await fetchData(); haptic('success');
    } catch (err) { alert('Ошибка: ' + err.message); } finally { setIsActionLoading(false); }
  }

  const addGeneralExpense = async (e) => {
    e.preventDefault(); if (!genExpAmount || !user) return; setIsActionLoading(true);
    const finalCategory = genExpCategory === 'Свой вариант' ? (customGenExpCategory || 'Другое') : genExpCategory;
    await supabase.from('expenses').insert([{ amount: Number(genExpAmount), category: finalCategory, user_id: user.id }]);
    setGenExpAmount(''); setCustomGenExpCategory(''); setGenExpCategory('Авито'); fetchData(); haptic('medium'); setIsActionLoading(false);
  }

  const addContact = async (e) => {
    e.preventDefault(); if (!contactName || !user) return; setIsActionLoading(true);
    await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote, user_id: user.id }]);
    setContactName(''); setContactPhone(''); setContactNote(''); fetchData(); setIsActionLoading(false);
  }

  const deleteDeal = async (id) => { if (!window.confirm('Удалить?')) return; await supabase.from('deals').delete().eq('id', id); fetchData(); }
  const deleteExpense = async (id) => { if (!window.confirm('Удалить расход?')) return; await supabase.from('expenses').delete().eq('id', id); fetchData(); }
  const confirmExpense = async () => { if (!expenseAmount || !user) return; await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory, user_id: user.id }]); setExpenseDeal(null); fetchData(); }
  const saveEditContact = async () => { if (!editContactName) return; await supabase.from('contacts').update({ name: editContactName, phone: editContactPhone, note: editContactNote }).eq('id', editingContact.id); setEditingContact(null); fetchData(); }
  const deleteContact = async (id) => { if (!window.confirm('Удалить контакт?')) return; await supabase.from('contacts').delete().eq('id', id); fetchData(); }
  
  const saveEdit = async () => { 
    if (!editModel || !editBuyPrice) return; 
    await supabase.from('deals').update({ 
      model: editModel, buy_price: Number(editBuyPrice), location: editLocation, description: editDescription || null,
      imei: editImei || null, seller_id: editSellerId ? Number(editSellerId) : null, photos: editPhotos.length > 0 ? editPhotos : null
    }).eq('id', editingDeal.id); 
    setEditingDeal(null); fetchData(); 
  }

  const handleModelSelect = (modelName) => {
    haptic();
    if (pickerMode === 'purchase') { setModel(modelName); setShowModelPicker(false); setModelSearch(''); }
    else if (pickerMode === 'calculator') {
      setCalcModel(modelName); setShowModelPicker(false); setModelSearch('');
      const history = deals.filter(d => d.model === modelName);
      if (history.length > 0) {
        const avgBuy = history.reduce((sum, d) => sum + Number(d.buy_price), 0) / history.length;
        setCalcBuyPrice(Math.round(avgBuy).toString());
        const soldHistory = history.filter(d => d.sold_quantity > 0 && d.sell_price);
        if (soldHistory.length > 0) {
          const avgSell = soldHistory.reduce((sum, d) => sum + Number(d.sell_price), 0) / soldHistory.length;
          setCalcSellPrice(Math.round(avgSell).toString());
        }
      } else { setCalcBuyPrice(''); setCalcSellPrice(''); }
    } else if (pickerMode === 'addManual') {
      setAddForm(prev => ({ ...prev, model: modelName })); setShowModelPicker(false); setModelSearch('');
    } else { setFilterModels(prev => prev.includes(modelName) ? prev.filter(m => m !== modelName) : [...prev, modelName]); }
  }

  const generateAdText = (deal) => {
    let text = `🔥 В продаже: ${deal.model}\n`;
    if (deal.storage_gb) text += `📦 Память: ${deal.storage_gb >= 1024 ? deal.storage_gb/1024 + ' TB' : deal.storage_gb + ' GB'}\n`;
    if (deal.battery_health) text += `🔋 АКБ: ${deal.battery_health}%\n`;
    if (deal.description) text += `📝 Состояние: ${deal.description}\n`;
    if (deal.location) text += `📍 Локация: ${deal.location}\n`;
    const rawPrice = deal.sell_price ? Number(deal.sell_price).toLocaleString('ru-RU') + ' ₽' : 'Договорная';
    text += `💰 Цена для своих: ${rawPrice}\n\n`;
    text += `Нажмите, чтобы написать мне в ЛС!`;
    return text;
  }

  const formatMoney = (amount) => { if (hideAmounts) return '*** ₽'; return (Number(amount) || 0).toLocaleString('ru-RU') + ' ₽'; }

  const inStockDeals = deals.filter(d => (d.quantity || 0) > 0)
  const soldDeals = deals.filter(d => (d.sold_quantity || 0) > 0)

  // 1. Идеальная Математика
  const accountedDeals = deals.filter(d => d.is_accounted !== false);

  const totalInvestedInStock = inStockDeals.filter(d => d.is_accounted !== false).reduce((sum, deal) => {
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    return sum + (deal.quantity * Number(deal.buy_price)) + (deal.quantity * perUnitExp);
  }, 0);

  const totalRevenue = accountedDeals.reduce((sum, deal) => sum + (deal.sold_quantity || 0) * (Number(deal.sell_price) || 0), 0);
  const totalBuySold = accountedDeals.reduce((sum, deal) => sum + (deal.sold_quantity || 0) * Number(deal.buy_price), 0);
  const totalExpSold = accountedDeals.reduce((sum, deal) => {
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    return sum + (deal.sold_quantity || 0) * perUnitExp;
  }, 0);

  const grossDealProfit = totalRevenue - totalBuySold - totalExpSold;
  const totalGenExp = generalExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const netProfit = grossDealProfit - totalGenExp;
  const totalCapital = budget + netProfit;
  const freeCash = totalCapital - totalInvestedInStock;
  const percentInvested = totalCapital > 0 ? (totalInvestedInStock / totalCapital) * 100 : 0;

  const totalUnitsSold = accountedDeals.reduce((sum, deal) => sum + (deal.sold_quantity || 0), 0);
  const avgProfit = totalUnitsSold > 0 ? grossDealProfit / totalUnitsSold : 0;
  
  const inStockExpenses = inStockDeals.filter(d => d.is_accounted !== false).reduce((sum, deal) => {
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    return sum + (deal.quantity * perUnitExp);
  }, 0);
  const marginPercent = totalRevenue > 0 ? (grossDealProfit / totalRevenue) * 100 : 0;

  const totalTheyOwe = debts.filter(d => d.type === 'they_owe').reduce((sum, d) => sum + Number(d.amount), 0);
  const totalIOwe = debts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + Number(d.amount), 0);

  const modelStats = accountedDeals.filter(d => d.sold_quantity > 0).reduce((acc, deal) => {
    if (!acc[deal.model]) acc[deal.model] = { count: 0, profit: 0 };
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    acc[deal.model].count += deal.sold_quantity;
    acc[deal.model].profit += deal.sold_quantity * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
    return acc;
  }, {});
  const topModels = Object.entries(modelStats).map(([name, stats]) => ({ name, avg: stats.profit / stats.count, count: stats.count })).sort((a, b) => b.avg - a.avg).slice(0, 3);

  const monthlyProfits = accountedDeals.filter(d => d.sold_quantity > 0).reduce((acc, deal) => {
    const date = new Date(deal.sold_at || deal.created_at || Date.now());
    const monthYear = date.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    const profit = deal.sold_quantity * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
    if (!acc[monthYear]) acc[monthYear] = 0; acc[monthYear] += profit; return acc;
  }, {});
  const chartData = Object.entries(monthlyProfits).map(([name, profit]) => ({ name, profit })).reverse();

  // Расчет для Круговой диаграммы (PieChart)
  const categoryProfits = accountedDeals.filter(d => d.sold_quantity > 0).reduce((acc, deal) => {
    const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
    const profit = deal.sold_quantity * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
    if (profit > 0) { 
      const cat = deal.category || 'Другое';
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] += profit;
    }
    return acc;
  }, {});
  const pieData = Object.entries(categoryProfits).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

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
    const end = (deal.quantity === 0 && deal.sold_at) ? new Date(deal.sold_at) : new Date();
    return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  }

  const getWarrantyBadge = (deal) => {
    if (!deal.warranty_months || deal.warranty_months === 0) return null;
    const end = new Date(deal.sold_at || Date.now()); end.setMonth(end.getMonth() + Number(deal.warranty_months));
    const now = new Date(); const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) return <span className="badge badge-green" style={{ marginTop: 6, display: 'inline-block' }}>🛡️ Гарантия до {end.toLocaleDateString('ru-RU')} ({daysLeft} дн.)</span>
    return <span className="badge badge-red" style={{ marginTop: 6, display: 'inline-block' }}>🛡️ Гарантия истекла {end.toLocaleDateString('ru-RU')}</span>
  }

  const renderSpecs = (deal) => {
    const totalQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, marginBottom: 10 }}>
        {totalQty > 1 && <span className="badge badge-green">📦 {deal.quantity || 0} из {totalQty} шт.</span>}
        {getDaysOnStock(deal) > 0 && <span className={`badge ${deal.quantity === 0 ? 'badge-gray' : 'badge-green'}`}>⏱ {getDaysOnStock(deal)} дн.</span>}
        {deal.storage_gb && <span className="badge badge-gray">{deal.storage_gb >= 1024 ? `${deal.storage_gb / 1024} TB` : `${deal.storage_gb} GB`}</span>}
        {deal.battery_health && <span className="badge badge-gray">🔋 {deal.battery_health}%</span>}
        {deal.imei && <span className="badge badge-gray">IMEI: ...{String(deal.imei).slice(-4)}</span>}
        {deal.location && <span className="badge badge-yellow">📍 {deal.location}</span>}
        {deal.is_accounted === false && <span className="badge badge-red">Не в учёте</span>}
      </div>
    )
  }

  const renderSkeleton = () => (
    <div style={{ padding: 16, paddingTop: 60 }}>
      <div className="skeleton skeleton-card" style={{ height: 80 }}></div>
      <div className="skeleton skeleton-card" style={{ height: 200 }}></div>
      <div className="skeleton skeleton-card" style={{ height: 100 }}></div>
    </div>
  )

  const getFinancialStats = () => {
    const now = new Date(); let thisMonthTotal = 0; const categoryTotals = {};
    generalExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0; const date = new Date(exp.created_at || Date.now());
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) thisMonthTotal += amount;
      if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0; categoryTotals[exp.category] += amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['Нет', 0];
    return { thisMonthTotal, topCategory };
  };
  const finStats = getFinancialStats();

  const isPro = profileData?.is_admin || (profileData?.subscription_ends_at && new Date(profileData.subscription_ends_at) > new Date());
  const requirePro = (action) => { if (!isPro) { haptic('error'); setShowSubModal(true); return; } action(); }
  // --- UI Components ---

  // Компонент графика прибыли по категориям
  const MarginChart = () => {
    const data = Object.entries(stats.categoryMargins).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
        <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase">Прибыль по категориям</h3>
        <div className="flex justify-center">
          <PieChart width={200} height={200}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {data.map((entry, index) => (
            <div key={entry.name} className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span className="truncate">{entry.name}: {entry.value.toLocaleString()}₽</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Компонент карточки товара в наличии
  const StockItem = ({ item }) => {
    const [touchStart, setTouchStart] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState(0);

    const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e) => {
      const currentTouch = e.targetTouches[0].clientX;
      const diff = touchStart - currentTouch;
      if (diff > 0 && diff < 150) setSwipeOffset(-diff);
    };
    const handleTouchEnd = () => {
      if (swipeOffset < -70) setSwipeOffset(-140);
      else setSwipeOffset(0);
    };

    return (
      <div className="relative overflow-hidden mb-3 bg-gray-100 rounded-2xl">
        {/* Кнопки действий при свайпе (под карточкой) */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 gap-2">
          <button 
            onClick={() => { setSelectedItem(item); setActionType('expense'); setSwipeOffset(0); }}
            className="w-16 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => { setSelectedItem(item); setActionType('sell'); setSwipeOffset(0); }}
            className="w-16 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg"
          >
            <ShoppingCart size={20} />
          </button>
        </div>

        {/* Основное тело карточки */}
        <div 
          style={{ transform: `translateX(${swipeOffset}px)`, transition: 'transform 0.2s ease-out' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-white p-4 relative z-10 border border-gray-100 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg leading-tight">{item.model}</h3>
              <p className="text-xs text-gray-400 font-mono mt-1">IMEI: {item.imei}</p>
            </div>
            <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
              {item.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Себестоимость</p>
              <p className="font-bold text-gray-800">{(item.purchase_price + (item.expenses || 0)).toLocaleString()} ₽</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase">Дата закупа</p>
              <p className="text-sm font-medium">{new Date(item.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>

          {/* Быстрые кнопки (согласно ТЗ оставлены в теле карточки) */}
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50">
            <button 
              onClick={() => { setSelectedItem(item); setActionType('expense'); }}
              className="flex-1 py-2 bg-gray-50 text-orange-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={14} /> Расход
            </button>
            <button 
              onClick={() => { setSelectedItem(item); setActionType('sell'); }}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
            >
              Продать
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1A1C1E] pb-24 font-sans select-none">
      {/* Шапка */}
      <div className="bg-white px-5 pt-4 pb-6 rounded-b-[32px] shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-blue-200 shadow-lg">
              <Smartphone size={24} />
            </div>
            <h1 className="text-xl font-black tracking-tight uppercase italic">Smart<span className="text-blue-600">Stock</span></h1>
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition-all"
          >
            <Camera size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Главные показатели */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-100">
            <p className="text-[10px] opacity-80 uppercase font-bold mb-1">Свободная касса</p>
            <p className="text-2xl font-black">{financials.freeCash.toLocaleString()} ₽</p>
          </div>
          <div className="bg-white border-2 border-gray-100 p-4 rounded-2xl">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Чистая прибыль</p>
            <p className="text-2xl font-black text-green-600">+{financials.netProfit.toLocaleString()} ₽</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-[9px] text-gray-400 uppercase font-bold">Оборот</p>
            <p className="text-sm font-bold text-gray-700">{financials.totalCapital.toLocaleString()} ₽</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-[9px] text-gray-400 uppercase font-bold">В товаре</p>
            <p className="text-sm font-bold text-gray-700">{financials.totalInvestedInStock.toLocaleString()} ₽</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-[9px] text-gray-400 uppercase font-bold">Общие расходы</p>
            <p className="text-sm font-bold text-red-500">{financials.totalGenExp.toLocaleString()} ₽</p>
          </div>
        </div>
      </div>

      {/* Контент */}
      <div className="px-5">
        {activeTab === 'stock' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black uppercase">В наличии ({stocks.length})</h2>
              <div className="flex gap-2 text-xs font-bold text-gray-400">
                <span className="text-blue-600">Все</span>
                <span>iPhone</span>
                <span>Watch</span>
              </div>
            </div>
            {stocks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400">Склад пуст. Нажмите +, чтобы добавить товар.</p>
              </div>
            ) : (
              stocks.map(item => <StockItem key={item.id} item={item} />)
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <MarginChart />
            <h2 className="text-lg font-black uppercase mb-4">История сделок</h2>
            {deals.map(deal => (
              <div key={deal.id} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-50">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">{new Date(deal.created_at).toLocaleDateString()}</span>
                  <span className="text-xs font-black text-green-600">ПРИБЫЛЬ: +{(deal.sale_price - (deal.purchase_price + (deal.expenses || 0))).toLocaleString()}₽</span>
                </div>
                <h3 className="font-bold">{deal.model}</h3>
                <div className="flex justify-between items-end mt-2">
                  <p className="text-xs text-gray-400">Покупатель: {deal.buyer_name || '—'}</p>
                  <p className="font-black text-lg">{deal.sale_price.toLocaleString()} ₽</p>
                </div>
              </div>
            ))}
          </div>
        )}
                {activeTab === 'users' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-lg font-black uppercase mb-4">Клиенты и Поставщики</h2>
            {users.map(user => (
              <div key={user.id} className="bg-white p-4 rounded-2xl mb-2 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.phone || 'Нет номера'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${user.role === 'supplier' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                  {user.role === 'supplier' ? 'ПОСТАВЩИК' : 'КЛИЕНТ'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- МОДАЛЬНЫЕ ОКНА --- */}

      {/* 1. Модалка добавления расхода на товар */}
      {actionType === 'expense' && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-black mb-4 uppercase">Доп. Расход</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedItem.model}</p>
            <input 
              type="number" 
              placeholder="Сумма расхода (₽)" 
              className="w-full p-4 bg-gray-100 rounded-2xl mb-4 font-bold outline-none focus:ring-2 ring-blue-500"
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
            <div className="flex gap-3">
              <button onClick={() => setActionType(null)} className="flex-1 py-4 font-bold text-gray-400">Отмена</button>
              <button 
                onClick={() => handleAddExpense(selectedItem.id, formData.amount)}
                className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Модалка продажи + Trade-in */}
      {actionType === 'sell' && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 my-auto animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-black mb-2 uppercase text-green-600">Оформить продажу</h3>
            <p className="text-xs text-gray-400 mb-6 font-mono">{selectedItem.model} (IMEI: {selectedItem.imei})</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Цена продажи (₽)</label>
                <input 
                  type="number" 
                  className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none"
                  onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2">Выбрать покупателя</label>
                <select 
                  className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none appearance-none"
                  onChange={(e) => setFormData({...formData, buyerId: e.target.value})}
                >
                  <option value="">Розничный клиент</option>
                  {users.filter(u => u.role === 'buyer').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase mb-3 flex items-center gap-2">
                  <RefreshCw size={14} /> Trade-in
                </p>
                <input 
                  type="text" 
                  placeholder="Модель (напр. iPhone 13)" 
                  className="w-full p-3 bg-white rounded-xl mb-2 text-sm outline-none"
                  onChange={(e) => setFormData({...formData, tradeInModel: e.target.value})}
                />
                <input 
                  type="number" 
                  placeholder="Цена приема (₽)" 
                  className="w-full p-3 bg-white rounded-xl text-sm outline-none"
                  onChange={(e) => setFormData({...formData, tradeInPrice: e.target.value})}
                />
                {formData.salePrice && formData.tradeInPrice && (
                  <p className="mt-2 text-xs font-bold text-blue-800">К доплате: {(formData.salePrice - formData.tradeInPrice).toLocaleString()} ₽</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setActionType(null)} className="flex-1 py-4 font-bold text-gray-400">Отмена</button>
              <button 
                onClick={() => handleSell(selectedItem.id, formData)}
                className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Навигация */}
      <div className="fixed bottom-6 left-5 right-5 h-18 bg-white/90 backdrop-blur-md rounded-[24px] shadow-2xl border border-gray-100 flex items-center justify-around px-2 z-[90]">
        <button 
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stock' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <Box size={20} strokeWidth={activeTab === 'stock' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase">Склад</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <History size={20} strokeWidth={activeTab === 'history' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase">Сделки</span>
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'users' ? 'text-blue-600 scale-110' : 'text-gray-400'}`}
        >
          <Users size={20} strokeWidth={activeTab === 'users' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase">Люди</span>
        </button>
      </div>

      {/* Сканер (Поверх всего) */}
      {showScanner && (
        <Scanner 
          onScan={(imei) => {
            const detected = detectDevice(imei);
            // Автоматическое открытие модалки добавления товара с предзаполненным IMEI
            setSelectedItem({ imei, model: detected.model, category: detected.category, isNew: true });
            setActionType('add_new'); 
            setShowScanner(false);
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {/* Модалка добавления нового товара (после сканирования) */}
      {actionType === 'add_new' && selectedItem?.isNew && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <h3 className="text-xl font-black mb-4 uppercase">Принять товар</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                defaultValue={selectedItem.model}
                placeholder="Модель"
                className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none"
                onChange={(e) => setSelectedItem({...selectedItem, model: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Цена закупа (₽)" 
                className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500"
                onChange={(e) => setSelectedItem({...selectedItem, purchase_price: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 px-2 uppercase font-bold">IMEI: {selectedItem.imei}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setActionType(null)} className="flex-1 py-4 font-bold text-gray-400">Отмена</button>
              <button 
                onClick={async () => {
                  const { error } = await supabase.from('stocks').insert([{
                    model: selectedItem.model,
                    imei: selectedItem.imei,
                    purchase_price: parseFloat(selectedItem.purchase_price),
                    category: selectedItem.category,
                    status: 'in_stock'
                  }]);
                  if (!error) {
                    fetchData();
                    setActionType(null);
                  }
                }}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg"
              >
                В корзину
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;