import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

export function HistoryPanel() {
  const { user, fetchSimulationHistory } = useAuthStore();

  useEffect(() => {
    fetchSimulationHistory();
  }, [fetchSimulationHistory]);

  if (!user) return null;

  const recentHistory = useMemo(() => {
    return user.simulationHistory?.slice(0, 8) || [];
  }, [user.simulationHistory]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateQuery = (query: string, maxLength: number = 50) => {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
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
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Recent History</h2>
          <p className="text-xs text-muted-foreground">Your latest simulations</p>
        </div>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex-1 space-y-2 overflow-y-auto pr-2"
        layout={false}
      >
        {recentHistory.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No history yet</p>
              <p className="text-xs text-muted-foreground/60">Start a simulation to see your history</p>
            </div>
          </div>
        ) : (
          recentHistory.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.03 * idx }}
              className="group p-3 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 border border-border/40 hover:border-primary/30 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary/70 group-hover:bg-primary transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors cursor-help" title={item.query}>
                    {truncateQuery(item.query)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(item.timestamp || '')}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    toast.success('Cleared from history');
                  }}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all"
                  title="Remove from history"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Footer Stats */}
      {recentHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="mt-4 pt-4 border-t border-border/30"
          layout={false}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-xs text-muted-foreground">Total Sessions</p>
              <p className="text-lg font-bold text-primary">{recentHistory.length}</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
              <p className="text-xs text-muted-foreground">Last Active</p>
              <p className="text-xs font-semibold text-foreground">
                {formatTime(recentHistory[0]?.timestamp || '')}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
