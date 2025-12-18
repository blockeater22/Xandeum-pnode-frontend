import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatStorage, formatPercentage } from '@/lib/format';
import { useEffect, useState, useRef } from 'react';

interface MetricCardProps {
  title: string;
  value: number | string; // Allow string for consensus version
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
  format?: 'number' | 'percentage' | 'storage';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  delay = 0,
  format = 'number',
  subtitle,
  onClick,
}: MetricCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    
    // Skip animation for string values (e.g., consensus version)
    if (typeof value === 'string') {
      setDisplayValue(0); // Not used for strings
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current = Math.min(stepValue * step, value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(interval);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value, isVisible]);

  const formattedValue = () => {
    // If value is a string, return it directly (e.g., for consensus version)
    if (typeof value === 'string') {
      return value;
    }
    
    switch (format) {
      case 'percentage':
        return formatPercentage(displayValue, 1);
      case 'storage':
        return formatStorage(displayValue);
      default:
        // For numbers, show 2 decimal places if it's a decimal, otherwise show as integer
        if (displayValue % 1 !== 0) {
          return displayValue.toFixed(2);
        }
        return Math.floor(displayValue).toLocaleString();
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'relative p-7 rounded-2xl bg-card border border-border card-glow',
        'opacity-0 translate-y-6',
        isVisible && 'animate-fade-up',
        onClick && 'cursor-pointer hover:border-primary/50 transition-colors'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="absolute top-5 right-5">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {title}
        </p>
        <p className="text-4xl font-bold text-foreground tracking-tight">
          {prefix}
          {formattedValue()}
          {suffix}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
    </div>
  );
};

export const MetricCardSkeleton = () => (
  <div className="relative p-7 rounded-2xl bg-card border border-border overflow-hidden">
    <div className="absolute top-5 right-5">
      <div className="w-11 h-11 rounded-xl shimmer" />
    </div>
    <div className="space-y-4">
      <div className="h-4 w-28 rounded shimmer" />
      <div className="h-10 w-36 rounded shimmer" />
    </div>
  </div>
);
