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
    const { telegram_id } = await req.json()
    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")
    const CLOSED_CHAT_ID = Deno.env.get("TELEGRAM_CLOSED_CHAT_ID")
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Проверяем профиль
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin, subscription_ends_at, platega_plan')
      .eq('telegram_id', telegram_id)
      .single()

    // ГЛАВНОЕ ИСПРАВЛЕНИЕ: Триал не считается доступом к чату. 
    // Нам нужен либо is_admin, либо реальный план (1m, 6m, 12m)
    const isPaid = profile?.is_admin || (
      profile?.subscription_ends_at && 
      new Date(profile.subscription_ends_at) > new Date() &&
      profile?.platega_plan !== null // <--- Отсекаем триал
    );

    if (!isPaid) {
      return new Response(JSON.stringify({ error: "Доступ к чату только по платной подписке" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // На всякий случай разбаниваем (если человек вылетал)
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/unbanChatMember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CLOSED_CHAT_ID, user_id: telegram_id, only_if_banned: true })
    })

    // Генерируем новую ссылку
    const inviteRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CLOSED_CHAT_ID,
        member_limit: 1,
        expire_date: Math.floor(Date.now() / 1000) + 3600 // Действует 1 час
      })
    })

    const inviteData = await inviteRes.json()

    if (!inviteData.ok) {
      throw new Error(inviteData.description || "Ошибка создания ссылки")
    }

    return new Response(JSON.stringify({ link: inviteData.result.invite_link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})