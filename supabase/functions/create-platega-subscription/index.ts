// @ts-nocheck
// supabase/functions/create-platega-subscription/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const telegram_id = body.telegram_id
    const plan_id = body.plan_id
    
    const MERCHANT_ID = Deno.env.get("PLATEGA_MERCHANT_ID")
    const SECRET = Deno.env.get("PLATEGA_SECRET")

    let amount = 0;
    let interval = 0;
    let intervalCount = 0;

    if (plan_id === '1') { amount = 390; interval = 3; intervalCount = 1; }
    else if (plan_id === '6') { amount = 1990; interval = 3; intervalCount = 6; }
    else if (plan_id === '12') { amount = 3590; interval = 4; intervalCount = 1; }
    else throw new Error("Неверный тариф")

    // ЕСЛИ КЛЮЧЕЙ НЕТ (для теста), ВОЗВРАЩАЕМ ФЕЙКОВУЮ ССЫЛКУ
    if (!MERCHANT_ID || !SECRET || MERCHANT_ID === 'test') {
      console.log("Тестовый режим: ключи Platega не найдены");
      return new Response(JSON.stringify({ 
        redirect: "https://telegra.ph/Test-Payment-Page-10-19",
        message: "Это тестовая ссылка." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // РЕАЛЬНЫЙ ЗАПРОС К PLATEGA (раскомментируем позже)
    /*
    const response = await fetch("https://app.platega.io/transaction/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MerchantId": MERCHANT_ID,
        "X-Secret": SECRET,
      },
      body: JSON.stringify({
        paymentMethod: 6,
        paymentDetails: { amount: amount, currency: "RUB", interval: interval, intervalCount: intervalCount },
        description: `PrimeTrade PRO подписка (${plan_id} мес)`,
        payload: JSON.stringify({ telegram_id }), 
        returnUrl: "https://itrade-kappa.vercel.app/", 
      }),
    })
    const data = await response.json()
    return new Response(JSON.stringify({ redirect: data.redirect }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
    */

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})