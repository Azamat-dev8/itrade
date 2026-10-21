// supabase/functions/telegram-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req: Request) => {
  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!
    const APP_URL = "https://itrade-kappa.vercel.app/"
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    const body = await req.json()

    // --- ОБРАБОТКА ТЕКСТОВЫХ КОМАНД ---
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id
      const text = body.message.text.trim()

      // Команда /start
      if (text === "/start" || text === "/menu") {
        const welcomeText = 
          "👋 *Добро пожаловать в PrimeTrade!*\n\n" +
          "Выберите действие ниже 👇\n\n" +
          "💡 *Быстрый расход:*\n" +
          "Напишите боту `/expense 500 такси`, чтобы моментально добавить трату в приложение."

        const mainMenuMarkup = {
          inline_keyboard: [
            [{ text: "👤 Мой профиль", web_app: { url: APP_URL } }],
            [{ text: "⭐ Моя подписка", callback_data: "show_tariffs" }]
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

      // Команда /expense [сумма] [категория]
      if (text.startsWith("/expense")) {
        const parts = text.split(" ")
        if (parts.length < 2) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "❌ Формат: /expense 500 такси" })
          })
          return new Response("ok", { status: 200 })
        }

        const amount = Number(parts[1])
        const category = parts.slice(2).join(" ") || "Разное"

        if (isNaN(amount) || amount <= 0) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "❌ Неверная сумма. Напишите: /expense 500 такси" })
          })
          return new Response("ok", { status: 200 })
        }

        // Записываем в базу
        const { error } = await supabaseAdmin.from('expenses').insert([{
          user_id: chatId,
          amount: amount,
          category: category,
          deal_id: null
        }])

        if (error) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: "⚠️ Ошибка базы: " + error.message })
          })
        } else {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              chat_id: chatId, 
              text: `✅ Расход добавлен!\n💰 Сумма: ${amount} ₽\n🏷 Тег: #${category}` 
            })
          })
        }
      }
    }

    // --- ОБРАБОТКА НАЖАТИЙ НА КНОПКИ ---
    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id
      const chatId = body.callback_query.message.chat.id
      const messageId = body.callback_query.message.message_id
      const data = body.callback_query.data

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId }),
      })

      if (data === "show_tariffs") {
        // ... (твой код тарифов, оставь как было)
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