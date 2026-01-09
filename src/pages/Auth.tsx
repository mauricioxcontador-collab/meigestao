import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Building2, Calculator } from "lucide-react";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"mei" | "contador">("mei");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name
          }
        }
      });

      if (error) throw error;

      // Insert role into user_roles table
      if (data.user) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user.id,
            role: accountType
          });

        if (roleError) {
          console.error("Error setting user role:", roleError);
        }
      }

      toast({
        title: "Conta criada!",
        description: "Faça login para acessar o sistema",
      });
      
      setEmail("");
      setPassword("");
      setName("");
      setAccountType("mei");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check user role to redirect appropriately
      if (data.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .single();

        if (roleData?.role === "contador") {
          navigate("/contador");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/30">
            <img src={logoMeiGestao} alt="MEI Gestão" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">MEI Gestão</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            A plataforma completa para gestão contábil do seu MEI. Simples, rápida e automatizada.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-3xl font-bold">+5.000</p>
              <p className="text-white/70 text-sm">MEIs ativos</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm">
              <p className="text-3xl font-bold">99%</p>
              <p className="text-white/70 text-sm">Satisfação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <Link 
            to="/landing" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
          </Link>

          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoMeiGestao} alt="MEI Gestão" className="h-12 w-auto" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo!</h2>
            <p className="text-muted-foreground">
              Acesse sua conta ou crie uma nova para começar
            </p>
          </div>

          <Card className="border-border/50 shadow-xl">
            <CardContent className="pt-6">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                  <TabsTrigger value="signin" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-base data-[state=active]:bg-primary data-[state=active]:text-white">
                    Criar Conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-base">E-mail</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-base">Senha</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Entrar
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-5">
                    <div className="space-y-3">
                      <Label className="text-base">Tipo de Conta</Label>
                      <RadioGroup
                        value={accountType}
                        onValueChange={(value) => setAccountType(value as "mei" | "contador")}
                        className="grid grid-cols-2 gap-4"
                        disabled={isLoading}
                      >
                        <div>
                          <RadioGroupItem
                            value="mei"
                            id="mei"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="mei"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                          >
                            <Building2 className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Empresa</span>
                            <span className="text-xs text-muted-foreground">MEI / Empresa</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem
                            value="contador"
                            id="contador"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="contador"
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                          >
                            <Calculator className="mb-2 h-6 w-6" />
                            <span className="font-semibold">Contador</span>
                            <span className="text-xs text-muted-foreground">Profissional contábil</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-base">Nome Completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-base">E-mail</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-base">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="h-12 text-base"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                      Criar Conta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Ao continuar, você concorda com nossos{" "}
            <a href="#" className="text-primary hover:underline">Termos de Uso</a>{" "}
            e{" "}
            <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
