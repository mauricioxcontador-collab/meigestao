import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, Link2, Copy, X, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invitation {
  id: string;
  contador_email: string;
  status: string;
  invite_token: string;
  permissions: string;
  created_at: string;
  accepted_at: string | null;
  expires_at: string;
}

export function ContadorInviteManager() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("contador_invitations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleInviteByEmail = async () => {
    if (!email.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite o email do contador",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check if invitation already exists
      const existingPending = invitations.find(
        (inv) => inv.contador_email === email && inv.status === "pending"
      );

      if (existingPending) {
        toast({
          title: "Convite já enviado",
          description: "Já existe um convite pendente para este email",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contador_invitations")
        .insert({
          mei_user_id: user.id,
          contador_email: email.trim().toLowerCase(),
          permissions: "readonly",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${email}`,
      });

      setEmail("");
      fetchInvitations();
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("contador_invitations")
        .insert({
          mei_user_id: user.id,
          contador_email: "pending@invite.link",
          permissions: "readonly",
        })
        .select()
        .single();

      if (error) throw error;

      const inviteLink = `${window.location.origin}/aceitar-convite?token=${data.invite_token}`;
      
      await navigator.clipboard.writeText(inviteLink);
      
      toast({
        title: "Link copiado!",
        description: "O link de convite foi copiado para a área de transferência",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error("Error generating link:", error);
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/aceitar-convite?token=${token}`;
    await navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Link copiado!",
      description: "Link de convite copiado para a área de transferência",
    });
  };

  const revokeInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("contador_invitations")
        .update({ status: "revoked" })
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Acesso revogado",
        description: "O convite foi revogado com sucesso",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error("Error revoking invitation:", error);
      toast({
        title: "Erro ao revogar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceito
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Revogado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Convidar Contador
          </CardTitle>
          <CardDescription>
            Convide um contador para acessar seus dados financeiros (somente leitura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label htmlFor="contador-email" className="sr-only">Email do Contador</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contador-email"
                  type="email"
                  placeholder="email@contador.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>
            <Button onClick={handleInviteByEmail} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Enviar Convite
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button variant="outline" onClick={generateInviteLink} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Gerar Link de Convite
          </Button>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Gerencie os contadores que têm acesso aos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInvitations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contador convidado ainda</p>
              <p className="text-sm mt-1">Use o formulário acima para enviar um convite</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {invitation.contador_email === "pending@invite.link"
                          ? "Link de convite"
                          : invitation.contador_email}
                      </span>
                      {getStatusBadge(invitation.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enviado em {format(new Date(invitation.created_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      {invitation.status === "pending" && (
                        <span className="ml-2">
                          • Expira em {format(new Date(invitation.expires_at), "dd/MM/yyyy")}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {invitation.status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.invite_token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeInvitation(invitation.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {invitation.status === "accepted" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revokeInvitation(invitation.id)}
                      >
                        Revogar Acesso
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
