import { RefreshCw, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface HeaderProps {
  lastUpdated: Date;
  onRefresh: () => void;
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
  networkHealth: 'healthy' | 'degraded' | 'critical';
  isLoading: boolean;
}

export const Header = ({
  lastUpdated,
  onRefresh,
  autoRefresh,
  onAutoRefreshChange,
  networkHealth,
  isLoading,
}: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timeSince, setTimeSince] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSince(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const healthColors = {
    healthy: 'bg-primary text-primary-foreground',
    degraded: 'bg-warning text-warning-foreground',
    critical: 'bg-destructive text-destructive-foreground',
  };

  const healthLabels = {
    healthy: 'Network Healthy',
    degraded: 'Degraded',
    critical: 'Critical',
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-16 border-b transition-all duration-300',
        scrolled ? 'glass shadow-elevated' : 'bg-background/50 backdrop-blur-sm border-transparent'
      )}
    >
      <div className="container h-full flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden p-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="w-full h-full text-primary-foreground"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none tracking-tight">Xandeum</h1>
              <p className="text-xs text-muted-foreground leading-none mt-1">pNode Explorer</p>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-4">
          {/* Network Health Badge */}
          <div
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all',
              healthColors[networkHealth]
            )}
          >
            <span className={cn('w-2 h-2 rounded-full bg-current pulse-glow')} />
            {healthLabels[networkHealth]}
          </div>

          {/* Last Updated */}
          <span className="text-xs text-muted-foreground hidden sm:block">
            Updated {timeSince}s ago
          </span>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="hover:bg-secondary transition-transform hover:scale-105 active:scale-95"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>

          {/* Auto-refresh Toggle */}
          <div className="flex items-center gap-2 hidden md:flex">
            <span className="text-xs text-muted-foreground">Auto</span>
            <Switch
              checked={autoRefresh}
              onCheckedChange={onAutoRefreshChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hover:bg-secondary transition-transform hover:scale-105 active:scale-95"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
