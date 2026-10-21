// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Не заданы SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY")
    }
    if (!botToken) {
      throw new Error("Нет токена бота (TELEGRAM_BOT_TOKEN)")
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_id')
      .eq('daily_summary', true)

    if (usersError) throw usersError
    if (!users || users.length === 0) {
      return new Response("Нет пользователей с включённой сводкой", { status: 200 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isoToday = today.toISOString()

    for (const user of users) {
      const { data: deals, error: dealsError } = await supabaseAdmin
        .from('deals')
        .select('sell_price, buy_price, sold_quantity, sold_at, expenses(amount)')
        .eq('user_id', user.telegram_id)
        .gte('sold_at', isoToday)

      if (dealsError) {
        console.error(`Ошибка получения сделок для ${user.telegram_id}:`, dealsError.message)
        continue
      }

      let revenue = 0
      let profit = 0
      let soldCount = 0

      if (deals) {
        deals.forEach((deal) => {
          const qty = Number(deal.sold_quantity) || 0
          revenue += qty * (Number(deal.sell_price) || 0)
          const exp = (deal.expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0)
          profit += qty * ((Number(deal.sell_price) || 0) - (Number(deal.buy_price) || 0)) - exp
          soldCount += qty
        })
      }

      if (soldCount > 0) {
        const message = `📊 *Ежедневная сводка*\n\n` +
                        `Сегодня продано: ${soldCount} шт.\n` +
                        `Выручка: ${revenue.toLocaleString('ru-RU')} ₽\n` +
                        `Чистая прибыль: ${profit.toLocaleString('ru-RU')} ₽\n\n` +
                        `Так держать! 🚀`

        const tgResp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: user.telegram_id,
            text: message,
            parse_mode: "Markdown"
          })
        })

        if (!tgResp.ok) {
          const errText = await tgResp.text()
          console.error(`Не удалось отправить сообщение ${user.telegram_id}:`, errText)
        }
      }
    }

    return new Response("Сводки отправлены", { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Критическая ошибка в send-daily-summary:", message)

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})