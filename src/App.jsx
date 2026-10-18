import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [deals, setDeals] = useState([])
  const [model, setModel] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [loading, setLoading] = useState(false)

  // Получаем данные из Telegram и загружаем сделки при старте
  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      setUser(tg.initDataUnsafe?.user || null)
    }
    fetchDeals()
  }, [])

  // Функция загрузки сделок из базы
  const fetchDeals = async () => {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setDeals(data)
  }

  // Функция добавления новой сделки
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
      fetchDeals() // обновляем список
    } else {
      alert('Ошибка при добавлении: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2 style={{ marginTop: 0 }}>iTrade Учёт</h2>
      {user && <p style={{ fontSize: 14, color: '#666', marginTop: -10 }}>Привет, {user.first_name}!</p>}

      {/* Форма добавления */}
      <div style={{ backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Добавить устройство</h3>
        <form onSubmit={addDeal} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input 
            type="text" 
            placeholder="Модель (например, iPhone 13 Pro)" 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            style={{ padding: 10, borderRadius: 5, border: '1px solid #ccc' }}
          />
          <input 
            type="number" 
            placeholder="Цена закупа (₽)" 
            value={buyPrice} 
            onChange={(e) => setBuyPrice(e.target.value)}
            style={{ padding: 10, borderRadius: 5, border: '1px solid #ccc' }}
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ padding: 10, backgroundColor: '#2481cc', color: 'white', border: 'none', borderRadius: 5, fontWeight: 'bold' }}
          >
            {loading ? 'Сохранение...' : 'Добавить в базу'}
          </button>
        </form>
      </div>

      {/* Список сделок */}
      <h3 style={{ fontSize: 16 }}>Склад (В наличии)</h3>
      {deals.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14 }}>Пока нет добавленных устройств.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {deals.map((deal) => (
            <div key={deal.id} style={{ backgroundColor: 'white', padding: 15, borderRadius: 10 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{deal.model}</div>
              <div style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                Закуп: {deal.buy_price} ₽ | Статус: {deal.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App