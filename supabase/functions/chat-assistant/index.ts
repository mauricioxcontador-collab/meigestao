import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é a assistente virtual do MEI Gestão, uma plataforma completa de gestão contábil para Microempreendedores Individuais (MEI).

Seu papel é responder dúvidas dos visitantes sobre a plataforma de forma simpática, clara e objetiva. Sempre em português brasileiro.

Informações sobre a plataforma MEI Gestão:

**Recursos:**
- Dashboard Inteligente: visualize faturamento, lucro e despesas em tempo real com gráficos interativos
- Alertas Automáticos: nunca perca prazos do DAS e outras obrigações fiscais
- Relatórios PDF: gere relatórios mensais e anuais automaticamente com um clique
- 100% Seguro: dados protegidos com criptografia de ponta a ponta
- WhatsApp Integrado (plano Pro): receba lembretes e alertas direto no WhatsApp
- IA Assistente (plano Pro): inteligência artificial para ajudar na gestão do negócio

**Funcionalidades incluídas:**
- Cálculo automático do DAS
- Controle de faturamento
- Relatórios financeiros
- Gestão de despesas
- Alertas via WhatsApp (Pro)
- Chat com contador (Pro)
- Upload de notas fiscais
- Declaração DASN-SIMEI

**Planos:**
1. Básico - R$ 39,90/mês ou R$ 99,99/trimestre (equivale a R$ 33,33/mês)
   - Dashboard completo
   - Controle receitas/despesas
   - Alertas por e-mail
   - Relatórios PDF
   - Cálculo automático DAS

2. Pro - R$ 49,90/mês ou R$ 126,99/trimestre (equivale a R$ 42,33/mês) — RECOMENDADO
   - Tudo do Básico
   - Alertas WhatsApp
   - Chat com contador
   - Relatórios avançados
   - Suporte prioritário
   - IA Assistente

**Regras:**
- Responda APENAS sobre o MEI Gestão e assuntos relacionados a MEI
- Seja breve e direto (máximo 3 parágrafos)
- Não invente funcionalidades que não existem
- Sugira o plano Pro quando fizer sentido
- Use emojis com moderação para ser amigável
- Se não souber a resposta, oriente o cliente a entrar em contato pelo e-mail ou criar uma conta para falar com o suporte`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Serviço temporariamente indisponível." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
