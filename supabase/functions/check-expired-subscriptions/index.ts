// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
    const CLOSED_CHAT_ID = Deno.env.get("TELEGRAM_CLOSED_CHAT_ID")

    // 1. Получаем всех пользователей с истёкшей подпиской (не админов)
    const { data: expiredUsers, error } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_id')
      .lt('subscription_ends_at', new Date().toISOString())
      .eq('is_admin', false)

    if (error) throw error
    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response("Нет просроченных подписок", { status: 200 })
    }

    // 2. Для каждого пользователя вызываем banChatMember (удаление из чата)
    for (const user of expiredUsers) {
      try {
        const banRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/banChatMember`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: CLOSED_CHAT_ID,
            user_id: user.telegram_id
          })
        })
        const banData = await banRes.json()
        if (!banData.ok) {
          console.error(`Не удалось удалить ${user.telegram_id}:`, banData)
        } else {
          console.log(`✅ Пользователь ${user.telegram_id} удалён из чата (подписка истекла)`)
        }
      } catch (err) {
        console.error(`Ошибка при удалении ${user.telegram_id}:`, err)
      }
    }

    return new Response("Проверка завершена", { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Критическая ошибка:", message)
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})