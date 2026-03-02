import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token || typeof token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    if (action === 'lookup') {
      // Lookup invitation by token - only return safe fields
      const { data, error } = await supabaseAdmin
        .from('contador_invitations')
        .select('id, status, expires_at, permissions')
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Convite não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ invitation: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'accept') {
      // Validate user authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Usuário não autenticado' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch invitation with admin client
      const { data: invitation, error: invError } = await supabaseAdmin
        .from('contador_invitations')
        .select('*')
        .eq('invite_token', token)
        .single();

      if (invError || !invitation) {
        return new Response(
          JSON.stringify({ error: 'Convite não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (invitation.status === 'revoked') {
        return new Response(
          JSON.stringify({ error: 'Este convite foi revogado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (invitation.status === 'accepted') {
        return new Response(
          JSON.stringify({ error: 'Este convite já foi aceito' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Este convite expirou' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update invitation
      await supabaseAdmin
        .from('contador_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          contador_email: user.email,
          contador_user_id: user.id,
        })
        .eq('id', invitation.id);

      // Add contador role if not exists
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'contador')
        .single();

      if (!existingRole) {
        await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: user.id, role: 'contador' }, { onConflict: 'user_id' });
      }

      // Handle client relationship
      const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('mei_user_id', invitation.mei_user_id)
        .single();

      if (existingClient) {
        await supabaseAdmin
          .from('clients')
          .update({ contador_user_id: user.id })
          .eq('id', existingClient.id);
      } else {
        await supabaseAdmin
          .from('clients')
          .insert({
            mei_user_id: invitation.mei_user_id,
            contador_user_id: user.id,
            cnpj: 'PENDENTE',
            razao_social: 'Cliente MEI',
          });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in manage-invitation:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
