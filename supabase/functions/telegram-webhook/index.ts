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
            // 1. Если нажали на "Как пользоваться"
      if (data === "show_guide") {
        const guideText = 
          "📚 *ПОЛНЫЙ ГАЙД ПО PRIMETRADE*\n" +
          "_Всё, что нужно знать за 2 минуты_\n\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "📊 *ГЛАВНАЯ*\n" +
          "Статистика бизнеса в одном экране:\n" +
          "• Бюджет и свободные средства\n" +
          "• Реализованная прибыль чистыми\n" +
          "• Долги и задатки (кто кому)\n" +
          "• Топ моделей по марже\n" +
          "• График прибыли по месяцам\n\n" +
          "🛒 *ПОКУПКА*\n" +
          "Добавляй купленные устройства:\n" +
          "• Выбери модель (iPhone, iPad, AirPods...)\n" +
          "• Укажи цену закупа и количество\n" +
          "• Заполни АКБ, память, IMEI\n" +
          "• Загрузи до 3 фото\n" +
          "• Отметь расходы (ремонт, такси, доставка)\n\n" +
          "📦 *СКЛАД*\n" +
          "Все устройства в 6 категориях: iPhone, AirPods, iPad, Apple Watch, MacBook, Аксессуары.\n" +
          "• Продавай по частям (например, 1 из 5 AirPods)\n" +
          "• Товары старше 21 дня подсвечиваются ⚠️\n" +
          "• Добавляй партии одним кликом\n\n" +
          "💰 *СДЕЛКИ*\n" +
          "История всех проданных устройств:\n" +
          "• Автоматический расчёт чистой прибыли\n" +
          "• Учёт всех расходов\n" +
          "• Экспорт в Excel по кнопке\n\n" +
          "🧮 *КАЛЬКУЛЯТОР*\n" +
          "Рассчитай маржу ДО покупки:\n" +
          "• Учёт комиссии Авито\n" +
          "• Твоя история средних цен\n" +
          "• Подсказка, хватает ли бюджета\n\n" +
          "💵 *ДОП. РАСХОДЫ*\n" +
          "Всё, что не привязано к товару:\n" +
          "• Реклама, аренда, бензин, еда\n" +
          "• Статистика: сколько уходит в месяц\n\n" +
          "👥 *КОНТАКТЫ*\n" +
          "База поставщиков и покупателей:\n" +
          "• Быстрый звонок одним касанием\n" +
          "• Заметки о человеке\n\n" +
          "⚙️ *НАСТРОЙКИ*\n" +
          "• Скрыть суммы (работа в кафе)\n" +
          "• Тёмная и светлая тема\n" +
          "• Ежедневная сводка в бот\n" +
          "• Резервная копия данных\n\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "💎 *PRO ПОДПИСКА*\n" +
          "• Первые 7 дней — бесплатно\n" +
          "• 390₽/мес или 3590₽/год\n" +
          "• Снимает все ограничения\n" +
          "• Даёт доступ к закрытому чату\n\n" +
          "🤝 *ЗАКРЫТЫЙ ЧАТ*\n" +
          "Клуб перекупов — только для PRO-подписчиков. Кнопка в боковом меню.\n\n" +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "💡 *Совет:* Делай резервную копию раз в неделю в «Настройках» — это 10 секунд, но спасёт все данные при смене телефона."

        const guideMarkup = {
          inline_keyboard: [
            [{ text: "🚀 Открыть приложение", web_app: { url: APP_URL } }],
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