import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MapFiltersProps {
  showOnlineOnly: boolean;
  onShowOnlineOnlyChange: (value: boolean) => void;
  healthTierFilter: 'all' | 'Excellent' | 'Good' | 'Poor';
  onHealthTierFilterChange: (value: 'all' | 'Excellent' | 'Good' | 'Poor') => void;
  versionFilter: string;
  onVersionFilterChange: (value: string) => void;
  versions: string[];
  enableClustering: boolean;
  onEnableClusteringChange: (value: boolean) => void;
  onClose?: () => void;
}

export const MapFilters = ({
  showOnlineOnly,
  onShowOnlineOnlyChange,
  healthTierFilter,
  onHealthTierFilterChange,
  versionFilter,
  onVersionFilterChange,
  versions,
  enableClustering,
  onEnableClusteringChange,
  onClose,
}: MapFiltersProps) => {
  const hasActiveFilters = showOnlineOnly || healthTierFilter !== 'all' || versionFilter !== 'all';

  // Health tier toggles
  const showExcellent = healthTierFilter === 'Excellent';
  const showGood = healthTierFilter === 'Good';
  const showPoor = healthTierFilter === 'Poor';

  const handleHealthTierToggle = (tier: 'Excellent' | 'Good' | 'Poor', enabled: boolean) => {
    if (enabled) {
      onHealthTierFilterChange(tier);
    } else {
      onHealthTierFilterChange('all');
    }
  };

  return (
    <div className="bg-elevated/95 backdrop-blur-sm border border-border rounded-lg p-4 space-y-4 min-w-[220px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => {
            if (hasActiveFilters) {
              onShowOnlineOnlyChange(false);
              onHealthTierFilterChange('all');
              onVersionFilterChange('all');
            }
            onClose?.();
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Online Only Toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="online-only" className="text-xs text-foreground cursor-pointer">
          Online Only
        </Label>
        <Switch
          id="online-only"
          checked={showOnlineOnly}
          onCheckedChange={onShowOnlineOnlyChange}
        />
      </div>

      {/* Health Tier Toggles */}
      <div className="space-y-2">
        <Label className="text-xs text-foreground font-medium">Health Tier</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="tier-excellent" className="text-xs text-muted-foreground cursor-pointer">
              Excellent (≥90)
            </Label>
            <Switch
              id="tier-excellent"
              checked={showExcellent}
              onCheckedChange={(checked) => handleHealthTierToggle('Excellent', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tier-good" className="text-xs text-muted-foreground cursor-pointer">
              Good (75-89)
            </Label>
            <Switch
              id="tier-good"
              checked={showGood}
              onCheckedChange={(checked) => handleHealthTierToggle('Good', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tier-poor" className="text-xs text-muted-foreground cursor-pointer">
              Poor (&lt;75)
            </Label>
            <Switch
              id="tier-poor"
              checked={showPoor}
              onCheckedChange={(checked) => handleHealthTierToggle('Poor', checked)}
            />
          </div>
        </div>
      </div>

      {/* Version Filter - Keep as dropdown for multiple versions */}
      {versions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-foreground font-medium">Version</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between text-xs h-8 bg-secondary/50"
              >
                {versionFilter === 'all' ? 'All Versions' : versionFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-elevated border-border max-h-[200px] overflow-y-auto">
              <DropdownMenuItem onSelect={() => onVersionFilterChange('all')}>
                All Versions
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {versions.map((version) => (
                <DropdownMenuItem
                  key={version}
                  onSelect={() => onVersionFilterChange(version)}
                >
                  {version}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Clustering Toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Label htmlFor="clustering" className="text-xs text-foreground cursor-pointer">
          Clustering
        </Label>
        <Switch
          id="clustering"
          checked={enableClustering}
          onCheckedChange={onEnableClusteringChange}
        />
      </div>
    </div>
  );
};

