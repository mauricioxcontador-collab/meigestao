import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoals } from '@/hooks/useGoals';
import { GoalForm } from '@/components/goals/GoalForm';
import { ProgressCards } from '@/components/goals/ProgressCards';
import { GoalCharts } from '@/components/goals/GoalCharts';
import { Gamification } from '@/components/goals/Gamification';
import { NotificationBell } from '@/components/goals/NotificationBell';
import { GoalsHistory } from '@/components/goals/GoalsHistory';
import { AIReport } from '@/components/goals/AIReport';
import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { Target, BarChart3, Trophy, History, Sparkles, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useUserRole } from '@/hooks/useUserRole';
import logoMeiGestao from '@/assets/logo-mei-gestao.png';

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Goals = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    currentGoal,
    progress,
    achievements,
    notifications,
    loading,
    saveGoal,
    markNotificationRead,
    getTotalPoints,
    currentMonth,
    currentYear
  } = useGoals(clientId);

  const { isContador, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isContador) {
      navigate('/contador');
      return;
    }
  }, [roleLoading, isContador, navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);

      // Fetch client data
      const { data: client } = await supabase
        .from('clients')
        .select('id, razao_social')
        .or(`mei_user_id.eq.${user.id},contador_user_id.eq.${user.id}`)
        .maybeSingle();

      if (client) {
        setClientId(client.id);
        setClientName(client.razao_social);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Sidebar */}
      <AppSidebar 
        userEmail={user?.email || ''} 
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4 ml-12 lg:ml-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <img src={logoMeiGestao} alt="MEI Gestão" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Metas e Objetivos</h1>
              <p className="text-muted-foreground">
                {monthNames[currentMonth - 1]} de {currentYear}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell 
              notifications={notifications} 
              onMarkRead={markNotificationRead} 
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 bg-transparent h-auto p-0">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <Target className="w-4 h-4 mr-2" />
              Definir Metas
            </TabsTrigger>
            <TabsTrigger 
              value="gamification" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-primary-foreground px-4 py-2 rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Relatório IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {currentGoal && progress ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <ProgressCards progress={progress} goal={currentGoal} />
                <GoalCharts progress={progress} goal={currentGoal} />
              </motion.div>
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Nenhuma meta definida</h2>
                <p className="text-muted-foreground mb-6">
                  Defina suas metas mensais para começar a acompanhar seu progresso
                </p>
                <Button 
                  onClick={() => setActiveTab('goals')}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Definir Metas
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="goals">
            <GoalForm
              currentGoal={currentGoal}
              onSave={saveGoal}
              currentMonth={currentMonth}
              currentYear={currentYear}
            />
          </TabsContent>

          <TabsContent value="gamification">
            <Gamification 
              achievements={achievements} 
              totalPoints={getTotalPoints()} 
            />
          </TabsContent>

          <TabsContent value="history">
            {clientId && <GoalsHistory clientId={clientId} />}
          </TabsContent>

          <TabsContent value="report">
            {currentGoal && progress ? (
              <AIReport 
                progress={progress} 
                goal={currentGoal} 
                clientName={clientName}
              />
            ) : (
              <div className="text-center py-16 bg-muted/30 rounded-xl">
                <Sparkles className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Defina suas metas primeiro</h2>
                <p className="text-muted-foreground">
                  Para gerar um relatório inteligente, você precisa ter metas definidas
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Goals;
