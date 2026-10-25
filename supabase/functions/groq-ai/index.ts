// @ts-nocheck
// supabase/functions/groq-ai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { deal, platform } = await req.json()
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")

    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY не настроен")
    }

    // Формируем описание устройства для ИИ
    const specs = [];
    if (deal.storage_gb) specs.push(`Память: ${deal.storage_gb >= 1024 ? deal.storage_gb / 1024 + ' TB' : deal.storage_gb + ' GB'}`);
    if (deal.battery_health) specs.push(`АКБ: ${deal.battery_health}%`);
    if (deal.imei) specs.push(`IMEI: ${deal.imei}`);
    if (deal.description) specs.push(`Состояние: ${deal.description}`);
    
    const specsText = specs.length > 0 ? specs.join(', ') : 'Стандартная комплектация';
    const price = deal.sell_price ? Number(deal.sell_price).toLocaleString('ru-RU') + ' ₽' : 'Цена договорная';

    let prompt = "";
    if (platform === 'avito') {
      prompt = `Ты профессиональный перекуп Apple-техники. Напиши продающее объявление на Авито для модели "${deal.model}". Характеристики: ${specsText}. Цена: ${price}. Текст должен быть структурированным, с эмодзи, без воды. Обязательно выдели преимущества, укажи на возможный торг и призыв к действию. Длина: до 1000 символов.`;
    } else {
      prompt = `Ты профессиональный перекуп Apple-техники. Напиши короткое объявление для закрытого чата перекупов на модель "${deal.model}". Характеристики: ${specsText}. Цена для своих: ${price}. Текст должен быть четким, с эмодзи, без лишних слов. Главная цель — быстро заинтересовать коллег. Длина: до 400 символов.`;
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Быстрая и бесплатная модель
        messages: [
          { role: "system", content: "Ты эксперт по продажам техники Apple. Отвечай только готовым текстом объявления, без вступлений." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Ошибка Groq:", data)
      throw new Error(data.error?.message || "Ошибка генерации")
    }

    return new Response(JSON.stringify({ text: data.choices[0].message.content.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})