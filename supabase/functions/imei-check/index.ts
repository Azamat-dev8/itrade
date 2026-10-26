import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// База TAC (первые 8 цифр IMEI) для моментального определения без внешних API
const TAC_MAP: Record<string, string> = {
  "35301411": "iPhone 13 Pro",
  "35301511": "iPhone 13 Pro Max",
  "35298911": "iPhone 13",
  "35674311": "iPhone 14",
  "35674511": "iPhone 14 Pro",
  "35674611": "iPhone 14 Pro Max",
  "35105221": "iPhone 15 Pro",
  "35105321": "iPhone 15 Pro Max",
  "35105021": "iPhone 15",
  "35282009": "iPhone 11",
  "35282209": "iPhone 11 Pro",
  "35305010": "iPhone 12",
  "35305110": "iPhone 12 Pro",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imei } = await req.json();
    const cleanImei = String(imei || '').replace(/\D/g, '');

    if (!cleanImei || cleanImei.length < 14) {
      return new Response(JSON.stringify({ error: "IMEI слишком короткий" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const tac = cleanImei.substring(0, 8);
    const foundModel = TAC_MAP[tac] || null;

    return new Response(
      JSON.stringify({
        success: true,
        imei: cleanImei,
        model: foundModel
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Ошибка" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});