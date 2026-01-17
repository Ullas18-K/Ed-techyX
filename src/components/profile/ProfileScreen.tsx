import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { User, Mail, Calendar, Settings, Bell, Globe, LogOut, Edit2, Check, X, Clock, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/lib/authStore';
import { toast } from 'sonner';

interface ProfileScreenProps {
  onClose: () => void;
  anchor?: { x: number; y: number; width: number; height: number };
}

export function ProfileScreen({ onClose, anchor }: ProfileScreenProps) {
  const { user, updateProfile, logout, fetchSimulationHistory } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedBio, setEditedBio] = useState(user?.bio || '');
  const [country, setCountry] = useState(user?.location?.country || '');
  const [region, setRegion] = useState(user?.location?.region || '');
  const [city, setCity] = useState(user?.location?.city || '');
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    fetchSimulationHistory();
  }, [fetchSimulationHistory]);

  if (!user) return null;

  const handleSave = () => {
    updateProfile({
      name: editedName,
      bio: editedBio,
    });
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedName(user.name);
    setEditedBio(user.bio || '');
    setCountry(user.location?.country || '');
    setRegion(user.location?.region || '');
    setCity(user.location?.city || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
          const res = await fetch(url, {
            headers: {
              // Some providers require a referer; browsers set UA automatically
            }
          });
          const data = await res.json();
          const addr = data.address || {};
          const newCountry = (addr.country_code?.toUpperCase()) || addr.country || '';
          const newRegion = addr.state || addr.region || addr.county || '';
          const newCity = addr.city || addr.town || addr.village || addr.municipality || '';

          setCountry(newCountry);
          setRegion(newRegion);
          setCity(newCity);

          await updateProfile({ location: { country: newCountry, region: newRegion, city: newCity } });
          toast.success('Location detected and saved');
        } catch (e) {
          console.error('Reverse geocoding failed', e);
          toast.error('Failed to resolve location');
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        console.error('Geolocation error', err);
        toast.error(err.message || 'Location permission denied');
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Compute transform origin and entry offset so the panel appears to expand from the trigger
  const { originX, originY, offsetX, offsetY } = useMemo(() => {
    if (anchor && typeof window !== 'undefined') {
      const centerX = anchor.x + anchor.width / 2;
      const centerY = anchor.y + anchor.height / 2;
      return {
        originX: centerX / window.innerWidth,
        originY: centerY / window.innerHeight,
        offsetX: centerX - window.innerWidth / 2,
        offsetY: centerY - window.innerHeight / 2,
      };
    }
    return { originX: 0.9, originY: 0.1, offsetX: 0, offsetY: -30 };
  }, [anchor]);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="min-h-screen p-4 md:p-8"
          initial={{ scale: 0.9, opacity: 0, x: offsetX, y: offsetY }}
          animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, x: 0, y: -10 }}
          style={{ transformOrigin: `${originX * 100}% ${originY * 100}%`, willChange: 'transform, opacity' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32, mass: 0.8 }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
              </div>
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Sidebar - Profile Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="md:col-span-1"
              >
                <div className="glass-card rounded-2xl p-6 border border-primary/20 sticky top-4">
                  {/* Avatar */}
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-xl shadow-primary/30 flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    {!isEditing && (
                      <>
                        <h2 className="text-xl font-bold text-foreground mb-1">{user.name}</h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">Joined {formatDate(user.joinedDate)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </motion.div>

              {/* Right Content - Profile Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2 space-y-6"
              >
                {/* Personal Information */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                        />
                      ) : (
                        <p className="text-foreground p-2 bg-muted/30 rounded-lg">{user.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <p className="text-muted-foreground text-sm p-2 bg-muted/30 rounded-lg">{user.email}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      {isEditing ? (
                        <Textarea
                          id="bio"
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      ) : (
                        <p className="text-foreground p-2 bg-muted/30 rounded-lg min-h-[60px]">
                          {user.bio || 'No bio added yet'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-2 mb-6">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Preferences</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Notifications</p>
                          <p className="text-xs text-muted-foreground">Receive learning updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={user.preferences.notifications}
                        onCheckedChange={(checked) => 
                          updateProfile({
                            preferences: { ...user.preferences, notifications: checked }
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Language</p>
                          <p className="text-xs text-muted-foreground">English (US)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-foreground">Location</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleUseCurrentLocation} disabled={locLoading}>
                        {locLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
                        Use my current location
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                      <Button size="sm" onClick={() => {
                        updateProfile({ location: { country, region, city } });
                        toast.success('Location updated');
                      }} disabled={!country && !region && !city}>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g., US" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Region / State</Label>
                      <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="e.g., California" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., San Francisco" />
                    </div>
                  </div>

                  {user.location?.region || user.location?.country ? (
                    <p className="text-xs text-muted-foreground mt-3">Current: {user.location?.city ? user.location.city + ', ' : ''}{user.location?.region || ''}{user.location?.country ? `, ${user.location.country}` : ''}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">Set your location to see regional leaderboards.</p>
                  )}
                </div>

                {/* Account Stats */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Learning Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{user.learningStats?.sessions || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Sessions</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{user.learningStats?.questionsAsked || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Questions</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-primary">{Math.round((user.learningStats?.totalTimeSpent || 0) / 60)}h</p>
                      <p className="text-xs text-muted-foreground mt-1">Time</p>
                    </div>
                  </div>
                </div>

                {/* Simulation History */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Recent Simulations</h3>
                  </div>
                  {user.simulationHistory && user.simulationHistory.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {user.simulationHistory.slice(0, 10).map((item, idx) => (
                        <div key={`${item.timestamp}-${idx}`} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-sm font-medium text-foreground line-clamp-2">{item.query}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.timestamp).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No simulations yet. Ask something from home to see it here.</p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
