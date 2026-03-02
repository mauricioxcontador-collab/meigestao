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
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dataContext } = await req.json();

    // Validate input
    if (!dataContext || typeof dataContext !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Dados inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (dataContext.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Dados muito grandes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Você é um consultor financeiro especializado em MEI (Microempreendedor Individual) no Brasil. 
    Sua função é analisar os dados financeiros fornecidos e gerar um relatório executivo completo e motivador.
    
    O relatório deve incluir:
    1. RESUMO EXECUTIVO - Uma visão geral do desempenho do mês
    2. ANÁLISE DE CRESCIMENTO - Comparação com meses anteriores e tendências
    3. PONTOS FORTES - Categorias e áreas que mais contribuíram para o resultado
    4. OPORTUNIDADES DE MELHORIA - Áreas que precisam de atenção
    5. ANÁLISE DA META - Por que a meta foi ou não atingida, com fatores específicos
    6. PROJEÇÃO E RECOMENDAÇÕES - Sugestão de valor para próxima meta com justificativa
    7. CONCLUSÃO MOTIVACIONAL - Texto final encorajador e prático
    
    Use linguagem profissional mas acessível. Seja específico com números e porcentagens.
    Formate o texto de forma clara com títulos em maiúsculas e parágrafos bem definidos.
    O relatório deve ter entre 400-600 palavras.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analise os seguintes dados e gere um relatório completo:\n\n${dataContext}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes. Adicione créditos à sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Failed to generate report');
    }

    const data = await response.json();
    const report = data.choices[0]?.message?.content || 'Não foi possível gerar o relatório.';

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-goal-report:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao gerar relatório' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
