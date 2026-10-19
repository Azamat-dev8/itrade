// Файл: supabase/functions/imei-check/index.ts

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imei } = await req.json()
    if (!imei) {
      return new Response(JSON.stringify({ error: 'IMEI is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Получаем секрет из переменных окружения Supabase
    const apiKey = Deno.env.get('IMEI_API_KEY')

    // Новый V1 API сервиса проверки
    const url = new URL('https://ifreecheck.net/api/v1/check')
    url.searchParams.append('imei', imei)
    url.searchParams.append('service', '13') // Код услуги

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey || '' 
      }
    })

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) { 
    // Убрали ': any', чтобы VS Code не ругался
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})