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
            [{ text: "📚 Как пользоваться", callback_data: "show_guide" }],
            [{ text: "⭐ Моя подписка", callback_data: "show_tariffs" }],
            [{ text: "🚀 Открыть приложение", web_app: { url: APP_URL } }]
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

      // 1. Если нажали на "Как пользоваться"
      if (data === "show_guide") {
        const guideText = 
          "📚 *Инструкция по работе с PrimeTrade*\n\n" +
          "1️⃣ *Покупка*\n" +
          "Добавляйте устройства (iPhone, MacBook и т.д.), указывайте цену закупа, количество, АКБ и фото. Товар автоматически попадет на склад.\n\n" +
          "2️⃣ *Склад*\n" +
          "Все устройства разделены по категориям. Вы можете добавлять партии товаров (например, 10 чехлов) и продавать их по частям.\n\n" +
          "3️⃣ *Сделки*\n" +
          "Здесь хранится история проданных устройств. Приложение само считает чистую прибыль с учетом всех расходов (такси, ремонт и т.д.).\n\n" +
          "4️⃣ *Калькулятор*\n" +
          "Умный помощник для расчета маржи перед покупкой. Учитывает комиссию Авито и ваши предыдущие сделки.\n\n" +
          "5️⃣ *Доп. расходы*\n" +
          "Фиксируйте траты на рекламу, аренду или бензин, чтобы видеть чистый финансовый результат.\n\n" +
          "💡 _Совет: Не забывайте делать резервные копии в «Настройках» внутри приложения!_"

        const guideMarkup = {
          inline_keyboard: [
            [{ text: "⬅️ Назад в меню", callback_data: "back_to_menu" }]
          ]
        }

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: guideText,
            parse_mode: "Markdown",
            reply_markup: guideMarkup,
          }),
        })
      }

      // 2. Если нажали на "Моя подписка"
      if (data === "show_tariffs") {
        const tariffsText = 
          "💎 *Выберите тариф PrimeTrade PRO:*\n\n" +
          "• 1 месяц — 390 ₽\n" +
          "• 6 месяцев — 1990 ₽\n" +
          "• 12 месяцев — 3590 ₽ (выгодно)\n\n" +
          "Нажмите на кнопку, чтобы открыть приложение и оформить подписку."

                const tariffsMarkup = {
          inline_keyboard: [
            [{ text: "📅 1 месяц — 390 ₽", web_app: { url: `${APP_URL}?startapp=pay_1` } }],
            [{ text: "🔥 6 месяцев — 1990 ₽", web_app: { url: `${APP_URL}?startapp=pay_6` } }],
            [{ text: "🏆 12 месяцев — 3590 ₽", web_app: { url: `${APP_URL}?startapp=pay_12` } }],
            [{ text: "⬅️ Назад в меню", callback_data: "back_to_menu" }]
          ]
        }

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

      // 3. Если нажали "Назад в меню" (возврат к главному экрану)
      if (data === "back_to_menu") {
        const welcomeText = 
          "👋 *Добро пожаловать в PrimeTrade!*\n\n" +
          "Ваш личный помощник для учета техники Apple и контроля прибыли.\n\n" +
          "Выберите действие ниже 👇"

        const mainMenuMarkup = {
          inline_keyboard: [
            [{ text: "📚 Как пользоваться", callback_data: "show_guide" }],
            [{ text: "⭐ Моя подписка", callback_data: "show_tariffs" }],
            [{ text: "🚀 Открыть приложение", web_app: { url: APP_URL } }]
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