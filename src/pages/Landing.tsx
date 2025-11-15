import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, BarChart3, Bell, FileText, Shield, Zap, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroSection } from "@/components/blocks/hero-section";
import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";
import { useState } from "react";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

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

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Escolha o melhor plano para o seu MEI
            </p>
            
            {/* Toggle Mensal/Anual */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg font-medium transition-colors ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Mensal
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative w-16 h-8 rounded-full bg-primary transition-colors"
              >
                <motion.div
                  className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md"
                  animate={{ x: isAnnual ? 32 : 0 }}
                  transition={{ duration: 0.2 }}
                />
              </button>
              <span className={`text-lg font-medium transition-colors ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Anual
                <span className="ml-2 text-sm text-success">(Economize 20%)</span>
              </span>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Plano Básico */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow border-border h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Básico</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {isAnnual ? '15,92' : '19,90'}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-2">
                      R$ 191,04 cobrado anualmente
                    </p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Dashboard básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Controle de receitas e despesas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Alertas de DAS via e-mail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Relatórios mensais PDF</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Chat com contador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Alertas via WhatsApp</span>
                  </li>
                </ul>

                <Link to="/auth" className="w-full">
                  <Button variant="outline" className="w-full">
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Plano Profissional - Destaque */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow border-primary border-2 h-full flex flex-col relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Profissional</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {isAnnual ? '20,79' : '25,99'}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-2">
                      R$ 249,48 cobrado anualmente
                    </p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Tudo do plano Básico</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Dashboard completo com gráficos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Chat direto com contador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Alertas via WhatsApp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Relatórios avançados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Suporte prioritário</span>
                  </li>
                </ul>

                <Link to="/auth" className="w-full">
                  <Button className="w-full gradient-primary shadow-glow">
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Plano Premium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="p-8 hover:shadow-xl transition-shadow border-border h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Premium</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-foreground">
                      R$ {isAnnual ? '27,19' : '33,99'}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-muted-foreground mt-2">
                      R$ 326,28 cobrado anualmente
                    </p>
                  )}
                </div>
                
                <ul className="space-y-3 mb-8 flex-grow">
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Tudo do plano Profissional</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Consultoria mensal com contador</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Preparação da DASN-SIMEI</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Upload ilimitado de documentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Análise financeira avançada</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">Suporte 24/7</span>
                  </li>
                </ul>

                <Link to="/auth" className="w-full">
                  <Button variant="outline" className="w-full">
                    Começar Agora
                  </Button>
                </Link>
              </Card>
            </motion.div>
          </div>
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
