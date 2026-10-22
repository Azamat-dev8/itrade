// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { telegram_id, plan_id } = await req.json()

    const MERCHANT_ID = Deno.env.get("PLATEGA_MERCHANT_ID")
    const SECRET = Deno.env.get("PLATEGA_SECRET")

    if (!MERCHANT_ID || !SECRET) {
      throw new Error("Не настроены PLATEGA_MERCHANT_ID или PLATEGA_SECRET")
    }

    let amount = 0;
    const interval = 3; // <--- ИСПРАВЛЕНО: теперь const
    let intervalCount = 0;
    let description = ""

    if (plan_id === '1') { amount = 390; intervalCount = 1; description = "PrimeTrade PRO на 1 месяц"; }
    else if (plan_id === '6') { amount = 1990; intervalCount = 6; description = "PrimeTrade PRO на 6 месяцев"; }
    else if (plan_id === '12') { amount = 3590; intervalCount = 12; description = "PrimeTrade PRO на 12 месяцев"; }
    else throw new Error("Неверный тариф")

    const response = await fetch("https://app.platega.io/transaction/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MerchantId": MERCHANT_ID,
        "X-Secret": SECRET,
      },
      body: JSON.stringify({
        paymentMethod: 6,
        paymentDetails: {
          amount,
          currency: "RUB",
          interval,
          intervalCount,
        },
        description,
        metadata: { userId: String(telegram_id) }
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Ошибка Platega:", data)
      throw new Error(data.message || "Ошибка создания подписки")
    }

    return new Response(JSON.stringify({ redirect: data.redirect }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    // ИСПРАВЛЕНО: безопасное извлечение текста ошибки
    const message = error instanceof Error ? error.message : String(error);
    console.error("Критическая ошибка:", message)
    
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})