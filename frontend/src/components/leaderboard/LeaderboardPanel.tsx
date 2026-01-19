import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Crown, Flame } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000/api';
import { useAuthStore } from '@/lib/authStore';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  score: number;
  sessions: number;
  timeSpent: number;
  badge?: 'gold' | 'silver' | 'bronze';
}
interface ApiLeaderboardEntry {
  _id: string;
  rank: number;
  name: string;
  avatar?: string;
  totalPoints: number;
  sessions: number;
  avgAccuracy: number;
  totalDuration: number;
}

type Timeframe = 'week' | 'month' | 'all';
type Scope = 'global' | 'regional';

export function LeaderboardPanel() {
  const { user } = useAuthStore();
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [scope, setScope] = useState<Scope>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (tf: Timeframe, sc: Scope) => {
    setLoading(true);
    try {
      const region = user?.location?.region ? encodeURIComponent(user.location.region) : '';
      const regionParam = sc === 'regional' && region ? `&region=${region}` : '';
      const response = await fetch(`${API_URL}/auth/leaderboard?timeframe=${tf}&scope=${sc}${regionParam}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch leaderboard');

      const data = await response.json();
      const transformed: LeaderboardEntry[] = (data.leaderboard || []).map((entry: ApiLeaderboardEntry) => ({
        rank: entry.rank,
        id: entry._id,
        name: entry.name || 'Anonymous',
        avatar: entry.avatar,
        score: entry.totalPoints,
        sessions: entry.sessions,
        timeSpent: Math.round(entry.totalDuration / 60), // Convert to minutes
        badge: entry.rank <= 3 ? (['gold', 'silver', 'bronze'] as const)[entry.rank - 1] : undefined
      }));
      setLeaderboard(transformed);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard on mount and when timeframe changes
  useEffect(() => {
    fetchLeaderboard(timeframe, scope);
  }, [timeframe, scope, user?.location?.region]);

  // Auto-refresh leaderboard every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(timeframe, scope);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [timeframe]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Award className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-orange-600" />;
      default:
        return <span className="text-xs font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'gold':
        return 'from-yellow-500/10 to-yellow-400/5';
      case 'silver':
        return 'from-gray-400/10 to-gray-300/5';
      case 'bronze':
        return 'from-orange-600/10 to-orange-500/5';
      default:
        return 'from-primary/5 to-accent/5';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-background/50 backdrop-blur-sm rounded-2xl border border-primary/10 p-6 shadow-lg" style={{ willChange: 'auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-6 pb-4 border-b border-border/30"
        layout={false}
      >
        <div className="p-2.5 bg-primary/10 rounded-xl">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Leaderboard</h2>
          <p className="text-xs text-muted-foreground">
            {scope === 'regional' && user?.location?.region ? `Top in ${user.location.region}` : 'Top performers'} this {timeframe === 'week' ? 'week' : timeframe === 'month' ? 'month' : 'season'}
          </p>
        </div>
      </motion.div>

      {/* Scope & Timeframe Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between mb-4 gap-3"
      >
        {/* Scope dropdown */}
        <div className="w-[160px]">
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger className="h-9 px-3 py-1.5">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global</SelectItem>
              <SelectItem value="regional" disabled={!user?.location?.region}>My Region</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timeframe buttons */}
        <div className="flex gap-1.5">
          {(['week', 'month', 'all'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {tf === 'week' ? 'Week' : tf === 'month' ? 'Month' : 'All'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Leaderboard List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="flex-1 space-y-2 overflow-y-auto pr-2"
        layout={false}
      >
        {loading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No data</p>
          </div>
        ) : (
          leaderboard.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * idx }}
              className={`rounded-xl p-2.5 bg-gradient-to-r ${getBadgeColor(entry.badge)} border border-border/40 hover:border-primary/50 transition-all group`}
            >
              <div className="flex items-center gap-2.5">
                {/* Rank Badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.sessions} sessions</p>
                </div>

                {/* Score Badge */}
                <div className="flex-shrink-0 bg-primary/20 rounded-lg px-2.5 py-1.5 border border-primary/30">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-primary">{entry.score}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-4 pt-4 border-t border-border/30"
        layout={false}
      >
        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          Compete and climb the ranks
        </p>
      </motion.div>
    </div>
  );
}
