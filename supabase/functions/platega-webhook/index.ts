// @ts-nocheck
// supabase/functions/platega-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const MERCHANT_ID = Deno.env.get("PLATEGA_MERCHANT_ID")
    const SECRET = Deno.env.get("PLATEGA_SECRET")

    // Проверка подлинности запроса от Platega
    const headerMerchantId = req.headers.get('X-MerchantId')
    const headerSecret = req.headers.get('X-Secret')

    if (headerMerchantId !== MERCHANT_ID || headerSecret !== SECRET) {
      console.error("Неверные заголовки авторизации")
      return new Response("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    console.log("Callback от Platega:", JSON.stringify(body))

    // Нас интересуют только успешные платежи
    if (body.status === "CONFIRMED") {
      const telegramId = body.metadata?.userId
      if (!telegramId) {
        console.error("В callback нет userId в metadata")
        return new Response("Bad Request", { status: 400 })
      }

      // Вычисляем дату окончания подписки (+30 дней)
      const now = new Date()
      const endsAt = new Date(now.setDate(now.getDate() + 30))

      const { error } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          telegram_id: Number(telegramId),
          subscription_ends_at: endsAt.toISOString(),
        }, { onConflict: 'telegram_id' })

      if (error) {
        console.error("Ошибка обновления профиля:", error)
        throw error
      }

      console.log(`✅ Подписка активирована для ${telegramId} до ${endsAt.toISOString()}`)
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    // БЕЗОПАСНАЯ ОБРАБОТКА ОШИБКИ
    const message = error instanceof Error ? error.message : String(error)
    console.error("Ошибка в webhook:", message)
    
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
})