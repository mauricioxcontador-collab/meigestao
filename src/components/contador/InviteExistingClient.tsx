import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCheck, Loader2, Mail, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface MEIProfile {
  id: string;
  full_name: string;
  cpf_cnpj: string | null;
  email?: string;
  client?: {
    id: string;
    razao_social: string;
    cnpj: string;
    atividade: string | null;
  } | null;
}

interface InviteExistingClientProps {
  contadorUserId: string;
  onSuccess: () => void;
}

export function InviteExistingClient({ contadorUserId, onSuccess }: InviteExistingClientProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [results, setResults] = useState<MEIProfile[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um CNPJ, nome ou razão social para buscar",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearched(true);
    setResults([]);

    try {
      const cleanedSearch = searchTerm.replace(/\D/g, "");
      const isSearchingCNPJ = cleanedSearch.length >= 8;

      // Get user_roles to filter only MEI users
      const { data: meiRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "mei");

      if (rolesError) throw rolesError;

      const meiUserIds = new Set(meiRoles?.map(r => r.user_id) || []);

      // Get clients already managed by this contador
      const { data: existingClients } = await supabase
        .from("clients")
        .select("mei_user_id")
        .eq("contador_user_id", contadorUserId);

      const existingMeiUserIds = new Set(existingClients?.map(c => c.mei_user_id) || []);

      const profilesWithClients: MEIProfile[] = [];

      // Search by CNPJ in clients table
      if (isSearchingCNPJ) {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, mei_user_id, razao_social, cnpj, atividade")
          .ilike("cnpj", `%${cleanedSearch}%`)
          .limit(20);

        if (!clientsError && clientsData) {
          for (const client of clientsData) {
            // Only include MEI users not already linked to this contador
            if (client.mei_user_id && meiUserIds.has(client.mei_user_id) && !existingMeiUserIds.has(client.mei_user_id)) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("id, full_name, cpf_cnpj")
                .eq("id", client.mei_user_id)
                .maybeSingle();

              if (profileData) {
                profilesWithClients.push({
                  ...profileData,
                  client: {
                    id: client.id,
                    razao_social: client.razao_social,
                    cnpj: client.cnpj,
                    atividade: client.atividade,
                  },
                });
              }
            }
          }
        }
      }

      // Search by razao_social (company name)
      const { data: clientsByName, error: nameError } = await supabase
        .from("clients")
        .select("id, mei_user_id, razao_social, cnpj, atividade")
        .ilike("razao_social", `%${searchTerm}%`)
        .limit(20);

      if (!nameError && clientsByName) {
        const existingIds = new Set(profilesWithClients.map(p => p.id));
        
        for (const client of clientsByName) {
          // Only include MEI users not already in results and not already linked to this contador
          if (client.mei_user_id && 
              meiUserIds.has(client.mei_user_id) && 
              !existingMeiUserIds.has(client.mei_user_id) &&
              !existingIds.has(client.mei_user_id)) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, full_name, cpf_cnpj")
              .eq("id", client.mei_user_id)
              .maybeSingle();

            if (profileData) {
              profilesWithClients.push({
                ...profileData,
                client: {
                  id: client.id,
                  razao_social: client.razao_social,
                  cnpj: client.cnpj,
                  atividade: client.atividade,
                },
              });
            }
          }
        }
      }

      // Also search by profile full_name
      const { data: profilesByName, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, cpf_cnpj")
        .ilike("full_name", `%${searchTerm}%`)
        .limit(20);

      if (!profilesError && profilesByName) {
        const existingIds = new Set(profilesWithClients.map(p => p.id));
        
        for (const profile of profilesByName) {
          // Only include MEI users not already in results and not already linked to this contador
          if (meiUserIds.has(profile.id) && 
              !existingMeiUserIds.has(profile.id) &&
              !existingIds.has(profile.id)) {
            // Get client data if exists
            const { data: clientData } = await supabase
              .from("clients")
              .select("id, razao_social, cnpj, atividade")
              .eq("mei_user_id", profile.id)
              .maybeSingle();

            profilesWithClients.push({
              ...profile,
              client: clientData,
            });
          }
        }
      }

      setResults(profilesWithClients);

      if (profilesWithClients.length === 0) {
        toast({
          title: "Nenhum resultado",
          description: "Nenhum cliente MEI encontrado com esses dados ou já está vinculado a você",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (meiProfile: MEIProfile) => {
    setIsInviting(true);
    try {
      // Create an invitation for this MEI
      const { error } = await supabase
        .from("contador_invitations")
        .insert({
          mei_user_id: meiProfile.id,
          contador_email: "contador-request", // Marker for contador-initiated invites
          permissions: "readonly",
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Convite enviado!",
        description: `Convite enviado para ${meiProfile.client?.razao_social || meiProfile.full_name}`,
      });

      // Remove from results
      setResults(prev => prev.filter(r => r.id !== meiProfile.id));
      onSuccess();
    } catch (error: any) {
      console.error("Invite error:", error);
      toast({
        title: "Erro ao enviar convite",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, "");
    return cleaned
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCheck className="w-4 h-4 mr-2" />
          Vincular Cliente Existente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Vincular Cliente MEI Existente
          </DialogTitle>
          <DialogDescription>
            Busque e convide um cliente MEI que já está cadastrado na plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por CNPJ, nome ou razão social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-3">
            {results.length > 0 ? (
              results.map((profile) => (
                <Card key={profile.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {profile.client?.razao_social || profile.full_name}
                          </span>
                        </div>
                        {profile.client?.cnpj && (
                          <p className="text-sm text-muted-foreground">
                            CNPJ: {formatCNPJ(profile.client.cnpj)}
                          </p>
                        )}
                        {profile.client?.atividade && (
                          <p className="text-xs text-muted-foreground">
                            {profile.client.atividade}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(profile)}
                        disabled={isInviting}
                      >
                        {isInviting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Convidar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : searched && !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado</p>
                <p className="text-sm mt-1">
                  Verifique o CNPJ ou razão social e tente novamente
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Busque por CNPJ ou razão social</p>
                <p className="text-sm mt-1">
                  Encontre clientes MEI já cadastrados na plataforma
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
