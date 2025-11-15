import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Bell, FileText, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/blocks/hero-section";
import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";

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
      <HeroSection
        badge={{
          text: "Plataforma completa para MEI",
          action: {
            text: "Saiba mais",
            href: "/auth",
          },
        }}
        title="Gestão Contábil para MEI Simples, Rápida e Automatizada"
        description="Mantenha seu MEI em dia com alertas automáticos, controle financeiro completo e suporte direto do seu contador"
        actions={[
          {
            text: "Criar Conta Grátis",
            href: "/auth",
            variant: "glow",
          },
          {
            text: "Ver Demonstração",
            href: "/auth",
            variant: "outline",
            icon: <Icons.gitHub className="h-5 w-5" />,
          },
        ]}
        image={{
          light: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
          dark: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
          alt: "Dashboard MEI Gestão",
        }}
      />

      <section className="px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20 mt-20">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow border-border h-full">
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="bg-card rounded-2xl p-8 md:p-12 border border-border"
          >
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
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 gradient-primary">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="container mx-auto max-w-4xl text-center"
        >
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
        </motion.div>
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
