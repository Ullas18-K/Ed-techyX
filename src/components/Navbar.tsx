import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

interface NavbarProps {
  onProfileClick: (anchor: { x: number; y: number; width: number; height: number }) => void;
}

export function Navbar({ onProfileClick }: NavbarProps) {
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative z-50 w-full flex items-center justify-between px-4 py-2">
      {/* Logo - Independent, no navbar styling */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0 }}
        className="flex-shrink-0"
      >
        <img 
          src="/EduVerse.-removebg-preview.png" 
          alt="EduVerse Logo" 
          className="h-12 md:h-16 lg:h-20 w-auto object-contain will-change-auto"
          loading="eager"
        />
      </motion.div>

      {/* Profile and Logout buttons - Top right */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0 }}
        className="flex items-center gap-2"
      >
      {/* Profile Button with Avatar */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onProfileClick({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        }}
        className="h-11 px-3 rounded-xl glass-card hover:glass-strong flex items-center gap-2 transition-all shadow-lg"
        aria-label="Profile"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-lg object-cover" />
          ) : (
            getInitials(user?.name || 'U')
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">{user?.name || 'User'}</span>
      </motion.button>

      {/* Logout Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleLogout}
        className="px-4 h-11 rounded-xl glass-card hover:glass-strong flex items-center gap-2 transition-all shadow-lg"
        aria-label="Logout"
      >
        <LogOut className="w-4 h-4 text-destructive" />
        <span className="text-sm font-semibold text-destructive">Logout</span>
      </motion.button>
      </motion.div>
    </div>
  );
}
