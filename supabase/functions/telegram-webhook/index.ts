// test

// supabase/functions/telegram-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!
    const APP_URL = "https://itrade-kappa.vercel.app/"
    const body = await req.json()

    // --- ОБРАБОТКА ТЕКСТОВЫХ КОМАНД (Например, /start) ---
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id
      const text = body.message.text.trim()

      if (text === "/start" || text === "/menu") {
        const welcomeText = 
          "👋 *Добро пожаловать в PrimeTrade!*\n\n" +
          "Ваш личный помощник для учета техники Apple и контроля прибыли.\n\n" +
          "Выберите действие ниже 👇"

        const mainMenuMarkup = {
          inline_keyboard: [
            [{ text: "👤 Мой профиль", web_app: { url: APP_URL } }],
            [{ text: "⭐ Моя подписка", callback_data: "show_tariffs" }],
            [{ text: "⚙️ Настройки", web_app: { url: APP_URL } }]
          ]
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: "Markdown",
            reply_markup: mainMenuMarkup,
          }),
        })
      }
    }

    // --- ОБРАБОТКА НАЖАТИЙ НА КНОПКИ (Callback Queries) ---
    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id
      const chatId = body.callback_query.message.chat.id
      const messageId = body.callback_query.message.message_id
      const data = body.callback_query.data

      // Обязательно отвечаем на callback, иначе на кнопке будет вечная загрузка
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      })

      // Если нажали на "Подписка"
      if (data === "show_tariffs") {
        const tariffsText = 
          "💎 *Выберите тариф PrimeTrade PRO:*\n\n" +
          "• 1 месяц — 390 ₽\n" +
          "• 6 месяцев — 1990 ₽\n" +
          "• 12 месяцев — 3590 ₽ (выгодно)\n\n" +
          "Нажмите на кнопку, чтобы открыть приложение и оформить подписку."

        const tariffsMarkup = {
          inline_keyboard: [
            [{ text: "📅 1 месяц — 390 ₽", web_app: { url: APP_URL } }],
            [{ text: "🔥 6 месяцев — 1990 ₽", web_app: { url: APP_URL } }],
            [{ text: "🏆 12 месяцев — 3590 ₽", web_app: { url: APP_URL } }],
            [{ text: "⬅️ Назад в меню", callback_data: "back_to_menu" }]
          ]
        }

        // Редактируем сообщение с приветствием на тарифы
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: tariffsText,
            parse_mode: "Markdown",
            reply_markup: tariffsMarkup,
          }),
        })
      }

      // Если нажали "Назад в меню"
      if (data === "back_to_menu") {
        const welcomeText = 
          "👋 *Добро пожаловать в PrimeTrade!*\n\n" +
          "Ваш личный помощник для учета техники Apple и контроля прибыли.\n\n" +
          "Выберите действие ниже 👇"

        const mainMenuMarkup = {
          inline_keyboard: [
            [{ text: "👤 Мой профиль", web_app: { url: APP_URL } }],
            [{ text: "⭐ Моя подписка", callback_data: "show_tariffs" }],
            [{ text: "⚙️ Настройки", web_app: { url: APP_URL } }]
          ]
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: welcomeText,
            parse_mode: "Markdown",
            reply_markup: mainMenuMarkup,
          }),
        })
      }
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})