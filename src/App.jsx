import { useEffect, useState, useMemo } from 'react'
import { supabase } from './supabaseClient'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, LabelList, ComposedChart, Legend } from 'recharts'
import Scanner from './Scanner'
import './App.css'
import ExpenseModal from './components/ExpenseModal';
import BudgetModal from './components/BudgetModal';
import DebtModal from './components/DebtModal';
import SellModal from './components/SellModal';
import EditDealModal from './components/EditDealModal';
import ModelPickerModal from './components/ModelPickerModal';
import AddDealModal from './components/AddDealModal';

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
  const [scannerMode, setScannerMode] = useState('purchase') // 'purchase' или 'edit'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showSubModal, setShowSubModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('12')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(2) // 2 = СБП, 13 = Крипта
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
  const [isTradeIn, setIsTradeIn] = useState(false)
  const [tradeInModel, setTradeInModel] = useState('')
  const [tradeInPrice, setTradeInPrice] = useState('')
    const [touchStartX, setTouchStartX] = useState(null)
  const [swipedDealId, setSwipedDealId] = useState(null)
  
  // СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ
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
  // --- ШАГ 1: ФУНКЦИИ ДЛЯ РАБОТЫ СКАНЕРА (ВСТАВЛЯТЬ СЮДА) ---

  // 1. Функция автопроверки IMEI в базе Supabase
    // --- АВТООПРЕДЕЛЕНИЕ МОДЕЛИ ПО IMEI (МГНОВЕННО) ---
  const checkImeiAuto = async (imeiCode) => {
    if (!imeiCode || imeiCode.length < 8) return;
    const tac = imeiCode.substring(0, 8);

    // Расширенная база TAC-кодов айфонов (все регионы: США, Европа, Азия, Dual SIM)
    const localTacMap = {
      // iPhone 11
      "35282009": "iPhone 11", "35282109": "iPhone 11", "35651510": "iPhone 11",
      "35282209": "iPhone 11 Pro", "35651610": "iPhone 11 Pro",
      "35282309": "iPhone 11 Pro Max", "35651710": "iPhone 11 Pro Max",
      // iPhone 12
      "35304910": "iPhone 12 mini", "35305010": "iPhone 12",
      "35305110": "iPhone 12 Pro", "35305210": "iPhone 12 Pro Max",
      // iPhone 13
      "35613831": "iPhone 13 mini", "35613931": "iPhone 13", "35298911": "iPhone 13",
      "35614031": "iPhone 13 Pro", "35301411": "iPhone 13 Pro",
      "35614131": "iPhone 13 Pro Max", "35301511": "iPhone 13 Pro Max",
      // iPhone 14
      "35035759": "iPhone 14", "35674311": "iPhone 14",
      "35035859": "iPhone 14 Plus",
      "35035959": "iPhone 14 Pro", "35674511": "iPhone 14 Pro",
      "35036059": "iPhone 14 Pro Max", "35674611": "iPhone 14 Pro Max",
      // iPhone 15
      "35489182": "iPhone 15", "35105021": "iPhone 15", "35158284": "iPhone 15",
      "35489282": "iPhone 15 Plus",
      "35489382": "iPhone 15 Pro", "35105221": "iPhone 15 Pro", "35158584": "iPhone 15 Pro", "35759325": "iPhone 15 Pro",
      "35489482": "iPhone 15 Pro Max", "35105321": "iPhone 15 Pro Max", "35158684": "iPhone 15 Pro Max",
      // iPhone 16
      "35832145": "iPhone 16", "35832245": "iPhone 16 Plus",
      "35832345": "iPhone 16 Pro", "35832445": "iPhone 16 Pro Max",
    };

    // 1. Проверяем в локальной базе
    if (localTacMap[tac]) {
      setModel(localTacMap[tac]);
      if (typeof haptic === 'function') haptic('success');
      return;
    }

    // 2. Если в локальной базе TAC пока нет, запрашиваем Supabase Edge Function
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

  // --- ОТКРЫТИЕ ТОЛЬКО НАШЕГО КАСТОМНОГО СКАНЕРА ---
  const handleOpenScanner = (mode = 'purchase') => {
    // 1. Устанавливаем режим (покупка или редактирование)
    setScannerMode(mode);
    
    // 2. Даем вибрацию
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }

    // 3. ПРИНУДИТЕЛЬНО открываем только наш Scanner.jsx
    // Убираем отсюда любые проверки на tg.showScanQrPopup!
    setShowScanner(true);
  };

  // --- КОНЕЦ НОВЫХ ФУНКЦИЙ ---
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
    if (['success', 'error', 'warning'].includes(style)) {
      tg.HapticFeedback.notificationOccurred(style);
    } else {
      tg.HapticFeedback.impactOccurred(['light', 'medium', 'heavy', 'rigid', 'soft'].includes(style) ? style : 'light');
    }
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
    if (tg) {
      // Если ссылка ведет на Telegram (t.me), используем специальный метод
      if (url.includes('t.me')) {
        if (tg.openTelegramLink) {
          tg.openTelegramLink(url);
          return;
        }
      }
      // Для всех остальных сайтов
      if (tg.openLink) {
        tg.openLink(url);
        return;
      }
    }
    // Запасной вариант (если открыто в обычном браузере)
    window.open(url, '_blank');
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

      if (dealsData) {
        setDeals(dealsData);
        localStorage.setItem('pt_deals', JSON.stringify(dealsData));
      }
      if (contactsData) {
        setContacts(contactsData);
        localStorage.setItem('pt_contacts', JSON.stringify(contactsData));
      }
      if (genExpData) setGeneralExpenses(genExpData);
      if (debtsData) setDebts(debtsData);
      if (lbData) setLeaderboard(lbData);

      if (profileInfo) {
        if (!profileInfo.subscription_ends_at) {
          const trialEndsAt = new Date();
          trialEndsAt.setDate(trialEndsAt.getDate() + 7);
          const { data: updatedProfile } = await supabase.from('user_profiles').update({ subscription_ends_at: trialEndsAt.toISOString() }).eq('telegram_id', user.id).select().single();
          if (updatedProfile) {
            setProfileData(updatedProfile);
            setDisplayName(updatedProfile.display_name || user.first_name || 'Аноним');
            setBudget(Number(updatedProfile.resale_budget) || 0);
          }
        } else {
          setProfileData(profileInfo);
          setDisplayName(profileInfo.display_name || user.first_name || 'Аноним');
          setHideAmounts(profileInfo.hide_amounts || false);
          setShowChart(profileInfo.show_chart !== false);
          setDailySummary(profileInfo.daily_summary || false);
          setBudget(Number(profileInfo.resale_budget) || 0);
        }
      } else {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        const newProf = { telegram_id: user.id, user_name: user.first_name || 'Аноним', display_name: user.first_name || 'Аноним', show_in_leaderboard: false, resale_budget: 0, subscription_ends_at: trialEndsAt.toISOString() }
        const { data: createdProf } = await supabase.from('user_profiles').insert([newProf]).select().single();
        setProfileData(createdProf || newProf);
        setDisplayName(newProf.display_name);
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
    } finally {
      setIsInitialLoading(false);
    }
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
    setBackupJson(JSON.stringify(backup, null, 2));
    setShowBackupModal(true);
  }

  const processRestore = async (jsonString) => {
    if (!user) return;
    if (!jsonString || !jsonString.trim()) return alert('Вставьте текст резервной копии');
    if (!window.confirm('ВНИМАНИЕ! Текущие данные будут удалены и заменены данными из бэкапа. Продолжить?')) return;
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
      alert('✅ Данные успешно восстановлены!');
      setShowRestoreModal(false);
      setRestoreJson('');
      fetchData();
    } catch (err) {
      alert('Ошибка формата данных: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  }

  const updateSetting = async (key, value) => {
    haptic('medium');
    if (!user) return;
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
    if (!displayName.trim() || !user) return;
    haptic('medium');
    await supabase.from('user_profiles').update({ display_name: displayName.trim() }).eq('telegram_id', user.id)
    alert('✅ Имя профиля обновлено!')
  }

  const saveBudget = async () => {
    if (!tempBudget || !user) return;
    haptic('medium');
    const newBudget = Number(tempBudget);
    setBudget(newBudget);
    const { error } = await supabase.from('user_profiles').update({ resale_budget: newBudget }).eq('telegram_id', user.id);
    if (error) alert('Ошибка: ' + error.message);
    else setShowBudgetModal(false);
  }

  const saveDebt = async () => {
    if (!user) return;
    if (!debtContactId) return alert('Выберите контакт!');
    if (!debtAmount || Number(debtAmount) <= 0) return alert('Введите корректную сумму!');
    haptic('medium');
    const { error } = await supabase.from('debts').insert([{ user_id: user.id, contact_id: Number(debtContactId), amount: Number(debtAmount), type: debtType }]);
    if (error) alert('Ошибка: ' + error.message);
    else { setDebtContactId(''); setDebtAmount(''); setDebtType('they_owe'); setShowDebtModal(false); fetchData(); }
  }

  const deleteDebt = async (id) => {
    if (!window.confirm('Удалить эту запись о долге?')) return;
    await supabase.from('debts').delete().eq('id', id);
    fetchData();
  }

  const clearAllData = async () => {
    if (!window.confirm('ВНИМАНИЕ! Это удалит ВСЕ ваши сделки, контакты и расходы. Продолжить?')) return;
    setIsActionLoading(true);
    try {
      await supabase.from('deals').delete().eq('user_id', user.id);
      await supabase.from('expenses').delete().eq('user_id', user.id);
      await supabase.from('contacts').delete().eq('user_id', user.id);
      await supabase.from('debts').delete().eq('user_id', user.id);
      localStorage.removeItem('pt_deals');
      localStorage.removeItem('pt_contacts');
      fetchData(); haptic('heavy');
    } catch (error) { alert('Ошибка: ' + error.message); }
    finally { setIsActionLoading(false); }
  };

  const handleExportClick = () => {
    haptic();
    if (deals.length === 0) return alert('Нет данных для экспорта');
    const headers = ['Категория', 'Модель', 'Описание', 'Кол-во', 'Закупка', 'Продажа', 'Прибыль', 'Дата покупки', 'Дата продажи'];
    const rows = deals.map(d => {
      const exp = getDealExpensesSum(d);
      const initQty = (d.quantity || 0) + (d.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? exp / initQty : 0;
      const m = d.sold_quantity > 0 ? (d.sold_quantity * (Number(d.sell_price) || 0)) - (d.sold_quantity * Number(d.buy_price)) - (d.sold_quantity * perUnitExp) : '';
      return [
        `"${d.category || ''}"`, `"${d.model}"`, `"${d.description || ''}"`, initQty, d.buy_price, d.sell_price || '', m,
        new Date(d.created_at).toLocaleDateString('ru-RU'),
        d.sold_at ? new Date(d.sold_at).toLocaleDateString('ru-RU') : ''
      ].join(';');
    });
    setCsvData([headers.join(';'), ...rows].join('\n'));
    setShowExportModal(true);
  }

  const downloadCsv = () => {
    const blob = new Blob(["\uFEFF" + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PrimeTrade_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };
  // Функция для удаления файлов из Supabase Storage
  const deletePhotosFromStorage = async (photoUrls) => {
    if (!photoUrls || photoUrls.length === 0) return;
    try {
      // Извлекаем имя файла из полного URL (нам нужна только последняя часть ссылки)
      const filePaths = photoUrls.map(url => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      }).filter(Boolean); // Убираем пустые значения, если вдруг попались

      if (filePaths.length > 0) {
        const { error } = await supabase.storage.from('deal-photos').remove(filePaths);
        if (error) console.error("Ошибка при удалении фото из Storage:", error);
        else console.log("🗑️ Фото успешно удалены из облака:", filePaths);
      }
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  };
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (dealPhotos.length + files.length > 3) {
      setPhotoLimitWarning(true);
      setTimeout(() => setPhotoLimitWarning(false), 3000);
      return;
    }
    setUploadingPhoto(true);
    const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        const { error } = await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName);
        newUrls.push(publicUrl);
      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
    }
    setDealPhotos(prev => [...prev, ...newUrls]);
    setUploadingPhoto(false);
  }

  const handleAddModalPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (addFormPhotos.length + files.length > 3) {
      alert('Максимум 3 фото');
      return;
    }
    setUploadingAddPhoto(true);
    const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        const { error } = await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName);
        newUrls.push(publicUrl);
      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
    }
    setAddFormPhotos(prev => [...prev, ...newUrls]);
    setUploadingAddPhoto(false);
  }

  const handleEditPhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (editPhotos.length + files.length > 3) {
      alert('Максимум 3 фото');
      return;
    }
    setUploadingEditPhoto(true);
    const newUrls = [];
    for (const file of files) {
      try {
        const compressedBlob = await compressImage(file);
        const fileName = `${user.id}-${Date.now()}-${Math.random()}.jpg`;
        const { error } = await supabase.storage.from('deal-photos').upload(fileName, compressedBlob, { contentType: 'image/jpeg' });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName);
        newUrls.push(publicUrl);
      } catch (err) { alert('Ошибка загрузки: ' + err.message); }
    }
    setEditPhotos(prev => [...prev, ...newUrls]);
    setUploadingEditPhoto(false);
  }

  const addDeal = async (e) => {
    e.preventDefault()
    if (!model || !buyPrice || !user) return alert('Заполните модель и цену')
    setIsActionLoading(true)
    try {
      const qty = Math.max(1, Number(dealQuantity) || 1);
      const { data: newDeals, error } = await supabase.from('deals').insert([{
        model, buy_price: Number(buyPrice), status: 'in_stock',
        category: detectCategory(model),
        quantity: qty,
        sold_quantity: 0,
        is_accounted: true,
        description: dealDescription || null,
        storage_gb: storage ? Number(storage) : null, battery_health: battery ? Number(battery) : null,
        imei: imei || null, seller_id: sellerId ? Number(sellerId) : null,
        user_id: user.id, user_name: displayName || 'Аноним',
        location: dealLocation || null,
        photos: dealPhotos.length > 0 ? dealPhotos : null
      }]).select()

      if (error) throw new Error(error.message);

      if (newDeals && newDeals.length > 0) {
        const newDealId = newDeals[0].id;
        if (newDealExpAmount && Number(newDealExpAmount) > 0) {
          await supabase.from('expenses').insert([{ deal_id: newDealId, amount: Number(newDealExpAmount), category: newDealExpCat, user_id: user.id }])
        }
        setModel(''); setBuyPrice(''); setStorage(''); setBattery(''); setImei(''); setSellerId('');
        setNewDealExpAmount(''); setNewDealExpCat('Ремонт'); setDealLocation(''); setDealPhotos([]); setDealDescription('');
        setDealQuantity('1');
        await fetchData();
        haptic('medium');
        setShowSuccessMsg(true);
        setTimeout(() => setShowSuccessMsg(false), 3000);
      }
    } catch (err) {
      alert('Ошибка базы данных: ' + err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const addManualProduct = async () => {
    if (!addForm.model || !addForm.buy_price || !user) return alert('Заполните модель и цену');
    if (!selectedCategory) return;
    setIsActionLoading(true);
    try {
      const qty = Math.max(1, Number(addForm.quantity) || 1);
      const { data: newDeals, error } = await supabase.from('deals').insert([{
        model: addForm.model,
        category: selectedCategory,
        buy_price: Number(addForm.buy_price),
        quantity: qty,
        sold_quantity: 0,
        is_accounted: addForm.is_accounted,
        status: 'in_stock',
        description: addForm.description || null,
        imei: addForm.imei || null,
        location: addForm.location || null,
        photos: addFormPhotos.length > 0 ? addFormPhotos : null,
        user_id: user.id,
        user_name: displayName || 'Аноним'
      }]).select();

      if (error) throw new Error(error.message);

      if (newDeals && newDeals.length > 0) {
        setShowAddModal(false);
        setAddForm({ model: '', description: '', buy_price: '', quantity: '1', location: '', is_accounted: true, imei: '' });
        setAddFormPhotos([]);
        await fetchData(); 
        haptic('success');
      }
    } catch (err) {
      alert('Ошибка базы данных: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

    const confirmSell = async () => {
    if (!sellPrice) return alert('Введите цену')
    const qtyToSell = Number(sellQuantity) || 1;
    if (qtyToSell > sellingDeal.quantity) return alert(`В наличии только ${sellingDeal.quantity} шт.`);
    
    // Проверка для Trade-in
    if (isTradeIn && (!tradeInModel || !tradeInPrice)) {
      return alert('Заполните модель и цену оценки Trade-in устройства');
    }

    setIsActionLoading(true);
    try {
      const newQuantity = sellingDeal.quantity - qtyToSell;
      const newSoldQuantity = (sellingDeal.sold_quantity || 0) + qtyToSell;
      const newStatus = newQuantity === 0 ? 'sold' : 'in_stock';
      
      // 1. Обновляем статус текущего устройства (Продажа)
      const { error } = await supabase.from('deals').update({
        quantity: newQuantity,
        sold_quantity: newSoldQuantity,
        sell_price: Number(sellPrice),
        status: newStatus,
        buyer_id: buyerId ? Number(buyerId) : null,
        sold_at: newQuantity === 0 ? new Date().toISOString() : sellingDeal.sold_at,
        warranty_months: Number(sellWarranty)
      }).eq('id', sellingDeal.id);
      
      if (error) throw new Error(error.message);

      // 2. Если включен Trade-in, автоматом кидаем новое устройство на склад
      if (isTradeIn) {
        const { error: tradeInError } = await supabase.from('deals').insert([{
          model: tradeInModel,
          buy_price: Number(tradeInPrice),
          status: 'in_stock',
          category: detectCategory(tradeInModel), // Автоматически определит категорию
          quantity: 1,
          sold_quantity: 0,
          is_accounted: true,
          user_id: user.id,
          user_name: displayName || 'Аноним',
          seller_id: buyerId ? Number(buyerId) : null, // Покупатель стал продавцом
          description: `🔄 Принято по Trade-in при продаже ${sellingDeal.model}`
        }]);
        if (tradeInError) throw new Error("Ошибка Trade-in: " + tradeInError.message);
      }
      
      setSellingDeal(null);
      setIsTradeIn(false);
      setTradeInModel('');
      setTradeInPrice('');
      await fetchData();
      haptic('success');
    } catch (err) {
      alert('Ошибка при продаже: ' + err.message);
    } finally {
      setIsActionLoading(false);
    }
  }

  const addGeneralExpense = async (e) => {
    e.preventDefault();
    if (!genExpAmount || !user) return;
    setIsActionLoading(true);
    const finalCategory = genExpCategory === 'Свой вариант' ? (customGenExpCategory || 'Другое') : genExpCategory;
    await supabase.from('expenses').insert([{ amount: Number(genExpAmount), category: finalCategory, user_id: user.id }]);
    setGenExpAmount(''); setCustomGenExpCategory(''); setGenExpCategory('Авито');
    fetchData(); haptic('medium');
    setIsActionLoading(false);
  }

  const addContact = async (e) => {
    e.preventDefault();
    if (!contactName || !user) return;
    setIsActionLoading(true);
    await supabase.from('contacts').insert([{ name: contactName, phone: contactPhone, note: contactNote, user_id: user.id }]);
    setContactName(''); setContactPhone(''); setContactNote(''); fetchData();
    setIsActionLoading(false);
  }

    const deleteDeal = async (id) => { 
    if (!window.confirm('Удалить устройство?')) return; 
    
    // 1. Находим сделку, чтобы взять её фото
    const dealToDelete = deals.find(d => d.id === id);
    
    // 2. Если у сделки были фото — удаляем их из облака
    if (dealToDelete && dealToDelete.photos && dealToDelete.photos.length > 0) {
      await deletePhotosFromStorage(dealToDelete.photos);
    }
    
    // 3. Удаляем саму сделку из базы
    await supabase.from('deals').delete().eq('id', id); 
    fetchData(); 
  }
  const deleteExpense = async (id) => { if (!window.confirm('Удалить расход?')) return; await supabase.from('expenses').delete().eq('id', id); fetchData(); }
  const confirmExpense = async () => { if (!expenseAmount || !user) return; await supabase.from('expenses').insert([{ deal_id: expenseDeal.id, amount: Number(expenseAmount), category: expenseCategory, user_id: user.id }]); setExpenseDeal(null); fetchData(); }
  const saveEditContact = async () => { if (!editContactName) return; await supabase.from('contacts').update({ name: editContactName, phone: editContactPhone, note: editContactNote }).eq('id', editingContact.id); setEditingContact(null); fetchData(); }
  const deleteContact = async (id) => { if (!window.confirm('Удалить контакт?')) return; await supabase.from('contacts').delete().eq('id', id); fetchData(); }
  
    const saveEdit = async () => { 
    if (!editModel || !editBuyPrice) return; 
    
    // 1. Находим фото, которые были удалены (были в старой сделке, но нет в новой)
    const oldPhotos = editingDeal.photos || [];
    const removedPhotos = oldPhotos.filter(url => !editPhotos.includes(url));
    
    // 2. Если такие фото есть — удаляем их из облака
    if (removedPhotos.length > 0) {
      await deletePhotosFromStorage(removedPhotos);
    }

    // 3. Сохраняем изменения в БД
    await supabase.from('deals').update({ 
      model: editModel, 
      buy_price: Number(editBuyPrice), 
      location: editLocation, 
      description: editDescription || null,
      imei: editImei || null,
      seller_id: editSellerId ? Number(editSellerId) : null,
      photos: editPhotos.length > 0 ? editPhotos : null
    }).eq('id', editingDeal.id); 
    
    setEditingDeal(null); 
    fetchData(); 
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

  const formatMoney = (amount) => {
    if (hideAmounts) return '*** ₽';
    return (Number(amount) || 0).toLocaleString('ru-RU') + ' ₽';
  }

  const getDealExpensesSum = (deal) => (deal.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // ==========================================
  // ОПТИМИЗИРОВАННЫЕ ФИНАНСОВЫЕ РАСЧЕТЫ
  // ==========================================
  const {
    inStockDeals, soldDeals, accountedDeals,
    totalInvestedInStock, totalRevenue, totalBuySold, totalExpSold,
    realizedProfit, totalGenExp, freeCash, totalCapital, percentInvested,
    totalUnitsSold, avgProfit, inStockExpenses, marginPercent,
    totalTheyOwe, totalIOwe, topModels, chartData
  } = useMemo(() => {
    const inStock = deals.filter(d => (d.quantity || 0) > 0);
    const sold = deals.filter(d => (d.sold_quantity || 0) > 0);
    const accounted = deals.filter(d => d.is_accounted !== false);

    const invested = inStock.filter(d => d.is_accounted !== false).reduce((sum, deal) => {
      const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
      return sum + (deal.quantity * Number(deal.buy_price)) + (deal.quantity * perUnitExp);
    }, 0);

    const revenue = accounted.reduce((sum, deal) => sum + (deal.sold_quantity || 0) * (Number(deal.sell_price) || 0), 0);
    const buySold = accounted.reduce((sum, deal) => sum + (deal.sold_quantity || 0) * Number(deal.buy_price), 0);
    const expSold = accounted.reduce((sum, deal) => {
      const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
      return sum + (deal.sold_quantity || 0) * perUnitExp;
    }, 0);

    const profit = revenue - buySold - expSold;
    const genExp = generalExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    
    const freeCashVal = budget + profit - genExp - invested;
    const totalCapitalVal = freeCashVal + invested;
    const percentInv = totalCapitalVal > 0 ? (invested / totalCapitalVal) * 100 : 0;

    const unitsSold = accounted.reduce((sum, deal) => sum + (deal.sold_quantity || 0), 0);
    const avg = unitsSold > 0 ? profit / unitsSold : 0;
    
    const stockExp = inStock.filter(d => d.is_accounted !== false).reduce((sum, deal) => {
      const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
      return sum + (deal.quantity * perUnitExp);
    }, 0);
    
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    const theyOwe = debts.filter(d => d.type === 'they_owe').reduce((sum, d) => sum + Number(d.amount), 0);
    const iOwe = debts.filter(d => d.type === 'i_owe').reduce((sum, d) => sum + Number(d.amount), 0);

    const modelStats = accounted.filter(d => d.sold_quantity > 0).reduce((acc, deal) => {
      if (!acc[deal.model]) acc[deal.model] = { count: 0, profit: 0 };
      const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
      acc[deal.model].count += deal.sold_quantity;
      acc[deal.model].profit += deal.sold_quantity * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
      return acc;
    }, {});
    
    const top = Object.entries(modelStats)
      .map(([name, stats]) => ({ name, avg: stats.profit / stats.count, count: stats.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3);

    const monthlyProfits = accounted.filter(d => d.sold_quantity > 0).reduce((acc, deal) => {
      const date = new Date(deal.sold_at || deal.created_at || Date.now());
      const monthYear = date.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
      const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
      const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
      const p = deal.sold_quantity * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
      if (!acc[monthYear]) acc[monthYear] = 0;
      acc[monthYear] += p;
      return acc;
    }, {});
    
    const chart = Object.entries(monthlyProfits).map(([name, profit]) => ({ name, profit })).reverse();

    return {
      inStockDeals: inStock, soldDeals: sold, accountedDeals: accounted,
      totalInvestedInStock: invested, totalRevenue: revenue, totalBuySold: buySold, totalExpSold: expSold,
      realizedProfit: profit, totalGenExp: genExp, freeCash: freeCashVal, totalCapital: totalCapitalVal, percentInvested: percentInv,
      totalUnitsSold: unitsSold, avgProfit: avg, inStockExpenses: stockExp, marginPercent: margin,
      totalTheyOwe: theyOwe, totalIOwe: iOwe, topModels: top, chartData: chart
    };
  }, [deals, generalExpenses, debts, budget]); 
  // ==========================================
  // ЛЕНТА ТРАНЗАКЦИЙ И CASH FLOW
  // ==========================================
  const { transactionFeed, cashFlowData } = useMemo(() => {
    const feed = [];
    const monthly = {};

    const addToMonth = (dateStr, income, expense) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = d.toLocaleString('ru-RU', { month: 'short', year: '2-digit' });
      if (!monthly[key]) monthly[key] = { name: key, income: 0, expense: 0, sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      monthly[key].income += income;
      monthly[key].expense += expense;
    };

            deals.forEach(d => {
      // 1. Продажа (доход). Считаем выручку.
      if (d.sold_quantity > 0 && d.sold_at) {
        const sellSum = d.sold_quantity * Number(d.sell_price);
        feed.push({
          id: `sell-${d.id}`, type: 'sale', date: new Date(d.sold_at),
          title: `Продажа: ${d.model}`, sub: `${d.sold_quantity} шт.`, amount: sellSum
        });
        addToMonth(d.sold_at, sellSum, 0);
      }

      // 2. Расходы по сделке (Ремонт, Запчасти и т.д. - те, что добавляем при покупке или на складе)
      // Закупку (buy_price) мы тут НЕ считаем!
      if (d.expenses && d.expenses.length > 0) {
        d.expenses.forEach(e => {
          const expDate = new Date(e.created_at || d.created_at || Date.now());
          feed.push({
            id: `dexp-${e.id}`, type: 'expense', date: expDate,
            title: e.category, sub: d.model, amount: -Number(e.amount)
          });
          addToMonth(expDate, 0, Number(e.amount));
        });
      }
    });

    // 3. Общие доп. расходы (Авито, Такси, Аренда)
    generalExpenses.forEach(e => {
      const expDate = new Date(e.created_at || Date.now());
      feed.push({
        id: `gexp-${e.id}`, type: 'expense', date: expDate,
        title: e.category, sub: 'Общий расход', amount: -Number(e.amount)
      });
      addToMonth(expDate, 0, Number(e.amount));
    });

    // 4. Общие расходы
    generalExpenses.forEach(e => {
      const expDate = new Date(e.created_at || Date.now());
      feed.push({
        id: `gexp-${e.id}`, type: 'expense', date: expDate,
        title: e.category, sub: 'Общий расход', amount: -Number(e.amount)
      });
      addToMonth(expDate, 0, Number(e.amount));
    });

    // Сортируем ленту от новых к старым
    feed.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Сортируем месяцы по хронологии
    const cashFlow = Object.values(monthly).sort((a, b) => a.sortDate - b.sortDate);

    return { transactionFeed: feed.slice(0, 15), cashFlowData: cashFlow }; // Берем 15 последних транзакций
  }, [deals, generalExpenses]);
    const { filteredStock, filteredSold } = useMemo(() => {
    const filterFn = (list) => {
      return list.filter(deal => {
        const matchesModel = filterModels.length > 0 ? filterModels.includes(deal.model) : true;
        const matchesSearch = searchQuery ? (String(deal.model || '').toLowerCase().includes(searchQuery.toLowerCase()) || (deal.imei && String(deal.imei).includes(searchQuery))) : true;
        return matchesModel && matchesSearch;
      });
    };
    return {
      filteredStock: filterFn(inStockDeals),
      filteredSold: filterFn(soldDeals)
    };
  }, [inStockDeals, soldDeals, searchQuery, filterModels]);
  // Умные иконки для категорий расходов
  const getCategoryIcon = (cat) => {
    if (!cat) return '💸';
    const c = cat.toLowerCase();
    if (c.includes('авито') || c.includes('реклам')) return '📢';
    if (c.includes('такси') || c.includes('доставк')) return '🚕';
    if (c.includes('бензин') || c.includes('заправк')) return '⛽';
    if (c.includes('запчаст') || c.includes('ремонт')) return '🛠️';
    if (c.includes('аренд')) return '🏢';
    if (c.includes('ед') || c.includes('обед')) return '🍔';
    return '💸';
  };
  const getDaysOnStock = (deal) => {
    const start = new Date(deal.created_at || Date.now());
    const end = (deal.quantity === 0 && deal.sold_at) ? new Date(deal.sold_at) : new Date();
    return Math.floor(Math.abs(end - start) / (1000 * 60 * 60 * 24));
  }

  const getWarrantyBadge = (deal) => {
    if (!deal.warranty_months || deal.warranty_months === 0) return null;
    const end = new Date(deal.sold_at || Date.now());
    end.setMonth(end.getMonth() + Number(deal.warranty_months));
    const now = new Date();
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
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
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-card"></div>
    </div>
  )

  const getFinancialStats = () => {
    const now = new Date();
    let thisMonthTotal = 0;
    const categoryTotals = {};

    generalExpenses.forEach(exp => {
      const amount = Number(exp.amount) || 0;
      const date = new Date(exp.created_at || Date.now());
      
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        thisMonthTotal += amount;
      }
      
      if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
      categoryTotals[exp.category] += amount;
    });

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ['Нет', 0];
    
    return { thisMonthTotal, topCategory };
  };
  const finStats = getFinancialStats();

  const isPro = profileData?.is_admin || (profileData?.subscription_ends_at && new Date(profileData.subscription_ends_at) > new Date());

  const requirePro = (action) => {
    if (!isPro) {
      haptic('error');
      setShowSubModal(true);
      return;
    }
    action();
  }

  // =============== ГЛАВНАЯ ===============
  const renderHome = () => {
    const percentInvested = budget > 0 ? (totalInvestedInStock / (budget + realizedProfit)) * 100 : 0;

    return (
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Статистика</h2>

                <div className="card neon-card-blue" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 'bold' }}>Финансы</div>
            <button onClick={() => { setTempBudget(budget); setShowBudgetModal(true); haptic(); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 'bold', fontSize: 14, cursor: 'pointer' }}>Изменить ✏️</button>
          </div>
          
          {budget > 0 ? (
            <>
              {/* Главная цифра - Свободные средства */}
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Свободные средства:</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 15 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: freeCash >= 0 ? 'var(--success)' : 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(freeCash)}</div>
              </div>

              {/* Полоска заполненности (сколько денег в товаре) */}
              <div style={{ width: '100%', height: 8, backgroundColor: 'var(--bg-color)', borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(Math.max(percentInvested, 0), 100)}%`, height: '100%', backgroundColor: percentInvested > 80 ? 'var(--danger)' : 'var(--warning)', borderRadius: 4 }}></div>
              </div>

              {/* Четкая расшифровка доходов и расходов */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>В товаре (заморожено):</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{formatMoney(totalInvestedInStock)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Общий капитал:</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{formatMoney(totalCapital)}</span>
                </div>
                <div style={{ fontSize: 11, fontStyle: 'italic', marginTop: 4, textAlign: 'center', opacity: 0.7 }}>
                  (Начальный бюджет + Прибыль - Расходы)
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>Бюджет не задан</div>
              <button className="btn-primary" style={{ padding: '10px', fontSize: 14 }} onClick={() => { setTempBudget(''); setShowBudgetModal(true); haptic(); }}>Указать начальный бюджет</button>
            </div>
          )}
        </div>

        <div className="main-profit-card" style={{ boxShadow: '0 0 30px rgba(10, 186, 181, 0.3)' }}>
          <h3>Реализованная прибыль</h3>
          <div className="main-profit-value" style={{ fontSize: realizedProfit > 999999 ? 28 : 38 }}>{formatMoney(realizedProfit)}</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16 }}>
            <div className="stat-row"><span>Выручка с продаж:</span> <span>{formatMoney(totalRevenue)}</span></div>
            <div className="stat-row"><span>Средняя прибыль (с 1 шт):</span> <span>{formatMoney(avgProfit)}</span></div>
            <div className="stat-row"><span>Рентабельность:</span> <span>{marginPercent.toFixed(1)}%</span></div>
            <div className="stat-row"><span>Расходы на складе:</span> <span>{formatMoney(inStockExpenses)}</span></div>
            <div className="stat-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <span>Доп. расходы:</span> <span>{formatMoney(totalGenExp)}</span>
            </div>
            <div className="stat-row" style={{ color: '#e0ffff' }}>
              <span>Общие расходы:</span> <span>{formatMoney(inStockExpenses + totalGenExp)}</span>
            </div>
          </div>
        </div>

        <div className="debt-card neon-glow-orange" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3>Долги и задатки</h3>
            <button onClick={() => { setDebtContactId(''); setDebtAmount(''); setShowDebtModal(true); haptic(); }} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}>+ Добавить</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, marginBottom: 15 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ opacity: 0.8, fontSize: 13 }}>Мне должны:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalTheyOwe)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'right' }}>
              <span style={{ opacity: 0.8, fontSize: 13 }}>Я должен:</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatMoney(totalIOwe)}</span>
            </div>
          </div>
          {debts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {debts.map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: '8px 12px', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 'bold' }}>{d.contact?.name || 'Без имени'}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{d.type === 'they_owe' ? 'Мне должен' : 'Я должен'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 'bold', fontVariantNumeric: 'tabular-nums' }}>{formatMoney(d.amount)}</span>
                    <button onClick={() => deleteDebt(d.id)} style={{ background: 'none', border: 'none', color: 'white', opacity: 0.6, cursor: 'pointer', fontSize: 16 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {topModels.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 15 }}>Топ моделей по марже</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topModels.map((m, idx) => (
                <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: idx !== topModels.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Продано: {m.count} шт.</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>+{formatMoney(m.avg)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: '#666' }}>На складе</h3>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{inStockDeals.reduce((s, d) => s + (d.quantity || 0), 0)} шт.</div>
          </div>
          <button className="btn-success" onClick={() => requirePro(handleExportClick)} style={{ width: '100%', padding: '14px', fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>📥 Экспорт в Excel {!isPro && '🔒'}</button>
        </div>

        <button onClick={clearAllData} disabled={isActionLoading} style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: 'var(--card-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 0 15px rgba(255,59,48,0.1)' }}>
          🗑️ {isActionLoading ? 'Очистка...' : 'Очистить статистику'}
        </button>

                {showChart && cashFlowData.length > 0 && (
          <div className="card" style={{ paddingBottom: 10 }}>
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 15 }}>Движение денежных средств</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8e8e93' }} />
                  
                  <Tooltip 
                    cursor={{ fill: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} 
                    contentStyle={{ borderRadius: 12, border: 'none', backgroundColor: isDarkTheme ? '#1c1c1e' : '#ffffff', color: isDarkTheme ? '#fff' : '#000' }} 
                    formatter={(value, name) => {
                      // Вот тут мы четко разделяем названия
                      if (name === 'income') return [formatMoney(value), 'Выручка (Доход)'];
                      if (name === 'expense') return [formatMoney(value), 'Расходы (Ремонт, Такси и др.)'];
                      return [formatMoney(value), name];
                    }} 
                  />
                  
                  <Legend 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: 12, paddingTop: 10 }} 
                    formatter={(value) => value === 'income' ? 'Доход' : 'Расход'} 
                  />
                  
                  <Bar dataKey="income" name="income" fill="#34c759" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="expense" name="expense" fill="#ff3b30" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
                <div className="card" style={{ paddingBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ fontSize: 16, margin: 0 }}>История операций</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Последние 15</span>
          </div>
          
          {transactionFeed.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: 14 }}>Пока нет операций</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transactionFeed.map((tx, idx) => (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx !== transactionFeed.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: idx !== transactionFeed.length - 1 ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Иконка операции */}
                    <div style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: tx.amount > 0 ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 59, 48, 0.1)', color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16 }}>
                      {tx.type === 'sale' ? '💰' : tx.type === 'purchase' ? '📦' : '📉'}
                    </div>
                    {/* Текст */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.sub} • {tx.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</div>
                    </div>
                  </div>
                  {/* Сумма */}
                  <div style={{ fontWeight: 700, fontSize: 15, color: tx.amount > 0 ? 'var(--success)' : 'var(--text-main)', fontVariantNumeric: 'tabular-nums' }}>
                    {tx.amount > 0 ? '+' : ''}{formatMoney(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // =============== КАЛЬКУЛЯТОР ===============
  const renderCalculator = () => {
    const calcBuyCost = (Number(calcBuyPrice) || 0) * (Number(calcBuyQty) || 0);
    const calcSellRevenue = (Number(calcSellPrice) || 0) * (Number(calcSellQty) || 0);
    const feeAmount = calcIsAvitoDelivery ? calcSellRevenue * (Number(calcFee) / 100) : 0;
    const netRevenue = calcSellRevenue - feeAmount;
    const extraCosts = Number(calcExtraCosts) || 0;
    const totalCosts = calcBuyCost + extraCosts;
    const plannedProfit = netRevenue - totalCosts;
    const newFreeCash = freeCash - totalCosts + netRevenue;
    const isEnoughMoney = newFreeCash >= 0;
    const roi = totalCosts > 0 ? (plannedProfit / totalCosts) * 100 : 0;

    const modelHistory = calcModel ? deals.filter(d => d.model === calcModel) : [];
    const soldHistory = modelHistory.filter(d => d.sold_quantity > 0 && d.sell_price);
    const avgMarketBuy = modelHistory.length > 0 ? modelHistory.reduce((sum, d) => sum + Number(d.buy_price), 0) / modelHistory.length : 0;
    const avgMarketSell = soldHistory.length > 0 ? soldHistory.reduce((sum, d) => sum + Number(d.sell_price), 0) / soldHistory.length : 0;

    return (
      <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => { setActiveTab('home'); haptic(); }} style={{ background: 'none', border: 'none', fontSize: 24, padding: '0 10px 0 0', cursor: 'pointer', color: 'var(--accent)' }}>←</button>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Калькулятор</h2>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)' }}>Текущая ситуация</h3>
          <div className="stat-row"><span>Свободные средства:</span> <span>{formatMoney(freeCash)}</span></div>
          <div className="stat-row"><span>Заморожено в товаре:</span> <span>{formatMoney(totalInvestedInStock)}</span></div>
          <div className="stat-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontWeight: 'bold', fontSize: 16 }}>
            <span>Общий капитал:</span> <span>{formatMoney(freeCash + totalInvestedInStock)}</span></div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)' }}>Параметры сделки</h3>
          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Модель (для справки)</label>
          <div className="input-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
            <div onClick={() => { setPickerMode('calculator'); setShowModelPicker(true); haptic(); }} style={{ flex: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ color: calcModel ? 'var(--text-main)' : 'var(--text-muted)' }}>{calcModel || 'Выберите модель...'}</span>
              <span style={{ opacity: 0.5 }}>▼</span>
            </div>
            {calcModel && <button onClick={() => { setCalcModel(''); setCalcBuyPrice(''); setCalcSellPrice(''); haptic(); }} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, padding: '10px 16px', cursor: 'pointer', borderLeft: '1px solid var(--border)' }}>✕</button>}
          </div>

          {calcModel && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: 10, borderRadius: 8, marginBottom: 15, fontSize: 13, color: 'var(--text-muted)' }}>
              {avgMarketBuy > 0 || avgMarketSell > 0 ? (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Твоя история по {calcModel}:</div>
                  {avgMarketBuy > 0 && <div>Средняя покупка: {formatMoney(avgMarketBuy)}</div>}
                  {avgMarketSell > 0 && <div>Средняя продажа: {formatMoney(avgMarketSell)}</div>}
                </>
              ) : <div>Ты впервые работаешь с этой моделью.</div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цена закупа (₽)</label>
              <input className="input-field" type="text" inputMode="numeric" placeholder="0" value={calcBuyPrice} onChange={(e) => setCalcBuyPrice(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Кол-во</label>
              <input className="input-field" type="text" inputMode="numeric" placeholder="1" value={calcBuyQty} onChange={(e) => setCalcBuyQty(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Цена продажи (₽)</label>
              <input className="input-field" type="text" inputMode="numeric" placeholder="0" value={calcSellPrice} onChange={(e) => setCalcSellPrice(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
            <div style={{ width: 80 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Кол-во</label>
              <input className="input-field" type="text" inputMode="numeric" placeholder="1" value={calcSellQty} onChange={(e) => setCalcSellQty(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
          </div>

          <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Доп. расходы на партию</label>
          <input className="input-field" type="text" inputMode="numeric" placeholder="0" value={calcExtraCosts} onChange={(e) => setCalcExtraCosts(e.target.value.replace(/[^\d]/g, ''))} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold' }}>Продажа через Авито Доставку?</label>
            <button onClick={() => { setCalcIsAvitoDelivery(!calcIsAvitoDelivery); haptic(); }} style={{ padding: '6px 12px', borderRadius: 20, background: calcIsAvitoDelivery ? '#34c759' : '#e5e5ea', color: calcIsAvitoDelivery ? '#fff' : '#000', border: 'none', fontWeight: 'bold' }}>{calcIsAvitoDelivery ? 'ДА' : 'НЕТ'}</button>
          </div>

          {calcIsAvitoDelivery && (
            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Комиссия Авито (%)</label>
              <input className="input-field" type="text" inputMode="numeric" placeholder="7" value={calcFee} onChange={(e) => setCalcFee(e.target.value.replace(/[^\d]/g, ''))} />
            </div>
          )}
        </div>

        <div className="card" style={{ backgroundColor: isEnoughMoney ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', border: `1px solid ${isEnoughMoney ? 'var(--success)' : 'var(--danger)'}`, boxShadow: isEnoughMoney ? '0 0 20px rgba(52,199,89,0.2)' : '0 0 20px rgba(255,59,48,0.2)' }}>
          <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-main)' }}>Результат</h3>
          {calcBuyCost > freeCash && <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: 10, fontSize: 14 }}>⚠️ Не хватает {formatMoney(calcBuyCost - freeCash)} на закуп.</div>}
          {calcIsAvitoDelivery && <div className="stat-row"><span>Комиссия Авито:</span> <span style={{ color: 'var(--danger)' }}>-{formatMoney(feeAmount)}</span></div>}
          {extraCosts > 0 && <div className="stat-row"><span>Доп. расходы:</span> <span style={{ color: 'var(--danger)' }}>-{formatMoney(extraCosts)}</span></div>}
          <div className="stat-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span>Рентабельность (ROI):</span>
            <span style={{ fontWeight: 'bold', color: roi >= 15 ? 'var(--success)' : roi > 0 ? 'var(--warning)' : 'var(--danger)' }}>{roi.toFixed(1)}%</span>
          </div>
          <div className="stat-row" style={{ fontSize: 16, fontWeight: 'bold', marginTop: 5 }}>
            <span>Планируемая прибыль:</span>
            <span style={{ color: plannedProfit >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatMoney(plannedProfit)}</span>
          </div>
          <div className="stat-row" style={{ fontSize: 18, fontWeight: 'bold', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span>Бюджет после сделок:</span> <span style={{ color: isEnoughMoney ? 'var(--success)' : 'var(--danger)' }}>{formatMoney(newFreeCash)}</span>
          </div>
        </div>
      </div>
    );
  }

  // =============== ПОКУПКА ===============
  const renderPurchase = () => {
    const isNoStorage = model.includes('AirPods') || model.includes('Apple Watch');
    const isNoBattery = model.includes('AirPods');
    
    return (
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Покупка</h2>
        {!isPro && (
          <div className="card" style={{ backgroundColor: 'rgba(255,149,0,0.1)', border: '1px solid var(--warning)', marginBottom: 16 }}>
            <div style={{ fontWeight: 'bold', color: 'var(--warning)', marginBottom: 8 }}>👑 Требуется PRO</div>
            <div style={{ fontSize: 14 }}>Добавление новых устройств доступно только по подписке. Оформите PRO, чтобы продолжить.</div>
            <button className="btn-primary" onClick={() => setShowSubModal(true)} style={{ marginTop: 12, backgroundColor: 'var(--warning)' }}>Купить PRO</button>
          </div>
        )}
        <div className="card" style={{ opacity: isPro ? 1 : 0.5, pointerEvents: isPro ? 'auto' : 'none' }}>
          <h3 style={{ fontSize: 16, marginTop: 0 }}>Добавить устройство</h3>
          <form onSubmit={addDeal}>
            
            <div className="input-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
              <div 
                onClick={() => { setPickerMode('purchase'); setShowModelPicker(true); haptic(); }} 
                style={{ flex: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}
              >
                <span style={{ color: model ? 'var(--text-main)' : 'var(--text-muted)' }}>{model || 'Выберите модель устройства...'}</span>
                <span style={{ opacity: 0.5 }}>▼</span>
              </div>
              {model && (
                <button type="button" onClick={() => { setModel(''); haptic(); }} style={{ background: 'none', border: 'none', color: '#888', fontSize: 20, padding: '10px 16px', cursor: 'pointer', borderLeft: '1px solid var(--border)' }}>✕</button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <input className="input-field" type="text" inputMode="numeric" placeholder="Цена закупа (₽) за 1 шт" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value.replace(/[^\d]/g, ''))} />
              </div>
              <div style={{ width: 100 }}>
                <input className="input-field" type="text" inputMode="numeric" placeholder="Кол-во" value={dealQuantity} onChange={(e) => setDealQuantity(e.target.value.replace(/[^\d]/g, ''))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {!isNoStorage && (
                <select className="input-field" value={storage} onChange={(e) => setStorage(e.target.value)}>
                  <option value="">Память</option>
                  <option value="64">64 GB</option><option value="128">128 GB</option><option value="256">256 GB</option>
                  <option value="512">512 GB</option><option value="1024">1 TB</option><option value="2048">2 TB</option>
                </select>
              )}
              {!isNoBattery && (
                <input className="input-field" type="text" inputMode="numeric" placeholder="АКБ (%)" value={battery} onChange={(e) => { let val = Number(e.target.value.replace(/[^\d]/g, '')); if (val > 100) val = 100; setBattery(val || ''); }} />
              )}
            </div>

            <input className="input-field" type="text" placeholder="Место хранения" value={dealLocation} onChange={(e) => setDealLocation(e.target.value)} />

            <textarea className="input-field" placeholder="Описание (состояние, комплект, дефекты...)" value={dealDescription} onChange={(e) => setDealDescription(e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input className="input-field" type="text" placeholder="IMEI (необязательно)" value={imei} onChange={(e) => setImei(e.target.value)} style={{ marginBottom: 10, paddingRight: 35 }} />
                {imei && <button type="button" onClick={() => { setImei(''); haptic(); }} style={{ position: 'absolute', right: 10, top: 14, background: 'none', border: 'none', fontSize: 18, color: '#888', cursor: 'pointer' }}>✕</button>}
              </div>
             <button 
  type="button" 
  onClick={() => handleOpenScanner('purchase')} 
  className="scanner-btn"
>
  📷
</button>
            </div>

            <select className="input-field" value={sellerId} onChange={(e) => setSellerId(e.target.value)}>
              <option value="">Кто продал? (Необязательно)</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
            </select>

            <div style={{ marginBottom: 15, marginTop: 5 }}>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: 8 }}>Фото устройства (до 3 шт):</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {dealPhotos.map((url, idx) => (
                  <div key={idx} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid var(--border)' }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      onClick={() => {
                        const urlToRemove = dealPhotos[idx];
                        setDealPhotos(prev => prev.filter((_, i) => i !== idx));
                        deletePhotosFromStorage([urlToRemove]);
                      }} 
                      style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {dealPhotos.length < 3 && (
                  <label style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 24, cursor: 'pointer', backgroundColor: 'rgba(0,122,255,0.05)', boxShadow: '0 0 10px rgba(0,122,255,0.1)' }}>
                    {uploadingPhoto ? '...' : '+'}
                    <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
                  </label>
                )}
              </div>
              {photoLimitWarning && <div style={{ marginTop: 10, padding: 12, backgroundColor: 'rgba(255, 59, 48, 0.1)', color: 'var(--danger)', borderRadius: 12, fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>Максимум 3 фото</div>}
            </div>

            <div style={{ marginTop: 10, marginBottom: 5, fontSize: 13, fontWeight: 'bold', color: 'var(--text-muted)' }}>Расходы при покупке 📉</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select className="input-field" value={newDealExpCat} onChange={(e) => setNewDealExpCat(e.target.value)}>
                <option value="Ремонт">Ремонт</option><option value="Запчасти">Запчасти</option><option value="Такси/Доставка">Такси/Доставка</option><option value="Реклама/Авито">Реклама/Авито</option><option value="Бензин">Бензин</option><option value="Другое">Другое</option>
              </select>
              <input className="input-field" type="text" inputMode="numeric" placeholder="Сумма расхода" value={newDealExpAmount} onChange={(e) => setNewDealExpAmount(e.target.value.replace(/[^\d]/g, ''))} />
            </div>

            <button className="btn-primary" type="submit" disabled={isActionLoading}>{isActionLoading ? 'Сохранение...' : 'Сохранить на склад'}</button>
            {showSuccessMsg && <div style={{ marginTop: 10, padding: 12, backgroundColor: 'rgba(52, 199, 89, 0.15)', color: '#34c759', textAlign: 'center', borderRadius: 12, fontSize: 14, fontWeight: 'bold' }}>✅ Устройство сохранено!</div>}
          </form>
        </div>
      </div>
    )
  }

  // =============== СКЛАД — ПЛИТКИ КАТЕГОРИЙ ===============
  const renderStockCategories = () => {
    const totalItems = inStockDeals.reduce((s, d) => s + (d.quantity || 0), 0);

    if (totalItems === 0) {
      return (
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Склад</h2>
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 60, marginBottom: 15 }}>📦</div>
            <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-main)' }}>Склад пуст</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Добавьте устройство на вкладке «Покупка» или через кнопку внутри категорий.</p>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Склад</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {CATEGORIES.map(cat => {
            const items = inStockDeals.filter(d => d.category === cat.id);
            const totalQty = items.reduce((s, d) => s + (d.quantity || 0), 0);
            return (
              <div 
                key={cat.id} 
                onClick={() => { setSelectedCategory(cat.id); haptic(); }} 
                className="neon-tile" 
                style={{ 
                  borderColor: cat.color, 
                  background: 'var(--card-bg)', 
                  '--glow-color': `${cat.color}60` 
                }}
              >
                <div style={{ fontSize: 42, marginBottom: 8, filter: `drop-shadow(0 0 10px ${cat.color}80)` }}>{cat.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{cat.name}</div>
                <div style={{ fontSize: 13, color: totalQty > 0 ? cat.color : 'var(--text-muted)', fontWeight: 'bold' }}>{totalQty > 0 ? `${totalQty} шт.` : 'пусто'}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // =============== СКЛАД — ТОВАРЫ В КАТЕГОРИИ ===============
  const renderCategoryView = () => {
    const cat = CATEGORIES.find(c => c.id === selectedCategory);
    const items = filteredStock.filter(d => d.category === selectedCategory);
    const emptyCat = inStockDeals.filter(d => d.category === selectedCategory).length === 0;

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>{cat?.icon} {cat?.name}</h2>
          <button onClick={() => requirePro(() => { setAddForm({ model: '', description: '', buy_price: '', quantity: '1', location: '', is_accounted: true, imei: '' }); setAddFormPhotos([]); setShowAddModal(true); haptic('medium'); })} style={{ background: cat?.color, color: 'white', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', boxShadow: `0 2px 10px ${cat?.color}60` }}>+ Добавить {!isPro && '🔒'}</button>
        </div>

        {!emptyCat && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative' }}>
              <input className="input-field" type="text" placeholder="Поиск по модели или IMEI..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 35 }} />
              <span style={{ position: 'absolute', left: 12, top: 15, fontSize: 14, color: '#888' }}>🔍</span>
            </div>
          </div>
        )}

        {emptyCat ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 60, marginBottom: 15 }}>🛒</div>
            <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-main)' }}>В категории пусто</h3>
            <p style={{ fontSize: 14, marginTop: 8 }}>Нажмите «+ Добавить», чтобы добавить товар.</p>
          </div>
        ) : (
                              items.map((deal) => {
            const daysOnStock = getDaysOnStock(deal);
            const isDeadStock = daysOnStock >= 21;
            const isSwiped = swipedDealId === deal.id;

            return (
              <div key={deal.id} style={{ position: 'relative', marginBottom: 16, borderRadius: 18, overflow: 'hidden' }}>
                
                {/* ЗАДНИЙ ФОН ПРИ СВАЙПЕ */}
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 140, display: 'flex' }}>
                  <button 
                    onClick={() => { setSwipedDealId(null); deleteDeal(deal.id); }} 
                    style={{ flex: 1, border: 'none', backgroundColor: 'var(--danger)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 20 }}>🗑️</span> Удалить
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setSwipedDealId(null); 
                      setSellingDeal(deal); 
                      setSellPrice(''); 
                      setSellWarranty('0'); 
                      setSellQuantity('1'); 
                      setIsTradeIn(false);
                      setTradeInModel('');
                      setTradeInPrice('');
                    }} 
                    style={{ flex: 1, border: 'none', backgroundColor: 'var(--success)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: 20 }}>💰</span> Продать
                  </button>
                </div>

                {/* ПЕРЕДНЯЯ КАРТОЧКА */}
                <div 
                  className="card neon-card-blue" 
                  onClick={() => { if (isSwiped) setSwipedDealId(null); else { setViewingDeal(deal); haptic(); } }} 
                  onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                  onTouchMove={(e) => {
                    if (touchStartX === null) return;
                    const diff = touchStartX - e.touches[0].clientX;
                    if (diff > 45) setSwipedDealId(deal.id);
                    else if (diff < -45) setSwipedDealId(null);
                  }}
                  onTouchEnd={() => setTouchStartX(null)}
                  style={{ 
                    borderLeft: `4px solid ${isDeadStock ? 'var(--danger)' : cat?.color || 'var(--warning)'}`, 
                    cursor: 'pointer',
                    marginBottom: 0,
                    transform: isSwiped ? 'translateX(-140px)' : 'translateX(0)',
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    backgroundColor: 'var(--card-bg)',
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: isSwiped ? '-5px 0 15px rgba(0,0,0,0.25)' : undefined
                  }}
                >
                  <div className="card-header">
                    <div style={{ fontWeight: 700, fontSize: 17 }}>
                      {deal.model || 'Без названия'}
                      {isDeadStock && <span style={{ marginLeft: 8, fontSize: 16 }} title="Залежавшийся товар!">⚠️</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="icon-btn" onClick={(e) => { 
                        e.stopPropagation(); 
                        setEditingDeal(deal); 
                        setEditModel(deal.model || ''); 
                        setEditBuyPrice(deal.buy_price || ''); 
                        setEditLocation(deal.location || ''); 
                        setEditDescription(deal.description || ''); 
                        setEditImei(deal.imei || '');
                        setEditSellerId(deal.seller_id || '');
                        setEditPhotos(deal.photos || []);
                        haptic(); 
                      }}>✏️</button>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteDeal(deal.id); }}>🗑️</button>
                    </div>
                  </div>
                  
                  {renderSpecs(deal)}

                  {deal.photos && deal.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
                      {deal.photos.map((url, idx) => (
                        <img 
                          key={idx} 
                          src={url} 
                          onClick={(e) => { e.stopPropagation(); setViewingPhoto(url); haptic(); }} 
                          style={{ height: 60, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)', cursor: 'pointer' }} 
                        />
                      ))}
                    </div>
                  )}

                  {deal.description && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                      📝 {deal.description}
                    </div>
                  )}
                  {deal.seller && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      👤 Продавец: {deal.seller.name}
                    </div>
                  )}

                  <div style={{ fontSize: 15, color: 'var(--text-main)', fontWeight: 500, marginTop: 10, marginBottom: 14 }}>
                    Закуп: {formatMoney(deal.buy_price)}/шт{' '}
                    {getDealExpensesSum(deal) > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                        + Расходы: {formatMoney(getDealExpensesSum(deal))}
                      </span>
                    )}
                  </div>

                  {/* ВЕРНУЛИ ОБЕ КНОПКИ КАК БЫЛО */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      className="btn-cancel" 
                      style={{ padding: '12px' }} 
                      onClick={(e) => { e.stopPropagation(); setExpenseDeal(deal); setExpenseAmount(''); }}
                    >
                      + Расход
                    </button>
                    <button 
                      className="btn-success" 
                      style={{ flex: 1, padding: '12px' }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSellingDeal(deal); 
                        setSellPrice(''); 
                        setSellWarranty('0'); 
                        setSellQuantity('1');
                        setIsTradeIn(false);
                        setTradeInModel('');
                        setTradeInPrice('');
                      }}
                    >
                      Продать
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div style={{ marginTop: 20, marginBottom: 40 }}>
          <button onClick={() => { setSelectedCategory(null); setSearchQuery(''); setFilterModels([]); haptic(); }} style={{ width: '100%', padding: '16px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-main)', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            ← Вернуться на склад
          </button>
        </div>
      </div>
    );
  };

  // =============== СДЕЛКИ ===============
  const renderDeals = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Сделки</h2>

      {soldDeals.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 60, marginBottom: 15 }}>📭</div>
          <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-main)' }}>Сделок пока нет</h3>
          <p style={{ fontSize: 14, marginTop: 8 }}>Продайте первое устройство, чтобы увидеть здесь историю.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input className="input-field" type="text" placeholder="Поиск по IME..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ marginBottom: 0, paddingLeft: 35 }} />
                <span style={{ position: 'absolute', left: 12, top: 15, fontSize: 14, color: '#888' }}>🔍</span>
              </div>
              <button className="input-field" style={{ flex: 1, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '14px 16px' }} onClick={() => { setPickerMode('deals'); setShowModelPicker(true); haptic(); }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: filterModels.length > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>{filterModels.length > 0 ? `Выбрано: ${filterModels.length}` : 'Все модели'}</span>
                <span style={{ opacity: 0.5 }}>▼</span>
              </button>
            </div>
          </div>
          {filteredSold.map((deal) => {
            const initQty = (deal.quantity || 0) + (deal.sold_quantity || 0);
            const perUnitExp = initQty > 0 ? getDealExpensesSum(deal) / initQty : 0;
            const margin = (deal.sold_quantity || 0) * ((Number(deal.sell_price) || 0) - Number(deal.buy_price) - perUnitExp);
            return (
              <div key={deal.id} className="card neon-glow-green" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="card-header">
                  <div style={{ fontWeight: 700, fontSize: 17 }}>{deal.model || 'Без названия'}</div>
                  <div>
                    <button className="icon-btn" onClick={() => { 
                      setEditingDeal(deal); 
                      setEditModel(deal.model || ''); 
                      setEditBuyPrice(deal.buy_price || ''); 
                      setEditLocation(deal.location || ''); 
                      setEditDescription(deal.description || ''); 
                      setEditImei(deal.imei || '');
                      setEditSellerId(deal.seller_id || '');
                      setEditPhotos(deal.photos || []);
                    }}>✏️</button>
                    <button className="icon-btn" onClick={() => deleteDeal(deal.id)}>🗑️</button>
                  </div>
                </div>
                {renderSpecs(deal)}
                
                {deal.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontStyle: 'italic' }}>📝 {deal.description}</div>}
                <div style={{ marginBottom: 10 }}>{getWarrantyBadge(deal)}</div>
                
                {deal.seller && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>👤 Купил у: {deal.seller.name}</div>}
                {deal.buyer && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>👤 Продал: {deal.buyer.name}</div>}

                <div style={{ fontSize: 15, color: 'var(--text-main)', fontWeight: 500, marginTop: 8 }}>
                  Закуп: {formatMoney(deal.buy_price)} | Продажа: {formatMoney(deal.sell_price)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Куплен: {new Date(deal.created_at || Date.now()).toLocaleDateString('ru-RU')} • Продан: {deal.sold_at ? new Date(deal.sold_at).toLocaleDateString('ru-RU') : '-'}
                </div>
                
                {deal.expenses && deal.expenses.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--danger)', marginTop: 6, backgroundColor: 'rgba(255, 59, 48, 0.05)', padding: '6px 8px', borderRadius: 6, textAlign: 'center', fontWeight: 'bold' }}>
                    {deal.expenses.map(e => `${e.category}: ${formatMoney(e.amount)}`).join(' • ')}
                  </div>
                )}
                
                <div style={{ fontWeight: 700, color: margin >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 16, marginTop: 10, fontVariantNumeric: 'tabular-nums', textAlign: 'center' }}>
                  Чистая прибыль: {formatMoney(margin)}
                </div>
              </div>
            )
          })}
        </>
      )}
    </div>
  )

  // =============== ДОП РАСХОДЫ ===============
    // =============== ДОП РАСХОДЫ ===============
  const renderFinance = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Доп. расходы</h2>
      
      {/* Две карточки со статистикой */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ flex: 1, margin: 0, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Потрачено за месяц</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums' }}>
            -{formatMoney(finStats.thisMonthTotal)}
          </div>
        </div>
        <div className="card" style={{ flex: 1, margin: 0, padding: 15, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Топ категория</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--warning)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 6 }}>
            {getCategoryIcon(finStats.topCategory[0])} {finStats.topCategory[0]}
          </div>
        </div>
      </div>

      {/* Форма добавления */}
      <div className="card" style={{ backgroundColor: isDarkTheme ? '#1c1c1e' : '#fff' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)' }}>Добавить расход</h3>
        <form onSubmit={addGeneralExpense}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input 
              className="input-field" 
              type="text" 
              inputMode="numeric" 
              placeholder="Сумма (₽)" 
              value={genExpAmount} 
              onChange={(e) => setGenExpAmount(e.target.value.replace(/[^\d]/g, ''))} 
              style={{ flex: 1, marginBottom: 0 }} 
            />
            <select 
              className="input-field" 
              value={genExpCategory} 
              onChange={(e) => setGenExpCategory(e.target.value)}
              style={{ flex: 1, marginBottom: 0, color: 'var(--text-main)', backgroundColor: 'var(--bg-color)', appearance: 'auto' }}
            >
              <option value="Авито">Авито</option>
              <option value="Реклама">Реклама</option>
              <option value="Аренда">Аренда</option>
              <option value="Такси">Такси</option>
              <option value="Бензин">Бензин</option>
              <option value="Еда">Еда</option>
              <option value="Свой вариант">Свой вариант</option>
            </select>
          </div>
          
          {genExpCategory === 'Свой вариант' && (
            <input className="input-field" type="text" placeholder="Название расхода" value={customGenExpCategory} onChange={(e) => setCustomGenExpCategory(e.target.value)} style={{ marginTop: 10 }} />
          )}
          
          <button className="btn-primary" type="submit" style={{ backgroundColor: 'var(--danger)', marginTop: 15, padding: '12px' }}>Добавить расход</button>
        </form>
      </div>

      {/* Лента расходов (как банковская выписка) */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 15, color: 'var(--text-muted)', paddingLeft: 5 }}>История расходов</h3>
        
        {generalExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', backgroundColor: 'var(--card-bg)', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🧾</div>
            <div>Расходов пока нет</div>
          </div>
        ) : (
          generalExpenses.map((exp, idx) => (
            <div key={exp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginBottom: 8, alignItems: 'center', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 59, 48, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {getCategoryIcon(exp.category)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{exp.category}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(exp.created_at || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)', fontVariantNumeric: 'tabular-nums', fontSize: 16 }}>
                  -{formatMoney(exp.amount)}
                </div>
                <button className="icon-btn" onClick={() => deleteExpense(exp.id)} style={{ opacity: 0.5, padding: 4 }}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )

  // =============== КОНТАКТЫ ===============
  const renderContacts = () => (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20, paddingLeft: 50 }}>Контакты</h2>
      <div className="card">
        <form onSubmit={addContact}>
          <input className="input-field" type="text" placeholder="Имя" value={contactName} onChange={(e) => setContactName(e.target.value)} />
          <input className="input-field" type="text" placeholder="Телефон" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          <input className="input-field" type="text" placeholder="Комментарий" value={contactNote} onChange={(e) => setContactNote(e.target.value)} />
          <button className="btn-primary" type="submit" disabled={isActionLoading}>{isActionLoading ? 'Сохранение...' : 'Сохранить'}</button>
        </form>
      </div>
      {contacts.map((c) => (
        <div key={c.id} className="card neon-card-purple" style={{ padding: 16 }}>
          <div className="card-header">
            <div style={{ fontWeight: 600, fontSize: 16 }}>{c.name || 'Без имени'}</div>
            <div>
              <button className="icon-btn" onClick={() => { setEditingContact(c); setEditContactName(c.name || ''); setEditContactPhone(c.phone || ''); setEditContactNote(c.note || ''); }}>✏️</button>
              <button className="icon-btn" onClick={() => deleteContact(c.id)}>🗑️</button>
            </div>
          </div>
          {c.phone && <button onClick={() => handlePhoneCall(c.phone)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>📞 {c.phone}</button>}
          {c.note && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>📝 {c.note}</div>}
          <div style={{ color: '#aaa', fontSize: 11, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 8 }}>Добавлен: {new Date(c.created_at || Date.now()).toLocaleDateString('ru-RU')}</div>
        </div>
      ))}
    </div>
  )

  // =============== НАСТРОЙКИ ===============
  const renderSettings = () => (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => { setActiveTab('home'); haptic(); }} style={{ background: 'none', border: 'none', fontSize: 24, padding: '0 10px 0 0', cursor: 'pointer', color: 'var(--accent)' }}>←</button>
        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Настройки</h2>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)', marginBottom: 15 }}>Профиль</h3>
        <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 8 }}>Имя профиля</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input-field" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ flex: 1, marginBottom: 0 }} placeholder="Введите имя..." />
          <button onClick={saveDisplayName} style={{ padding: '0 16px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold' }}>ОК</button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)', marginBottom: 15 }}>Приватность</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>Скрыть суммы</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Скрыть цифры на экране</div>
          </div>
          <button onClick={() => updateSetting('hide_amounts', !hideAmounts)} style={{ padding: '8px 16px', borderRadius: 20, background: hideAmounts ? '#34c759' : '#e5e5ea', color: hideAmounts ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{hideAmounts ? 'ВКЛ' : 'ВЫКЛ'}</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>Рейтинг перекупов</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Показывать мою прибыль</div>
          </div>
          <button onClick={() => updateSetting('show_in_leaderboard', !profileData?.show_in_leaderboard)} style={{ padding: '8px 16px', borderRadius: 20, background: profileData?.show_in_leaderboard ? '#34c759' : '#e5e5ea', color: profileData?.show_in_leaderboard ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{profileData?.show_in_leaderboard ? 'ВКЛ' : 'ВЫКЛ'}</button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)', marginBottom: 15 }}>Внешний вид</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}><div style={{ fontWeight: 'bold', fontSize: 15 }}>Тёмная тема</div></div>
          <button onClick={toggleTheme} style={{ padding: '8px 16px', borderRadius: 20, background: isDarkTheme ? '#34c759' : '#e5e5ea', color: isDarkTheme ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{isDarkTheme ? 'ВКЛ' : 'ВЫКЛ'}</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>Показывать график</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>График прибыли по месяцам</div>
          </div>
          <button onClick={() => updateSetting('show_chart', !showChart)} style={{ padding: '8px 16px', borderRadius: 20, background: showChart ? '#34c759' : '#e5e5ea', color: showChart ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{showChart ? 'ВКЛ' : 'ВЫКЛ'}</button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)', marginBottom: 15 }}>Подписка</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>PrimeTrade PRO</div>
            <div style={{ fontSize: 12, color: 'var(--success)' }}>
              {profileData?.is_admin ? 'Админ (бесплатно)' : profileData?.subscription_ends_at ? `Активна до ${new Date(profileData.subscription_ends_at).toLocaleDateString('ru-RU')}` : 'Не активна'}
            </div>
          </div>
          <button onClick={() => setShowSubModal(true)} style={{ padding: '8px 16px', borderRadius: 20, background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{profileData?.is_admin ? 'Админ' : 'Продлить'}</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1, paddingRight: 10, textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>Ежедневная сводка</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Уведомления о продажах</div>
          </div>
          <button onClick={() => updateSetting('daily_summary', !dailySummary)} style={{ padding: '8px 16px', borderRadius: 20, background: dailySummary ? '#34c759' : '#e5e5ea', color: dailySummary ? '#fff' : '#000', border: 'none', fontWeight: 'bold', minWidth: 65, flexShrink: 0 }}>{dailySummary ? 'ВКЛ' : 'ВЫКЛ'}</button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)' }}>Данные</h3>
          <button onClick={() => setShowBackupInfo(!showBackupInfo)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, cursor: 'pointer' }}>❓ Для чего это?</button>
        </div>
        {showBackupInfo && <div style={{ backgroundColor: 'var(--bg-color)', padding: 10, borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 15 }}>Резервная копия сохраняет все сделки, контакты и расходы в виде текста.</div>}
        <button onClick={handleBackup} className="btn-cancel" style={{ width: '100%', marginBottom: 10, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}>💾 Скачать резервную копию</button>
        <button onClick={() => { setShowRestoreModal(true); setRestoreJson(''); }} className="btn-cancel" style={{ width: '100%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border)' }}>📂 Восстановить из текста</button>
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 16, marginTop: 0, color: 'var(--text-muted)', marginBottom: 15 }}>Поддержка</h3>
        <div onClick={() => openExternalLink('https://telegra.ph/Polzovatelskoe-soglashenie-10-19-40')} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}><span>📄 Пользовательское соглашение</span><span style={{ color: '#888' }}>›</span></div>
        <div onClick={() => openExternalLink('https://telegra.ph/Politika-konfidencialnosti-10-19-87')} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}><span>🔒 Политика конфиденциальности</span><span style={{ color: '#888' }}>›</span></div>
        <div onClick={() => openExternalLink('https://t.me/primestore8')} style={{ padding: '12px 0', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}><span>💬 Служба поддержки</span><span style={{ color: 'var(--accent)' }}>@primestore8</span></div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 20, color: '#aaa', fontSize: 12 }}>PrimeTrade v1.5.3 • Сделано для перекупов</div>
    </div>
  )

  return (
    <div className="app-container">
      <style>
        {`
          @keyframes pulse-neon {
            0% { box-shadow: 0 0 5px var(--glow-color, rgba(0, 122, 255, 0.2)); }
            50% { box-shadow: 0 0 20px var(--glow-color, rgba(0, 122, 255, 0.4)); }
            100% { box-shadow: 0 0 5px var(--glow-color, rgba(0, 122, 255, 0.2)); }
          }
          .neon-card-blue { border: 1px solid rgba(0, 122, 255, 0.3); --glow-color: rgba(0, 122, 255, 0.3); animation: pulse-neon 3s infinite; }
          .neon-glow-green { border: 1px solid rgba(52, 199, 89, 0.3); --glow-color: rgba(52, 199, 89, 0.3); animation: pulse-neon 3s infinite; }
          .neon-glow-orange { border: 1px solid rgba(255, 149, 0, 0.4); --glow-color: rgba(255, 149, 0, 0.4); animation: pulse-neon 3s infinite; }
          .neon-card-purple { border: 1px solid rgba(175, 82, 222, 0.3); --glow-color: rgba(175, 82, 222, 0.3); animation: pulse-neon 3s infinite; }
          
          .neon-tile {
            border-radius: 18px;
            padding: 20px 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border-width: 2px;
            border-style: solid;
          }
          .neon-tile:hover { transform: scale(1.02); }
          .neon-tile:active { transform: scale(0.98); }
        `}
      </style>

      {activeTab !== 'settings' && activeTab !== 'calculator' && (
        <button className="hamburger-btn" onClick={() => { setIsMenuOpen(true); haptic(); }} style={{ position: 'absolute', top: 16, left: 16 }}>☰</button>
      )}

      {isInitialLoading ? renderSkeleton() : (
        <>
          {activeTab === 'home' && renderHome()}
          {activeTab === 'calculator' && renderCalculator()}
          {activeTab === 'purchase' && renderPurchase()}
          {activeTab === 'stock' && (selectedCategory ? renderCategoryView() : renderStockCategories())}
          {activeTab === 'deals' && renderDeals()}
          {activeTab === 'finance' && renderFinance()}
          {activeTab === 'contacts' && renderContacts()}
          {activeTab === 'settings' && renderSettings()}
        </>
      )}

      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`sidebar ${isMenuOpen ? 'open' : ''}`} style={{ overflow: 'hidden' }}>
        <div className="profile-section">
          <div className="profile-avatar" style={{ overflow: 'hidden', padding: 0 }}>{user?.photo_url ? <img src={user.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.first_name ? user.first_name[0].toUpperCase() : 'U')}</div>
          <div><div className="profile-name">{displayName || 'Пользователь'}</div><div className="profile-status">{user?.username ? `@${user.username}` : 'PrimeTrade Pro'}</div></div>
        </div>

        <div className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 10, overflowY: 'auto' }}>
          <button onClick={() => { setShowSubModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #ff9500, #ff3b30)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 15px rgba(255,149,0,0.4)' }}>⭐ Моя подписка</button>
          
          <button onClick={() => { setActiveTab('calculator'); setIsMenuOpen(false); haptic(); }} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(36, 129, 204, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 10px rgba(0,122,255,0.2)' }}>🧮 Калькулятор</button>

          <button onClick={() => { openExternalLink("https://t.me/+MrG7RADQfbFmMTEy"); setIsMenuOpen(false); haptic(); }} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 0 10px rgba(52,199,89,0.2)' }}>🤝 Закрытый чат</button>
          
          {profileData?.show_in_leaderboard && <button onClick={() => { setShowLeaderboardModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🏆 Рейтинг перекупов</button>}
          <button onClick={() => { setShowGuideModal(true); setIsMenuOpen(false); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>📚 Как пользоваться</button>
          <button onClick={() => { const refLink = `https://t.me/Primetrade8_bot?start=ref_${user?.id || ''}`; window.open(`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Попробуй PrimeTrade!')}`, '_blank'); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🎁 Пригласи друга</button>
          <button onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); haptic(); }} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>⚙️ Настройки</button>
          <button onClick={() => { openExternalLink(MY_CHANNEL_URL); haptic('medium'); }} style={{ width: '100%', padding: '16px', backgroundColor: 'rgba(36, 129, 204, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>🛍 Проверенная техника</button>
        </div>
      </div>

            <BudgetModal 
        isOpen={showBudgetModal}
        tempBudget={tempBudget}
        setTempBudget={setTempBudget}
        onClose={() => setShowBudgetModal(false)}
        onSave={saveBudget}
      />

            <DebtModal 
        isOpen={showDebtModal}
        contacts={contacts}
        debtContactId={debtContactId}
        setDebtContactId={setDebtContactId}
        debtAmount={debtAmount}
        setDebtAmount={setDebtAmount}
        debtType={debtType}
        setDebtType={setDebtType}
        onClose={() => setShowDebtModal(false)}
        onSave={saveDebt}
      />

            <AddDealModal
        showAddModal={showAddModal}
        selectedCategory={selectedCategory}
        DEVICE_CATALOG={DEVICE_CATALOG}
        addForm={addForm}
        setAddForm={setAddForm}
        setPickerMode={setPickerMode}
        setModelCategory={setModelCategory}
        setShowModelPicker={setShowModelPicker}
        addFormPhotos={addFormPhotos}
        setAddFormPhotos={setAddFormPhotos}
        uploadingAddPhoto={uploadingAddPhoto}
        handleAddModalPhotoUpload={handleAddModalPhotoUpload}
        deletePhotosFromStorage={deletePhotosFromStorage}
        onClose={() => setShowAddModal(false)}
        onSave={addManualProduct}
        isActionLoading={isActionLoading}
        haptic={haptic}
      />
            <ModelPickerModal
        showModelPicker={showModelPicker}
        pickerMode={pickerMode}
        setShowModelPicker={setShowModelPicker}
        modelSearch={modelSearch}
        setModelSearch={setModelSearch}
        modelCategory={modelCategory}
        setModelCategory={setModelCategory}
        DEVICE_CATALOG={DEVICE_CATALOG}
        filterModels={filterModels}
        handleModelSelect={handleModelSelect}
      />  
                 <SellModal 
        sellingDeal={sellingDeal}
        sellPrice={sellPrice}
        setSellPrice={setSellPrice}
        sellQuantity={sellQuantity}
        setSellQuantity={setSellQuantity}
        buyerId={buyerId}
        setBuyerId={setBuyerId}
        sellWarranty={sellWarranty}
        setSellWarranty={setSellWarranty}
        isTradeIn={isTradeIn}
        setIsTradeIn={setIsTradeIn}
        tradeInModel={tradeInModel}
        setTradeInModel={setTradeInModel}
        tradeInPrice={tradeInPrice}
        setTradeInPrice={setTradeInPrice}
        contacts={contacts}
        onClose={() => { setSellingDeal(null); setIsTradeIn(false); setTradeInModel(''); setTradeInPrice(''); }}
        onConfirm={confirmSell}
        isActionLoading={isActionLoading}
        formatMoney={formatMoney}
        haptic={haptic}
      />
      {showLeaderboardModal && (
        <div className="modal-overlay"><div className="modal-content"><h3>🏆 Топ перекупов</h3>{leaderboard.map((lb, idx) => (<div key={lb.user_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}><div style={{ display: 'flex', gap: 10 }}><span style={{ fontSize: 18 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}</span><span style={{ fontWeight: 600 }}>{lb.user_name} {lb.user_id === user?.id ? '(Вы)' : ''}</span></div><span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{formatMoney(lb.gross_profit)}</span></div>))}<div className="modal-actions"><button className="btn-cancel" onClick={() => setShowLeaderboardModal(false)}>Закрыть</button></div></div></div>
      )}

      {showSubModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ padding: 0, overflowY: 'auto', borderRadius: 24, boxShadow: '0 0 30px rgba(36,129,204,0.4)', maxHeight: '90vh' }}>
            <div style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', padding: '30px 20px', textAlign: 'center', color: 'white', position: 'relative' }}>
              <button onClick={() => setShowSubModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👑</div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold' }}>PrimeTrade PRO</h2>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: 14 }}>
                {profileData?.is_admin ? 'У вас статус Админа' : profileData?.subscription_ends_at ? `Активна до ${new Date(profileData.subscription_ends_at).toLocaleDateString('ru-RU')}` : 'Оформите подписку для доступа ко всем функциям'}
              </p>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {['1', '6', '12'].map(p => {
                  const prices = { '1': { price: '390', per: '390' }, '6': { price: '1990', per: '332' }, '12': { price: '3590', per: '299' } };
                  return (
                    <div key={p} onClick={() => { setSelectedPlan(p); haptic(); }} style={{ border: `2px solid ${selectedPlan === p ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 16, padding: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: selectedPlan === p ? 'rgba(36, 129, 204, 0.05)' : 'var(--bg-color)', position: 'relative', boxShadow: selectedPlan === p ? '0 0 15px rgba(36,129,204,0.2)' : 'none' }}>
                      {p === '12' && <div style={{ position: 'absolute', top: -10, right: 15, backgroundColor: '#ff9500', color: 'white', fontSize: 10, fontWeight: 'bold', padding: '2px 8px', borderRadius: 10 }}>ВЫГОДНО</div>}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{p} мес.</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{prices[p].price} ₽ ({prices[p].per} ₽/мес)</div>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${selectedPlan === p ? 'var(--accent)' : '#ccc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedPlan === p && <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--accent)' }}></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: 'var(--text-muted)' }}>Способ оплаты:</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <div 
                  onClick={() => { setSelectedPaymentMethod(2); haptic(); }} 
                  style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedPaymentMethod === 2 ? 'var(--accent)' : 'var(--border)'}`, textAlign: 'center', cursor: 'pointer', backgroundColor: selectedPaymentMethod === 2 ? 'rgba(36, 129, 204, 0.1)' : 'var(--bg-color)' }}
                >
                  <div style={{ fontSize: 24 }}>💳</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 4 }}>СБП</div>
                </div>
                <div 
                  onClick={() => { setSelectedPaymentMethod(13); haptic(); }} 
                  style={{ flex: 1, padding: 12, borderRadius: 12, border: `2px solid ${selectedPaymentMethod === 13 ? '#f7931a' : 'var(--border)'}`, textAlign: 'center', cursor: 'pointer', backgroundColor: selectedPaymentMethod === 13 ? 'rgba(247, 147, 26, 0.1)' : 'var(--bg-color)' }}
                >
                  <div style={{ fontSize: 24 }}>₿</div>
                  <div style={{ fontSize: 13, fontWeight: 'bold', marginTop: 4 }}>Крипта</div>
                </div>
              </div>
              <button className="btn-primary" disabled={isProcessingPayment} onClick={async () => {
                haptic('heavy'); setIsProcessingPayment(true);
                try {
                  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                  const response = await fetch(`${supabaseUrl}/functions/v1/create-platega-subscription`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseKey}`, 'apikey': supabaseKey }, body: JSON.stringify({ telegram_id: user?.id, plan_id: selectedPlan, payment_method: selectedPaymentMethod }) });
                  if (!response.ok) { const t = await response.text(); throw new Error(`HTTP ${response.status}: ${t}`); }
                  const data = await response.json();
                  if (data?.redirect) {
                    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(data.redirect);
                    else { const a = document.createElement('a'); a.href = data.redirect; a.target = '_blank'; a.click(); }
                  } else alert('Сервер не вернул ссылку');
                } catch (err) { alert('Ошибка: ' + err.message); } finally { setIsProcessingPayment(false); }
              }} style={{ padding: '16px', fontSize: 16, opacity: isProcessingPayment ? 0.7 : 1 }}>
                {isProcessingPayment ? 'Создание...' : (selectedPaymentMethod === 13 ? 'Оплатить криптовалютой' : 'Оплатить через СБП')}
              </button>
              <button className="btn-cancel" onClick={() => setShowSubModal(false)} style={{ width: '100%', marginTop: 10 }}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {showGuideModal && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content" style={{ maxHeight: '92vh', overflowY: 'auto', padding: 0 }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ background: 'linear-gradient(135deg, #2481cc, #1a5c94)', padding: '24px 20px 20px', position: 'sticky', top: 0, zIndex: 10, color: 'white', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 44, marginBottom: 6 }}>📚</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 'bold' }}>Полный гайд</h2>
              <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: 13 }}>Всё, что нужно знать за 2 минуты</p>
              <button onClick={() => setShowGuideModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              {[
                { icon: '📊', title: 'Главная', color: '#0ABAB5', items: ['Бюджет и свободные средства', 'Реализованная прибыль чистыми', 'Долги и задатки (кто кому)', 'Топ моделей по марже', 'График прибыли по месяцам'] },
                { icon: '🛒', title: 'Покупка', color: '#34c759', items: ['Выбери модель устройства', 'Укажи цену закупа и количество', 'Заполни АКБ, память, IMEI', 'Загрузи до 3 фото устройства', 'Отметь расходы (ремонт, такси)'] },
                { icon: '📦', title: 'Склад', color: '#007aff', items: ['6 категорий: iPhone, AirPods, iPad, Apple Watch, MacBook, Аксессуары', 'Продавай по частям (1 из 5 AirPods)', 'Товары старше 21 дня подсвечиваются ⚠️', 'Добавляй партии товара одним кликом'] },
                { icon: '💰', title: 'Сделки', color: '#ff9500', items: ['История всех проданных устройств', 'Автоматический расчёт чистой прибыли', 'Учёт всех расходов по сделке', 'Экспорт в Excel одной кнопкой'] },
                { icon: '🧮', title: 'Калькулятор', color: '#af52de', items: ['Рассчитай маржу ДО покупки', 'Учёт комиссии Авито Доставки', 'Твоя история средних цен', 'Подсказка: хватает ли бюджета'] },
                { icon: '💵', title: 'Доп. расходы', color: '#ff3b30', items: ['Реклама, аренда, бензин, еда', 'Всё, что не привязано к товару', 'Статистика: сколько уходит в месяц', 'Топ категория твоих трат'] },
                { icon: '👥', title: 'Контакты', color: '#5ac8fa', items: ['База поставщиков и покупателей', 'Быстрый звонок одним касанием', 'Заметки о человеке', 'Привязка контактов к сделкам'] },
                { icon: '⚙️', title: 'Настройки', color: '#8e8e93', items: ['Скрыть суммы (работа в кафе)', 'Тёмная и светлая тема', 'Ежедневная сводка в бот', 'Резервная копия данных (бэкап)', 'Рейтинг перекупов'] },
                { icon: '💎', title: 'PRO подписка', color: '#ff9500', items: ['Первые 7 дней — бесплатно', '390₽/мес или 3590₽/год', 'Снимает все ограничения', 'Даёт доступ к закрытому чату'] },
                { icon: '🤝', title: 'Закрытый чат', color: '#34c759', items: ['Клуб перекупов и владельцев бизнеса', 'Только для PRO-подписчиков', 'Кнопка в боковом меню', 'Доступ по одноразовой ссылке'] },
              ].map((s, i) => (
                <div key={i} style={{ marginBottom: 14, padding: 14, backgroundColor: 'var(--bg-color)', borderRadius: 14, borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 26 }}>{s.icon}</span>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>{s.title}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 22, fontSize: 13, lineHeight: 1.7, color: 'var(--text-muted)' }}>
                    {s.items.map((it, j) => <li key={j} style={{ marginBottom: 2 }}>{it}</li>)}
                  </ul>
                </div>
              ))}

              <div style={{ padding: 14, backgroundColor: 'rgba(255, 149, 0, 0.1)', borderRadius: 14, border: '1px solid var(--warning)', marginBottom: 18 }}>
                <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4, color: 'var(--warning)' }}>💡 Совет от разработчика</div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5 }}>Делай резервную копию раз в неделю в «Настройках». Это занимает 10 секунд, но спасёт все данные при смене телефона или случайном удалении приложения.</div>
              </div>

              <button className="btn-primary" style={{ width: '100%', padding: 16, fontSize: 16, boxShadow: '0 4px 15px rgba(36, 129, 204, 0.4)' }} onClick={() => { setShowGuideModal(false); haptic('success'); }}>
                Понятно, поехали! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

            <ExpenseModal 
        expenseDeal={expenseDeal}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        expenseCategory={expenseCategory}
        setExpenseCategory={setExpenseCategory}
        onClose={() => setExpenseDeal(null)}
        onConfirm={confirmExpense}
        isActionLoading={isActionLoading}
      />

            <EditDealModal
        editingDeal={editingDeal}
        editModel={editModel} setEditModel={setEditModel}
        editBuyPrice={editBuyPrice} setEditBuyPrice={setEditBuyPrice}
        editImei={editImei} setEditImei={setEditImei}
        editSellerId={editSellerId} setEditSellerId={setEditSellerId}
        editLocation={editLocation} setEditLocation={setEditLocation}
        editDescription={editDescription} setEditDescription={setEditDescription}
        editPhotos={editPhotos} setEditPhotos={setEditPhotos}
        uploadingEditPhoto={uploadingEditPhoto}
        handleEditPhotoUpload={handleEditPhotoUpload}
        deletePhotosFromStorage={deletePhotosFromStorage}
        contacts={contacts}
        onClose={() => setEditingDeal(null)}
        onSave={saveEdit}
        isActionLoading={isActionLoading}
        handleOpenScanner={handleOpenScanner}
      />

      {editingContact && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Редактировать контакт</h3>
            <input className="input-field" type="text" value={editContactName} onChange={(e) => setEditContactName(e.target.value)} />
            <input className="input-field" type="text" value={editContactPhone} onChange={(e) => setEditContactPhone(e.target.value)} />
            <input className="input-field" type="text" value={editContactNote} onChange={(e) => setEditContactNote(e.target.value)} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditingContact(null)}>Отмена</button>
              <button className="btn-confirm" onClick={saveEditContact} disabled={isActionLoading}>{isActionLoading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Экспорт</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Скачайте CSV — откроется в Excel.</p>
            <textarea value={csvData} readOnly style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 10, fontFamily: 'monospace', marginBottom: 15, boxSizing: 'border-box' }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowExportModal(false)}>Закрыть</button>
              <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={downloadCsv}>📥 Скачать файл</button>
            </div>
          </div>
        </div>
      )}

            {showScanner && (
        <Scanner 
          key={Date.now()} 
          onScan={(text) => { 
            const cleanText = text.replace(/\D/g, '');
            if (scannerMode === 'edit') { 
              setEditImei(cleanText); 
            } else { 
              setImei(cleanText); 
              checkImeiAuto(cleanText);
            }
            setShowScanner(false); 
          }} 
          onClose={() => setShowScanner(false)} 
        />
      )}

      {viewingDeal && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="modal-content" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card-bg)' }}>
              <h3 style={{ margin: 0, fontSize: 20 }}>{viewingDeal.model}</h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="icon-btn" onClick={() => { 
                  setViewingDeal(null); 
                  setEditingDeal(viewingDeal); 
                  setEditModel(viewingDeal.model || ''); 
                  setEditBuyPrice(viewingDeal.buy_price || ''); 
                  setEditLocation(viewingDeal.location || ''); 
                  setEditDescription(viewingDeal.description || ''); 
                  setEditImei(viewingDeal.imei || '');
                  setEditSellerId(viewingDeal.seller_id || '');
                  setEditPhotos(viewingDeal.photos || []);
                }}>✏️</button>
                <button className="icon-btn" onClick={() => { setViewingDeal(null); deleteDeal(viewingDeal.id); }}>🗑️</button>
                <button className="icon-btn" onClick={() => setViewingDeal(null)} style={{ fontSize: 24 }}>✕</button>
              </div>
            </div>

            <div style={{ padding: 20, overflowY: 'auto' }}>
              {viewingDeal.photos && viewingDeal.photos.length > 0 ? (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20 }}>
                  {viewingDeal.photos.map((url, idx) => <img key={idx} src={url} onClick={() => { setViewingPhoto(url); haptic(); }} style={{ height: 200, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }} />)}
                </div>
              ) : <div style={{ height: 100, backgroundColor: 'var(--bg-color)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: 20 }}>Нет фотографий</div>}

              <div className="card" style={{ padding: 15, marginBottom: 15 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: 'var(--text-muted)' }}>Характеристики</h4>
                {renderSpecs(viewingDeal)}
                {viewingDeal.description && <div style={{ fontSize: 14, color: 'var(--text-main)', marginTop: 10, whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-color)', padding: 10, borderRadius: 8 }}>📝 {viewingDeal.description}</div>}
                <div className="stat-row" style={{ marginTop: 10 }}><span>Дата закупа:</span><span>{new Date(viewingDeal.created_at || Date.now()).toLocaleDateString('ru-RU')}</span></div>
                {viewingDeal.seller && <div className="stat-row"><span>Продавец:</span><span>{viewingDeal.seller.name}</span></div>}
              </div>

              <div className="card" style={{ padding: 15, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: 'var(--text-muted)' }}>Финансы</h4>
                <div className="stat-row"><span>Цена закупа:</span><span>{formatMoney(viewingDeal.buy_price)}/шт</span></div>
                <div className="stat-row"><span>В наличии:</span><span>{viewingDeal.quantity} шт.</span></div>
                {viewingDeal.sold_quantity > 0 && <div className="stat-row"><span>Продано:</span><span>{viewingDeal.sold_quantity} шт. по {formatMoney(viewingDeal.sell_price)}</span></div>}
                {viewingDeal.expenses && viewingDeal.expenses.length > 0 && (
                  <div style={{ marginTop: 10, padding: 10, backgroundColor: 'rgba(255, 59, 48, 0.05)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 'bold', marginBottom: 5 }}>Доп. расходы:</div>
                    {viewingDeal.expenses.map(e => <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--danger)', marginBottom: 3 }}><span>{e.category}</span><span>{formatMoney(e.amount)}</span><button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>✕</button></div>)}
                  </div>
                )}
                <div className="stat-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', fontWeight: 'bold', fontSize: 16 }}>
                  <span>Итого вложено:</span><span>{formatMoney((viewingDeal.quantity || 0) * Number(viewingDeal.buy_price) + getDealExpensesSum(viewingDeal))}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button className="btn-primary" style={{ flex: 1, padding: '16px', backgroundColor: 'var(--accent)' }} onClick={() => { setAdText(generateAdText(viewingDeal)); setShowAdModal(true); }}>📢 Пост в чат</button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-cancel" style={{ flex: 1, padding: '16px', backgroundColor: '#fff3cd', color: '#b28900' }} onClick={() => { setViewingDeal(null); setExpenseDeal(viewingDeal); setExpenseAmount(''); }}>+ Расход</button>
                <button className="btn-success" style={{ flex: 1, padding: '16px' }} onClick={() => { setViewingDeal(null); setSellingDeal(viewingDeal); setSellPrice(''); setSellWarranty('0'); setSellQuantity('1'); }}>Продать</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdModal && (
        <div className="modal-overlay" style={{ zIndex: 5000 }}>
          <div className="modal-content">
            <h3>Объявление для чата</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Скопируйте текст и отправьте в клуб перекупов.</p>
            <textarea value={adText} readOnly style={{ width: '100%', minHeight: 180, padding: 10, borderRadius: 12, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', marginBottom: 15, boxSizing: 'border-box' }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAdModal(false)}>Закрыть</button>
              <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={() => {
                navigator.clipboard.writeText(adText).then(() => {
                  alert('✅ Текст скопирован! Вставьте его в чат.');
                  setShowAdModal(false);
                });
              }}>Копировать</button>
            </div>
          </div>
        </div>
      )}

      {viewingPhoto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewingPhoto(null)}>
          <button style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: 'white', fontSize: 20 }}>✕</button>
          <img src={viewingPhoto} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {showBackupModal && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Резервная копия</h3>
            <textarea value={backupJson} readOnly onClick={(e) => e.target.select()} style={{ flex: 1, minHeight: 150, padding: 10, borderRadius: 12, border: '1px solid #ccc', fontSize: 10, fontFamily: 'monospace', marginBottom: 15 }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowBackupModal(false)}>Закрыть</button>
              <button className="btn-confirm" style={{ backgroundColor: 'var(--success)' }} onClick={() => { navigator.clipboard.writeText(backupJson).then(() => { alert('✅ Скопировано!'); setShowBackupModal(false); }).catch(() => { const t = document.createElement("textarea"); t.value = backupJson; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); alert('✅ Скопировано!'); setShowBackupModal(false); }); }}>Копировать</button>
            </div>
          </div>
        </div>
      )}

      {showRestoreModal && (
        <div className="modal-overlay" style={{ zIndex: 4000 }}>
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>Восстановление</h3>
            <textarea value={restoreJson} onChange={(e) => setRestoreJson(e.target.value)} placeholder="Вставьте текст..." style={{ flex: 1, minHeight: 150, padding: 10, borderRadius: 12, border: '1px solid #ccc', fontSize: 10, fontFamily: 'monospace', marginBottom: 15 }} />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRestoreModal(false)}>Отмена</button>
              <button className="btn-confirm" style={{ backgroundColor: 'var(--danger)' }} onClick={() => processRestore(restoreJson)} disabled={isActionLoading}>{isActionLoading ? 'Восстановление...' : 'Восстановить'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => { setActiveTab('home'); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'home' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>📊</span> Главная</button>
        <button className={`tab-button ${activeTab === 'purchase' ? 'active' : ''}`} onClick={() => { setActiveTab('purchase'); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'purchase' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>🛒</span> Покупка</button>
        <button className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => { setActiveTab('stock'); setSelectedCategory(null); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'stock' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>📦</span> Склад</button>
        <button className={`tab-button ${activeTab === 'deals' ? 'active' : ''}`} onClick={() => { setActiveTab('deals'); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'deals' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>💰</span> Сделки</button>
        <button className={`tab-button ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => { setActiveTab('finance'); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'finance' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>💵</span> Доп.расх.</button>
        <button className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => { setActiveTab('contacts'); haptic(); }}><span className="tab-icon" style={{ filter: activeTab === 'contacts' ? 'drop-shadow(0 0 5px var(--accent))' : 'none' }}>👥</span> Контакты</button>
      </div>
    </div>
  )
}

export default App