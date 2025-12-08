import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Achievement } from '@/hooks/useGoals';
import { Trophy, Medal, Award, Crown, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface GamificationProps {
  achievements: Achievement[];
  totalPoints: number;
}

const medalConfig = {
  bronze: {
    icon: Medal,
    color: 'text-amber-700',
    bg: 'bg-gradient-to-br from-amber-600 to-amber-800',
    glow: 'shadow-amber-500/30'
  },
  silver: {
    icon: Award,
    color: 'text-slate-400',
    bg: 'bg-gradient-to-br from-slate-300 to-slate-500',
    glow: 'shadow-slate-400/30'
  },
  gold: {
    icon: Trophy,
    color: 'text-yellow-500',
    bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    glow: 'shadow-yellow-500/30'
  },
  platinum: {
    icon: Crown,
    color: 'text-purple-400',
    bg: 'bg-gradient-to-br from-purple-400 to-indigo-600',
    glow: 'shadow-purple-500/30'
  }
};

const ranks = [
  { name: 'Iniciante', minPoints: 0, maxPoints: 99 },
  { name: 'Empreendedor', minPoints: 100, maxPoints: 299 },
  { name: 'Empresário', minPoints: 300, maxPoints: 599 },
  { name: 'Mestre', minPoints: 600, maxPoints: 999 },
  { name: 'Lenda', minPoints: 1000, maxPoints: Infinity }
];

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const Gamification = ({ achievements, totalPoints }: GamificationProps) => {
  const currentRank = ranks.find(r => totalPoints >= r.minPoints && totalPoints <= r.maxPoints) || ranks[0];
  const nextRank = ranks[ranks.indexOf(currentRank) + 1];
  const progressToNextRank = nextRank 
    ? ((totalPoints - currentRank.minPoints) / (nextRank.minPoints - currentRank.minPoints)) * 100 
    : 100;

  const medalCounts = {
    bronze: achievements.filter(a => a.type === 'bronze').length,
    silver: achievements.filter(a => a.type === 'silver').length,
    gold: achievements.filter(a => a.type === 'gold').length,
    platinum: achievements.filter(a => a.type === 'platinum').length
  };

  return (
    <div className="space-y-6">
      {/* Rank Card */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <motion.div 
              className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Star className="w-12 h-12 text-primary-foreground" />
            </motion.div>
            
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Seu Ranking</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {currentRank.name}
              </h2>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-xl font-semibold">{totalPoints} pontos</span>
              </div>
              
              {nextRank && (
                <div className="mt-4 max-w-sm">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Próximo: {nextRank.name}</span>
                    <span>{nextRank.minPoints - totalPoints} pts restantes</span>
                  </div>
                  <Progress value={progressToNextRank} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medal Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(medalConfig) as Array<keyof typeof medalConfig>).map((type) => {
          const config = medalConfig[type];
          const Icon = config.icon;
          const count = medalCounts[type];

          return (
            <motion.div
              key={type}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className={`border-0 shadow-lg ${config.glow} shadow-xl cursor-pointer`}>
                <CardContent className="p-4 flex flex-col items-center">
                  <div className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center mb-2`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {achievements.slice(0, 5).map((achievement, index) => {
                const config = medalConfig[achievement.type];
                const Icon = config.icon;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        Meta de {achievement.goal_type === 'revenue' ? 'Faturamento' : achievement.goal_type === 'profit' ? 'Lucro' : 'Vendas'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {monthNames[achievement.month - 1]} {achievement.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primary">+{achievement.points} pts</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
