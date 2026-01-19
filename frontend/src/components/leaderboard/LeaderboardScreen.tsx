import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, X, Award, Clock, Flame } from 'lucide-react';

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

interface LeaderboardScreenProps {
  onClose: () => void;
  anchor?: { x: number; y: number; width: number; height: number };
}

export function LeaderboardScreen({ onClose, anchor }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');

  const { originX, originY, offsetX, offsetY } = {
    originX: anchor?.x ? (anchor.x + anchor.width / 2) / window.innerWidth : 0.95,
    originY: anchor?.y ? (anchor.y + anchor.height / 2) / window.innerHeight : 0.15,
    offsetX: anchor?.x ? anchor.x + anchor.width / 2 - window.innerWidth / 2 : 0,
    offsetY: anchor?.y ? anchor.y + anchor.height / 2 - window.innerHeight / 2 : -20,
  };

  useEffect(() => {
    // Mock leaderboard data - replace with API call
    const mockData: LeaderboardEntry[] = [
      {
        rank: 1,
        id: '1',
        name: 'Alex Chen',
        score: 2450,
        sessions: 45,
        timeSpent: 1200,
        badge: 'gold',
      },
      {
        rank: 2,
        id: '2',
        name: 'Sarah Smith',
        score: 2180,
        sessions: 38,
        timeSpent: 980,
        badge: 'silver',
      },
      {
        rank: 3,
        id: '3',
        name: 'Michael Brown',
        score: 1950,
        sessions: 32,
        timeSpent: 850,
        badge: 'bronze',
      },
      {
        rank: 4,
        id: '4',
        name: 'Emily Davis',
        score: 1820,
        sessions: 28,
        timeSpent: 750,
      },
      {
        rank: 5,
        id: '5',
        name: 'James Wilson',
        score: 1650,
        sessions: 25,
        timeSpent: 680,
      },
      {
        rank: 6,
        id: '6',
        name: 'Lisa Anderson',
        score: 1520,
        sessions: 22,
        timeSpent: 610,
      },
      {
        rank: 7,
        id: '7',
        name: 'David Martinez',
        score: 1380,
        sessions: 19,
        timeSpent: 540,
      },
      {
        rank: 8,
        id: '8',
        name: 'Jessica Taylor',
        score: 1250,
        sessions: 16,
        timeSpent: 480,
      },
      {
        rank: 9,
        id: '9',
        name: 'Chris Johnson',
        score: 1100,
        sessions: 13,
        timeSpent: 420,
      },
      {
        rank: 10,
        id: '10',
        name: 'Rachel White',
        score: 950,
        sessions: 10,
        timeSpent: 360,
      },
    ];

    setLeaderboard(mockData);
    setLoading(false);
  }, [timeframe]);

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'gold':
        return 'from-yellow-500/20 to-orange-500/10';
      case 'silver':
        return 'from-slate-300/20 to-slate-400/10';
      case 'bronze':
        return 'from-amber-600/20 to-amber-700/10';
      default:
        return 'from-blue-500/10 to-purple-500/5';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Award className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        className="fixed inset-0 bg-background/40 backdrop-blur-md z-50 flex items-end justify-end p-4 md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card rounded-3xl p-6 border border-primary/20 shadow-xl w-full md:w-96 max-h-[80vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          style={{ willChange: 'transform, opacity' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Leaderboard</h2>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </motion.div>

            {/* Timeframe Filter - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-1.5 mb-4"
            >
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
            </motion.div>

            {/* Leaderboard List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 max-h-96 overflow-y-auto pr-2"
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
                    className={`rounded-xl p-2.5 bg-gradient-to-r ${getBadgeColor(
                      entry.badge
                    )} border border-border/40 hover:border-primary/50 transition-all group`}
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
              transition={{ delay: 0.3 }}
              className="mt-4 pt-4 border-t border-border/30"
            >
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                Compete and climb the ranks
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
