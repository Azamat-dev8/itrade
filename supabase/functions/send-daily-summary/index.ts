import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => { // ИСПРАВЛЕНО: добавили _ перед req
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // ВАЖНО: Убедись, что здесь написано ALERTS в конце!
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN_ALERTS') 
    
    if (!botToken) throw new Error("Нет токена бота")

    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_id, display_name')
      .eq('daily_summary', true)

    if (usersError) throw usersError;
    if (!users || users.length === 0) return new Response("Нет пользователей", { status: 200 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    let sentCount = 0;

    for (const user of users) {
      const { data: deals } = await supabaseAdmin
        .from('deals')
        .select('*, expenses(*)')
        .eq('user_id', user.telegram_id)
        .gte('sold_at', todayISO)
        .gt('sold_quantity', 0)

      const { data: stock } = await supabaseAdmin
        .from('deals')
        .select('*')
        .eq('user_id', user.telegram_id)
        .gt('quantity', 0)

      let todayProfit = 0
      let soldCount = 0

      if (deals) {
        deals.forEach(d => {
          soldCount += Number(d.sold_quantity)
          const initQty = (d.quantity || 0) + (d.sold_quantity || 0)
          
          // ИСПРАВЛЕНО: добавили типы для sum и e
          const expSum = (d.expenses || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0)
          
          const perUnitExp = initQty > 0 ? expSum / initQty : 0
          
          // ИСПРАВЛЕНО: обернули d.sold_quantity в Number()
          todayProfit += Number(d.sold_quantity) * (Number(d.sell_price) - Number(d.buy_price) - perUnitExp)
        })
      }

      let deadStockCount = 0
      if (stock) {
        stock.forEach(item => {
          const days = Math.floor((new Date().getTime() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
          if (days >= 21) deadStockCount++
        })
      }

      if (soldCount === 0 && deadStockCount === 0) continue;

      let message = `👋 Привет, ${user.display_name || 'Перекуп'}!\n\n`
      message += `📊 *Твои итоги за сегодня:*\n`
      message += `💰 Прибыль: ${todayProfit.toLocaleString('ru-RU')} ₽\n`
      message += `📦 Продано: ${soldCount} шт.\n\n`
      
      if (deadStockCount > 0) {
        message += `⚠️ *Внимание!* У тебя *${deadStockCount}* товар(ов) на складе лежат больше 21 дня. Пора снижать цену!\n\n`
      }
      message += `_Хорошего вечера и легких продаж!_ 🚀`

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_id,
          text: message,
          parse_mode: 'Markdown'
        })
      })
      sentCount++;
    }

    return new Response(JSON.stringify({ success: true, sentTo: sentCount }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    // ИСПРАВЛЕНО: привели error к типу Error
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
})