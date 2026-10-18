import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand() 
      setUser(tg.initDataUnsafe?.user || null)
    }
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>iTrade Учёт</h1>
      {user ? (
        <div>
          <p>Привет, <strong>{user.first_name}</strong>!</p>
          <p style={{ color: '#888', fontSize: 14 }}>
            Telegram ID: {user.id}
            {user.username && ` · @${user.username}`}
          </p>
        </div>
      ) : (
        <p style={{ color: '#ff3b30' }}>Открой это приложение внутри Telegram 👇</p>
      )}
      <hr style={{ margin: '24px 0', border: '1px solid #eee' }} />
      <p>✅ Hello World работает</p>
    </div>
  )
}

export default App