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

    const body = await req.json()
    console.log("Входящий запрос от Platega:", JSON.stringify(body))

    if (body.test === true) {
      return new Response("ok", { status: 200, headers: corsHeaders })
    }

    if (body.status === "CONFIRMED") {
      // Достаем данные из payload
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

      let daysToAdd = 30;
      if (plan === '6m') daysToAdd = 180;
      if (plan === '12m') daysToAdd = 365;

      const now = new Date()
      const endsAt = new Date(now.setDate(now.getDate() + daysToAdd))

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