// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")

    const body = await req.json()
    console.log("Входящий запрос от Platega:", JSON.stringify(body))

    if (body.test === true) {
      return new Response("ok", { status: 200, headers: corsHeaders })
    }

    if (body.status === "CONFIRMED") {
      let telegramId = null;
      let plan = '1m';

      try {
        const payloadData = JSON.parse(body.payload);
        telegramId = payloadData.userId;
        plan = payloadData.plan;
      } catch (e) {
        console.error("Не удалось распарсить payload:", body.payload);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      if (!telegramId) {
        console.error("В payload нет userId")
        return new Response("ok", { status: 200, headers: corsHeaders })
      }

      // Получаем текущий профиль, чтобы узнать, есть ли у него еще активные дни
      const { data: currentProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_ends_at')
        .eq('telegram_id', Number(telegramId))
        .single();

      let baseDate = new Date();
      // Если у пользователя уже есть активная подписка (или триал), прибавляем дни к ней
      if (currentProfile?.subscription_ends_at && new Date(currentProfile.subscription_ends_at) > new Date()) {
        baseDate = new Date(currentProfile.subscription_ends_at);
      }

      let daysToAdd = 30;
      if (plan === '6m') daysToAdd = 180;
      if (plan === '12m') daysToAdd = 365;

      const endsAt = new Date(baseDate);
      endsAt.setDate(endsAt.getDate() + daysToAdd);
      const formattedDate = endsAt.toLocaleDateString('ru-RU');

      // Обновляем базу
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          subscription_ends_at: endsAt.toISOString(),
          platega_plan: plan
        })
        .eq('telegram_id', Number(telegramId))

      if (updateError) {
        console.error("Ошибка обновления профиля:", updateError)
        throw updateError
      }

      // Отправляем сообщение в Telegram
      if (BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramId,
            text: `🎉 *Оплата прошла успешно!*\n\nВаша подписка PrimeTrade PRO активна до *${formattedDate}*.\n\nСпасибо, что выбираете нас! 🚀`,
            parse_mode: "Markdown"
          })
        })
      }

      console.log(`✅ Подписка активирована для ${telegramId} до ${endsAt.toISOString()} (план: ${plan})`)
    }

    return new Response("ok", { status: 200, headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Ошибка в webhook:", message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})