import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Bell, FileText, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Completo",
      description: "Visualize faturamento, lucro e despesas em tempo real"
    },
    {
      icon: Bell,
      title: "Alertas Automáticos",
      description: "Nunca perca prazos do DAS e outras obrigações"
    },
    {
      icon: FileText,
      title: "Relatórios PDF",
      description: "Gere relatórios mensais e anuais automaticamente"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Seus dados protegidos com criptografia de ponta"
    },
    {
      icon: Zap,
      title: "Automação WhatsApp",
      description: "Receba lembretes direto no seu WhatsApp"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary" />
            <span className="text-xl font-bold text-foreground">MEI Gestão</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="gradient-primary shadow-glow">Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Gestão Contábil para MEI
              <span className="block gradient-primary bg-clip-text text-transparent mt-2">
                Simples, Rápida e Automatizada
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mantenha seu MEI em dia com alertas automáticos, controle financeiro completo 
              e suporte direto do seu contador
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary shadow-glow text-lg px-8">
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-card rounded-2xl p-8 md:p-12 border border-border">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Tudo que você precisa em um só lugar
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                "Cálculo automático do DAS",
                "Controle de faturamento anual",
                "Relatórios financeiros mensais",
                "Gestão de receitas e despesas",
                "Alertas via WhatsApp e E-mail",
                "Chat direto com seu contador",
                "Upload fácil de notas fiscais",
                "Declaração Anual (DASN-SIMEI)"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-primary">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Comece hoje mesmo
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Simplifique a gestão do seu MEI e foque no que realmente importa: seu negócio
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Criar Minha Conta
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 MEI Gestão. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
