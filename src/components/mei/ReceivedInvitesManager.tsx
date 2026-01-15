import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Clock, CheckCircle, XCircle, Loader2, Mail, Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReceivedInvite {
  id: string;
  contador_email: string;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  contador_profile?: {
    full_name: string;
  } | null;
}

export function ReceivedInvitesManager() {
  const { toast } = useToast();
  const [invites, setInvites] = useState<ReceivedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReceivedInvites();
  }, []);

  const fetchReceivedInvites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invites where this MEI user is the target
      const { data, error } = await supabase
        .from("contador_invitations")
        .select("*")
        .eq("mei_user_id", user.id)
        .eq("contador_email", "contador-request") // Invites initiated by contador
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvites(data || []);
    } catch (error: any) {
      console.error("Error fetching received invites:", error);
      toast({
        title: "Erro ao carregar convites",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update invitation status
      const { error: updateError } = await supabase
        .from("contador_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", inviteId);

      if (updateError) throw updateError;

      toast({
        title: "Convite aceito!",
        description: "O contador agora tem acesso aos seus dados financeiros",
      });

      fetchReceivedInvites();
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Erro ao aceitar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await supabase
        .from("contador_invitations")
        .update({ status: "rejected" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Convite recusado",
        description: "O convite foi recusado com sucesso",
      });

      fetchReceivedInvites();
    } catch (error: any) {
      console.error("Error rejecting invite:", error);
      toast({
        title: "Erro ao recusar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAccess = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await supabase
        .from("contador_invitations")
        .update({ status: "revoked" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Acesso revogado",
        description: "O contador não tem mais acesso aos seus dados",
      });

      fetchReceivedInvites();
    } catch (error: any) {
      console.error("Error revoking access:", error);
      toast({
        title: "Erro ao revogar acesso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando resposta
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Aceito
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <XCircle className="w-3 h-3 mr-1" />
            Recusado
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-muted">
            <XCircle className="w-3 h-3 mr-1" />
            Revogado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingInvites = invites.filter(inv => inv.status === "pending");
  const otherInvites = invites.filter(inv => inv.status !== "pending");

  return (
    <div className="space-y-6">
      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Convites Pendentes
          </CardTitle>
          <CardDescription>
            Contadores que solicitaram acesso aos seus dados financeiros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : pendingInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite pendente</p>
              <p className="text-sm mt-1">Você receberá notificações quando contadores solicitarem acesso</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-warning/5 border-warning/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Contador solicita acesso</span>
                      {getStatusBadge(invite.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recebido em {format(new Date(invite.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Expira em {format(new Date(invite.expires_at), "dd/MM/yyyy")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.id)}
                      disabled={actionLoading === invite.id}
                      className="bg-success hover:bg-success/90"
                    >
                      {actionLoading === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectInvite(invite.id)}
                      disabled={actionLoading === invite.id}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      {actionLoading === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accepted/Other Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Contadores com Acesso
          </CardTitle>
          <CardDescription>
            Gerencie os contadores que têm acesso aos seus dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : otherInvites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum contador com acesso</p>
              <p className="text-sm mt-1">Aceite convites para permitir que contadores vejam seus dados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {otherInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Contador</span>
                      {getStatusBadge(invite.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {invite.status === "accepted" && invite.accepted_at
                        ? `Aceito em ${format(new Date(invite.accepted_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                        : `Atualizado em ${format(new Date(invite.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
                    </p>
                  </div>

                  {invite.status === "accepted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeAccess(invite.id)}
                      disabled={actionLoading === invite.id}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    >
                      {actionLoading === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Revogar Acesso"
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
