import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import logoMeiGestao from "@/assets/logo-mei-gestao.png";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUserAndFetchInvitation();
  }, [token]);

  const checkUserAndFetchInvitation = async () => {
    if (!token) {
      setError("Token de convite inválido");
      setLoading(false);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // Use edge function for secure token lookup
      const response = await supabase.functions.invoke('manage-invitation', {
        body: { token, action: 'lookup' }
      });

      if (response.error) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      const data = response.data?.invitation;

      if (!data) {
        setError("Convite não encontrado");
        setLoading(false);
        return;
      }

      if (data.status === "revoked") {
        setError("Este convite foi revogado pelo MEI");
        setLoading(false);
        return;
      }

      if (data.status === "accepted") {
        setError("Este convite já foi aceito");
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError("Este convite expirou");
        setLoading(false);
        return;
      }

      setInvitation(data);
    } catch (err: any) {
      console.error("Error fetching invitation:", err);
      setError("Erro ao buscar convite");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      navigate(`/auth?redirect=/aceitar-convite?token=${token}`);
      return;
    }

    setAccepting(true);
    try {
      const response = await supabase.functions.invoke('manage-invitation', {
        body: { token, action: 'accept' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao aceitar convite');
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Convite aceito!",
        description: "Agora você tem acesso aos dados do MEI",
      });

      navigate("/contador");
    } catch (err: any) {
      console.error("Error accepting invitation:", err);
      toast({
        title: "Erro ao aceitar convite",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoMeiGestao} alt="MEI Gestão" className="h-16 w-16" />
          </div>
          <CardTitle>Convite para Contador</CardTitle>
          <CardDescription>
            Você foi convidado para acessar dados de um MEI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Verificando convite...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8 text-center">
              <XCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="font-medium text-destructive">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/")}
              >
                Voltar ao Início
              </Button>
            </div>
          ) : invitation ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Users className="w-10 h-10 text-primary" />
                <div>
                  <p className="font-medium">Acesso Somente Leitura</p>
                  <p className="text-sm text-muted-foreground">
                    Você poderá visualizar receitas, despesas e relatórios
                  </p>
                </div>
              </div>

              {!user && (
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    Você precisa fazer login ou criar uma conta para aceitar o convite
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Recusar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                >
                  {accepting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {user ? "Aceitar Convite" : "Login para Aceitar"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
