import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, Trophy, ChevronDown, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/authStore';
import { useTranslationStore } from '@/lib/translationStore';
import { Translate } from '@/components/Translate';
import { toast } from 'sonner';
import { HistoryPanel } from '@/components/history/HistoryPanel';
import { LeaderboardPanel } from '@/components/leaderboard/LeaderboardPanel';

interface NavbarProps {
  onProfileClick: (anchor: { x: number; y: number; width: number; height: number }) => void;
}

export function Navbar({ onProfileClick }: NavbarProps) {
  const { logout, user } = useAuthStore();
  const { currentLanguage, setLanguage } = useTranslationStore();
  const [openDropdown, setOpenDropdown] = useState<'history' | 'leaderboard' | 'language' | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  console.log('Navbar Render - Language:', currentLanguage, 'Dropdown:', openDropdown);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-4 pointer-events-none">
      {/* Floating Navbar Container */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`flex items-center gap-2 md:gap-3 px-2 py-2.5 rounded-full pointer-events-auto transition-all duration-300 relative z-10 ${isScrolled
          ? 'glass-card shadow-lg backdrop-blur-xl'
          : 'glass-card/70 shadow-md backdrop-blur-md'
          }`}
      >
        {/* Logo */}
        <div className="px-3 py-1.5 rounded-full flex-shrink-0">
          <img
            src="/EduVerse.-removebg-preview.png"
            alt="EduVerse Logo"
            className="h-8 md:h-10 w-auto object-contain"
            loading="eager"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        {/* Navigation Items */}
        <div className="hidden sm:flex items-center gap-1">
          {/* History Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpenDropdown(openDropdown === 'history' ? null : 'history')}
              className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
            >
              <Clock className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="hidden md:inline"><Translate>History</Translate></span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${openDropdown === 'history' ? 'rotate-180' : ''
                  }`}
              />
            </motion.button>

            {/* History Dropdown Content */}
            <AnimatePresence>
              {openDropdown === 'history' && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full left-0 mt-2 w-80 bg-background/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="max-h-96 overflow-y-auto">
                    <HistoryPanel />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Leaderboard Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpenDropdown(openDropdown === 'leaderboard' ? null : 'leaderboard')}
              className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
            >
              <Trophy className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="hidden md:inline"><Translate>Leaderboard</Translate></span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${openDropdown === 'leaderboard' ? 'rotate-180' : ''
                  }`}
              />
            </motion.button>

            {/* Leaderboard Dropdown Content */}
            <AnimatePresence>
              {openDropdown === 'leaderboard' && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-2 w-96 bg-background/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="max-h-96 overflow-y-auto">
                    <LeaderboardPanel />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('Toggle Language Dropdown', openDropdown === 'language' ? 'close' : 'open');
                setOpenDropdown(openDropdown === 'language' ? null : 'language');
              }}
              className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group pointer-events-auto"
            >
              <Globe className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span className="hidden md:inline">
                {currentLanguage === 'en' ? 'English' :
                  currentLanguage === 'hi' ? 'Hindi' :
                    currentLanguage === 'kn' ? 'Kannada' : 'Malayalam'}
              </span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-300 ${openDropdown === 'language' ? 'rotate-180' : ''
                  }`}
              />
            </motion.button>

            <AnimatePresence>
              {openDropdown === 'language' && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute top-full right-0 mt-2 w-40 bg-background/95 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-xl overflow-hidden pointer-events-auto z-[100]"
                >
                  <div className="py-1">
                    {[
                      { code: 'en', label: 'English' },
                      { code: 'hi', label: 'Hindi' },
                      { code: 'kn', label: 'Kannada' },
                      { code: 'ml', label: 'Malayalam' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLanguage(lang.code);
                          setOpenDropdown(null);
                          toast.success(`Language changed to ${lang.label}`);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${currentLanguage === lang.code ? 'text-primary font-bold' : 'text-foreground'
                          }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        {/* Profile and Logout buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 ml-auto">
          {/* Profile Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onProfileClick({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
            }}
            className="px-2.5 md:px-3 py-2 rounded-full glass-card hover:glass-strong flex items-center gap-2 transition-all"
            aria-label="Profile"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-lg object-cover" />
              ) : (
                getInitials(user?.name || 'U')
              )}
            </div>
            <span className="text-xs md:text-sm font-medium text-foreground hidden md:block">{user?.name || 'User'}</span>
          </motion.button>

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-2.5 md:px-3 py-2 rounded-full glass-card hover:glass-strong flex items-center gap-1.5 md:gap-2 transition-all"
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-destructive flex-shrink-0" />
            <span className="text-xs md:text-sm font-semibold text-destructive hidden md:block"><Translate>Logout</Translate></span>
          </motion.button>
        </div>
      </motion.div>

      {/* Close dropdown when clicking outside */}
      {openDropdown && (
        <div
          className="fixed inset-0 pointer-events-auto z-0"
          onClick={() => {
            console.log('Backdrop Clicked - Closing Dropdown');
            setOpenDropdown(null);
          }}
        />
      )}
    </div>
  );
}
