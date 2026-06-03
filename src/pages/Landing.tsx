import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Bell, FileText, Shield, Zap, Check, X, ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";
import { useSubscription, PLANS } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const [isQuarterly, setIsQuarterly] = useState(false);
  const { checkout, subscribed, planName } = useSubscription();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleCheckout = async (priceId: string, plan: string) => {
    if (!session) {
      navigate(`/auth?plan=${plan}`);
      return;
    }
    setLoadingPlan(plan);
    try {
      await checkout(priceId);
    } catch (err: any) {
      toast({
        title: "Erro ao iniciar pagamento",
        description: err?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize faturamento, lucro e despesas em tempo real com gráficos interativos",
      color: "from-primary to-primary/60"
    },
    {
      icon: Bell,
      title: "Alertas Automáticos",
      description: "Nunca perca prazos do DAS e outras obrigações fiscais",
      color: "from-secondary to-secondary/60"
    },
    {
      icon: FileText,
      title: "Relatórios PDF",
      description: "Gere relatórios mensais e anuais automaticamente com um clique",
      color: "from-accent to-accent/60"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Seus dados protegidos com criptografia de ponta a ponta",
      color: "from-primary to-secondary"
    },
    {
      icon: Zap,
      title: "WhatsApp Integrado",
      description: "Receba lembretes e alertas direto no seu WhatsApp",
      color: "from-secondary to-accent"
    },
    {
      icon: Sparkles,
      title: "IA Assistente",
      description: "Inteligência artificial para ajudar na gestão do seu negócio",
      color: "from-accent to-primary"
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/landing" className="flex items-center gap-3 flex-shrink-0">
            <img src={logoMeiGestao} alt="MEI Gestão" className="h-8 sm:h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Recursos</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Preços</a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors font-medium">Benefícios</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-medium px-2 sm:px-4">Entrar</Button>
            </Link>
            <Button
              size="sm"
              className="gradient-hero text-white font-semibold shadow-glow px-3 sm:px-6 text-xs sm:text-sm"
              onClick={() => handleCheckout(PLANS.basico.price_id, "basico")}
              disabled={loadingPlan === "basico"}
            >
              {loadingPlan === "basico" ? "..." : (
                <>
                  <span className="hidden sm:inline">Começar agora</span>
                  <span className="sm:hidden">Grátis</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-7xl relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Plataforma completa para MEI
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
              Gestão Contábil
              <span className="block text-gradient">Simples e Automatizada</span>
            </h1>
            
            <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-2">
              Mantenha seu MEI em dia com alertas automáticos, controle financeiro completo e suporte direto do seu contador
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md mx-auto sm:max-w-none">
              <Button
                size="lg"
                className="gradient-hero text-white font-semibold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 shadow-glow w-full sm:w-auto"
                onClick={() => handleCheckout(PLANS.basico.price_id, "basico")}
                disabled={loadingPlan === "basico"}
              >
                {loadingPlan === "basico" ? "Carregando..." : "Criar conta agora"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="font-semibold text-base sm:text-lg px-6 sm:px-8 h-12 sm:h-14 border-2 w-full">
                  Ver Demonstração
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="absolute inset-0 gradient-hero rounded-3xl blur-2xl opacity-20 scale-105" />
            <div className="relative bg-card rounded-2xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
              <div className="bg-muted/50 px-3 sm:px-6 py-3 sm:py-4 border-b border-border/50 flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-accent/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background/50 rounded-lg px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm text-muted-foreground truncate max-w-[180px] sm:max-w-none">
                    meigestao.com.br/dashboard
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-8">
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <img src={logoMeiGestao} alt="MEI Gestão" className="h-10 sm:h-12 w-auto" />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Dashboard MEI</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Bem-vindo ao seu painel</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Faturamento Mensal</p>
                    <p className="text-lg sm:text-2xl font-bold text-primary">R$ 4.250,00</p>
                  </Card>
                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">Faturamento Anual</p>
                    <p className="text-lg sm:text-2xl font-bold text-accent">R$ 38.500,00</p>
                  </Card>
                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">DAS do Mês</p>
                    <p className="text-lg sm:text-2xl font-bold text-secondary">R$ 71,60</p>
                  </Card>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Recursos <span className="text-gradient">Poderosos</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seu MEI de forma profissional
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="group p-6 sm:p-8 h-full border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                Tudo em <span className="text-gradient">um só lugar</span>
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-10">
                Simplifique sua rotina com uma plataforma completa que cuida de todas as suas obrigações.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  "Cálculo automático do DAS",
                  "Controle de faturamento",
                  "Relatórios financeiros",
                  "Gestão de despesas",
                  "Alertas via WhatsApp",
                  "Chat com contador",
                  "Upload de notas fiscais",
                  "Declaração DASN-SIMEI"
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-background/50"
                  >
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 gradient-hero rounded-3xl blur-2xl opacity-20" />
              <div className="relative bg-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-border/50 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <img src={logoMeiGestao} alt="MEI Gestão" className="h-12 sm:h-14 w-auto" />
                </div>
                <div className="space-y-4">
                  <div className="p-3 sm:p-4 rounded-2xl bg-accent/10 border border-accent/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Limite Anual</span>
                      <span className="font-semibold text-accent">47.5%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[47.5%] gradient-hero rounded-full" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">R$ 38.500 de R$ 81.000</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20">
                      <p className="text-xs sm:text-sm text-muted-foreground">Receitas</p>
                      <p className="text-lg sm:text-xl font-bold text-primary">R$ 38.500</p>
                    </div>
                    <div className="p-3 sm:p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                      <p className="text-xs sm:text-sm text-muted-foreground">Despesas</p>
                      <p className="text-lg sm:text-xl font-bold text-destructive">R$ 12.300</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Planos <span className="text-gradient">Acessíveis</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground mb-6 sm:mb-10">
              Escolha o melhor plano para o seu negócio
            </p>
            
            <div className="inline-flex items-center gap-1 sm:gap-4 p-1.5 rounded-full bg-muted max-w-full">
              <button
                onClick={() => setIsQuarterly(false)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base transition-all ${!isQuarterly ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setIsQuarterly(true)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium text-sm sm:text-base transition-all ${isQuarterly ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Trimestral
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-accent text-white px-1.5 sm:px-2 py-0.5 rounded-full">Economize</span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Plano Básico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-6 sm:p-8 h-full flex flex-col border-border/50 hover:border-primary/30 transition-all hover:shadow-lg">
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">Básico</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">Grátis</span>
                    <span className="text-muted-foreground">/para sempre</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recursos essenciais para começar a organizar seu MEI
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {[
                    "Dashboard completo",
                    "Controle de receitas e despesas",
                    "Cálculo automático do DAS",
                    "Gestão de impostos",
                    "Relatórios em PDF",
                    "Alertas por e-mail",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                  {[
                    "Módulo Trabalhista",
                    "Precificação inteligente",
                    "Metas e gamificação",
                    "Gráficos avançados",
                    "Meu Contador (conexão direta)",
                    "Alertas via WhatsApp",
                    "IA Assistente",
                    "Suporte prioritário",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground/70">
                      <X className="w-5 h-5 flex-shrink-0" />
                      <span className="line-through">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="w-full h-12 font-semibold"
                  onClick={() => navigate(session ? "/dashboard" : "/auth")}
                >
                  {session ? "Acessar Dashboard" : "Começar agora"}
                </Button>
              </Card>
            </motion.div>

            {/* Plano Pro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-6 sm:p-8 h-full flex flex-col border-2 border-primary relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  RECOMENDADO
                </div>
                
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    Pro
                    <Sparkles className="w-4 h-4 text-primary" />
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">R$ {isQuarterly ? '126,99' : '49,90'}</span>
                    <span className="text-muted-foreground">/{isQuarterly ? 'trimestre' : 'mês'}</span>
                  </div>
                  {isQuarterly && (
                    <p className="text-sm text-accent mt-2">Equivale a R$ 42,33/mês</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    Todos os recursos para escalar o seu negócio
                  </p>
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {[
                    "Tudo do plano Básico",
                    "Módulo Trabalhista (folha, FGTS, INSS)",
                    "Precificação inteligente",
                    "Metas e gamificação",
                    "Gráficos e análises avançadas",
                    "Meu Contador (conexão direta)",
                    "Relatórios avançados em PDF",
                    "Alertas via WhatsApp",
                    "IA Assistente integrada",
                    "Suporte prioritário",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-accent flex-shrink-0" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full h-12 font-semibold gradient-hero text-white shadow-glow"
                  disabled={loadingPlan === "pro" || (subscribed && planName === "Pro")}
                  onClick={() => handleCheckout(PLANS.pro.price_id, "pro")}
                >
                  {subscribed && planName === "Pro" ? "Plano Atual" : loadingPlan === "pro" ? "Carregando..." : "Assinar Agora"}
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="container mx-auto max-w-4xl text-center relative"
        >
          <img src={logoMeiGestao} alt="MEI Gestão" className="h-12 sm:h-16 w-auto mx-auto mb-6 sm:mb-8 brightness-0 invert" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Comece hoje mesmo
          </h2>
          <p className="text-base sm:text-xl text-white/90 mb-6 sm:mb-10 max-w-2xl mx-auto">
            Simplifique a gestão do seu MEI e foque no que realmente importa: seu negócio
          </p>
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-semibold text-base sm:text-lg px-6 sm:px-10 h-12 sm:h-14 shadow-xl w-full sm:w-auto max-w-md"
            onClick={() => handleCheckout(PLANS.basico.price_id, "basico")}
            disabled={loadingPlan === "basico"}
          >
            {loadingPlan === "basico" ? "Carregando..." : "Criar minha conta"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 sm:py-12 px-4 sm:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-center md:text-left">
            <div className="flex items-center gap-3">
              <img src={logoMeiGestao} alt="MEI Gestão" className="h-8 sm:h-10 w-auto" />
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              © 2025 MEI Gestão. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      <FloatingChatWidget />
    </div>
  );
};

export default Landing;
