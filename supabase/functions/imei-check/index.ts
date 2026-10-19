// supabase/functions/send-subscription-message/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  // CORS заголовки, чтобы приложение могло вызвать функцию
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
    
    if (!BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN не настроен в секретах Supabase")
    }

    const { chat_id } = await req.json()

    if (!chat_id) {
      return new Response(JSON.stringify({ error: "chat_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "📅 1 месяц — 390 ₽", web_app: { url: "https://itrade-kappa.vercel.app/" } },
        ],
        [
          { text: "🔥 6 месяцев — 1990 ₽", web_app: { url: "https://itrade-kappa.vercel.app/" } },
        ],
        [
          { text: "🏆 12 месяцев — 3590 ₽ (выгодно)", web_app: { url: "https://itrade-kappa.vercel.app/" } },
        ],
      ],
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
        text: "💎 *Выберите тариф iTrade PRO:*\n\n" +
              "• 1 месяц — 390 ₽\n" +
              "• 6 месяцев — 1990 ₽\n" +
              "• 12 месяцев — 3590 ₽ (выгодно)\n\n" +
              "Нажмите на кнопку, чтобы открыть приложение и оформить подписку.",
        parse_mode: "Markdown",
        reply_markup: replyMarkup,
      }),
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})