// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { telegram_id, plan_id, payment_method } = await req.json()

    const MERCHANT_ID = Deno.env.get("PLATEGA_MERCHANT_ID")
    const SECRET = Deno.env.get("PLATEGA_SECRET")
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!MERCHANT_ID || !SECRET) throw new Error("Не настроены PLATEGA_MERCHANT_ID или PLATEGA_SECRET")

    let amount = 0;
    let planLabel = "";
    if (plan_id === '1') { amount = 390; planLabel = "1m"; }
    else if (plan_id === '6') { amount = 1990; planLabel = "6m"; }
    else if (plan_id === '12') { amount = 3590; planLabel = "12m"; }
    else throw new Error("Неверный тариф")

    // Если payment_method не передан — используем 2 (СБП) по умолчанию
    const pm = Number(payment_method) || 2; // 2 = СБП, 13 = Крипта

    const response = await fetch("https://app.platega.io/transaction/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MerchantId": MERCHANT_ID,
        "X-Secret": SECRET,
      },
      body: JSON.stringify({
        paymentMethod: pm, 
        paymentDetails: { amount: amount, currency: "RUB" },
        description: `PrimeTrade PRO (${planLabel})`,
        payload: JSON.stringify({ userId: String(telegram_id), plan: planLabel })
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error("Ошибка Platega:", data)
      throw new Error(data.message || "Ошибка создания платежа")
    }

    return new Response(JSON.stringify({ redirect: data.redirect }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})