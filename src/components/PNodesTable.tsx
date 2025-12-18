import { useState, useMemo, useCallback } from 'react';
import { Search, Filter, Copy, Check, ChevronDown, ArrowUp, ArrowDown, Columns } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatStorage, calculatePercentage, formatRelativeTime, shortenPubkey } from '@/lib/format';
import type { PNode } from '@/hooks/usePNodes';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

interface PNodesTableProps {
  pnodes: PNode[];
  isLoading: boolean;
  onSelectNode: (node: PNode) => void;
}

type SortField = 'pubkey' | 'storageUsed' | 'lastSeen' | 'status' | 'healthScore' | 'storageUtilization' | 'tier' | 'version' | 'region' | 'ramUsed' | 'ramUtilization';
type SortDirection = 'asc' | 'desc';

type ColumnKey = 'pubkey' | 'status' | 'healthScore' | 'tier' | 'storageUsed' | 'storageUtilization' | 'ramUsed' | 'ramUtilization' | 'version' | 'region' | 'lastSeen';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
  responsiveClass?: string; // For responsive visibility
}


const StatusBadge = ({ status }: { status: PNode['status'] }) => {
  const styles = {
    online: 'text-primary',
    offline: 'text-destructive',
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn('status-dot', styles[status])} />
      <span className="capitalize text-sm">{status}</span>
    </div>
  );
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-secondary rounded transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  );
};

// Column configuration
const COLUMN_CONFIG: ColumnConfig[] = [
  { key: 'pubkey', label: 'pNode ID', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'healthScore', label: 'Health Score', defaultVisible: true },
  { key: 'tier', label: 'Tier', defaultVisible: true, responsiveClass: 'hidden xl:table-cell' },
  { key: 'storageUsed', label: 'Storage', defaultVisible: true },
  { key: 'storageUtilization', label: 'Storage Util %', defaultVisible: true, responsiveClass: 'hidden lg:table-cell' },
  { key: 'ramUsed', label: 'RAM', defaultVisible: true },
  { key: 'ramUtilization', label: 'RAM Util %', defaultVisible: true, responsiveClass: 'hidden lg:table-cell' },
  { key: 'version', label: 'Version', defaultVisible: true, responsiveClass: 'hidden lg:table-cell' },
  { key: 'region', label: 'Region', defaultVisible: true, responsiveClass: 'hidden md:table-cell' },
  { key: 'lastSeen', label: 'Last Seen', defaultVisible: true },
];

export const PNodesTable = ({ pnodes, isLoading, onSelectNode }: PNodesTableProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PNode['status'] | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'Excellent' | 'Good' | 'Poor'>('all');
  const [sortField, setSortField] = useState<SortField>('healthScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Column visibility state - initialize with default visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(() => {
    const initial: Record<ColumnKey, boolean> = {} as Record<ColumnKey, boolean>;
    COLUMN_CONFIG.forEach(col => {
      initial[col.key] = col.defaultVisible;
    });
    return initial;
  });

  // Toggle column visibility
  const toggleColumn = useCallback((columnKey: ColumnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  // Extract RAM data from all nodes (already included in API response from Redis)
  // Use useMemo to create the map from pnodes, not paginatedNodes, to avoid circular dependency
  const nodeRamData = useMemo(() => {
    const ramMap = new Map<string, { used: number; total: number }>();
    
    pnodes.forEach((node) => {
      if (node.ramUsed !== undefined && node.ramTotal !== undefined) {
        ramMap.set(node.pubkey, { used: node.ramUsed, total: node.ramTotal });
      }
    });
    
    return ramMap;
  }, [pnodes]);

  const filteredAndSorted = useMemo(() => {
    let result = [...pnodes];

    // Filter by search - search across multiple fields including IP
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter((node) => {
        const pubkey = (node.pubkey || '').toLowerCase();
        const region = (node.region || '').toLowerCase();
        const version = (node.version || '').toLowerCase();
        const ip = (node.ip || '').toLowerCase();
        
        const matches = (
          pubkey.includes(searchLower) ||
          region.includes(searchLower) ||
          version.includes(searchLower) ||
          ip.includes(searchLower)
        );
        
        return matches;
      });
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((node) => {
        const matches = node.status === statusFilter;
        return matches;
      });
    }

    // Filter by tier
    if (tierFilter !== 'all') {
      result = result.filter((node) => {
        return node.tier === tierFilter;
      });
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'storageUsed': {
          // Calculate utilization percentage, handle division by zero
          const aUtil = a.storageTotal > 0 ? (a.storageUsed / a.storageTotal) : 0;
          const bUtil = b.storageTotal > 0 ? (b.storageUsed / b.storageTotal) : 0;
          comparison = aUtil - bUtil;
          break;
        }
        case 'lastSeen': {
          // Ensure lastSeen is a Date object
          try {
            const aTime = a.lastSeen instanceof Date ? a.lastSeen.getTime() : new Date(a.lastSeen).getTime();
            const bTime = b.lastSeen instanceof Date ? b.lastSeen.getTime() : new Date(b.lastSeen).getTime();
            comparison = aTime - bTime;
          } catch (error) {
            comparison = 0;
          }
          break;
        }
        case 'status': {
          const statusOrder: Record<PNode['status'], number> = { online: 0, offline: 1 };
          comparison = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2);
          break;
        }
        case 'healthScore':
          comparison = (a.healthScore || 0) - (b.healthScore || 0);
          break;
        case 'storageUtilization': {
          const aUtil = a.storageUtilization ?? (a.storageTotal > 0 ? (a.storageUsed / a.storageTotal) * 100 : 0);
          const bUtil = b.storageUtilization ?? (b.storageTotal > 0 ? (b.storageUsed / b.storageTotal) * 100 : 0);
          comparison = aUtil - bUtil;
          break;
        }
        case 'pubkey':
          comparison = (a.pubkey || '').localeCompare(b.pubkey || '');
          break;
        case 'tier': {
          const tierOrder: Record<string, number> = { 'Excellent': 0, 'Good': 1, 'Poor': 2 };
          const aTier = a.tier || '';
          const bTier = b.tier || '';
          comparison = (tierOrder[aTier] ?? 3) - (tierOrder[bTier] ?? 3);
          break;
        }
        case 'version':
          comparison = (a.version || '').localeCompare(b.version || '');
          break;
        case 'region':
          comparison = (a.region || '').localeCompare(b.region || '');
          break;
        case 'ramUsed': {
          const aRam = nodeRamData.get(a.pubkey);
          const bRam = nodeRamData.get(b.pubkey);
          const aRamUsed = aRam?.used ?? 0;
          const bRamUsed = bRam?.used ?? 0;
          comparison = aRamUsed - bRamUsed;
          break;
        }
        case 'ramUtilization': {
          const aRam = nodeRamData.get(a.pubkey);
          const bRam = nodeRamData.get(b.pubkey);
          const aUtil = aRam && aRam.total > 0 ? (aRam.used / aRam.total) * 100 : 0;
          const bUtil = bRam && bRam.total > 0 ? (bRam.used / bRam.total) * 100 : 0;
          comparison = aUtil - bUtil;
          break;
        }
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Deduplicate by pubkey (keep first occurrence)
    const seen = new Set<string>();
    const deduplicated = result.filter((node) => {
      if (seen.has(node.pubkey)) {
        return false;
      }
      seen.add(node.pubkey);
      return true;
    });

    return deduplicated;
  }, [pnodes, search, statusFilter, tierFilter, sortField, sortDirection, nodeRamData]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNodes = filteredAndSorted.slice(startIndex, endIndex);

  // Helper function to handle column header click for sorting
  // Memoize to prevent unnecessary re-renders
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort
  }, [sortField, sortDirection]);

  // Sortable header component
  // Always renders icon to prevent layout shift when sorting
  const SortableHeader = ({ field, children, className = '', style }: { field: SortField; children: React.ReactNode; className?: string; style?: React.CSSProperties }) => {
    const isActive = sortField === field;
    return (
      <th 
        className={cn(
          'group text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none',
          className
        )}
        style={style}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-2">
          <span>{children}</span>
          {/* Icon container ALWAYS exists to prevent layout shift */}
          <span className={cn(
            'w-3 h-3 flex items-center justify-center transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
          )}>
            {isActive ? (
              sortDirection === 'asc' ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )
            ) : (
              <ArrowUp className="w-3 h-3" />
            )}
          </span>
        </div>
      </th>
    );
  };

  // Reset to page 1 when filters change
  // Memoize to prevent infinite re-renders in dropdown menus
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Memoize dropdown handlers to prevent infinite re-renders
  const handleStatusFilter = useCallback((status: PNode['status'] | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleTierFilter = useCallback((tier: 'all' | 'Excellent' | 'Good' | 'Poor') => {
    setTierFilter(tier);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field: SortField, direction: SortDirection = 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setCurrentPage(1);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4">
          <div className="h-10 w-64 rounded shimmer" />
          <div className="h-10 w-32 rounded shimmer" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex gap-4">
              <div className="h-5 w-24 rounded shimmer" />
              <div className="h-5 w-16 rounded shimmer" />
              <div className="h-5 w-20 rounded shimmer" />
              <div className="h-5 w-28 rounded shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Controls */}
      <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, IP, region, or version..."
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                handleFilterChange();
              }}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>

          {/* Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-secondary/50">
                <Filter className="w-4 h-4" />
                {statusFilter === 'all' ? 'All Status' : statusFilter}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-elevated border-border">
              <DropdownMenuItem onSelect={() => handleStatusFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusFilter('online')}>Online</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleStatusFilter('offline')}>Offline</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tier Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-secondary/50">
                <Filter className="w-4 h-4" />
                {tierFilter === 'all' ? 'All Tiers' : tierFilter}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-elevated border-border">
              <DropdownMenuItem onSelect={() => handleTierFilter('all')}>All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleTierFilter('Excellent')}>Excellent</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleTierFilter('Good')}>Good</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleTierFilter('Poor')}>Poor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-secondary/50">
                <Columns className="w-4 h-4" />
                Columns
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-elevated border-border w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Toggle Columns</div>
              <DropdownMenuSeparator />
              {COLUMN_CONFIG.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={columnVisibility[column.key]}
                  onCheckedChange={() => toggleColumn(column.key)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-secondary/50">
                Sort: {sortField}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-elevated border-border">
              <DropdownMenuItem onSelect={() => handleSortChange('storageUsed', 'desc')}>
                Storage (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('lastSeen', 'desc')}>
                Last Seen (Recent)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('status', 'asc')}>
                Status (Online First)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('healthScore', 'desc')}>
                Health Score (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('healthScore', 'asc')}>
                Health Score (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('storageUtilization', 'desc')}>
                Storage Utilization (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('storageUtilization', 'asc')}>
                Storage Utilization (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('ramUsed', 'desc')}>
                RAM Used (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('ramUsed', 'asc')}>
                RAM Used (Low to High)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('ramUtilization', 'desc')}>
                RAM Utilization (High to Low)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleSortChange('ramUtilization', 'asc')}>
                RAM Utilization (Low to High)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="text-sm text-muted-foreground">
          {filteredAndSorted.length} nodes
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky top-0 z-50">
            <tr className="border-b border-border bg-secondary/95 backdrop-blur-sm">
              <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ width: '80px' }}>
                Sr No.
              </th>
              {columnVisibility.pubkey && (
                <SortableHeader field="pubkey" style={{ width: '180px' }}>pNode ID</SortableHeader>
              )}
              {columnVisibility.status && (
                <SortableHeader field="status" style={{ width: '100px' }}>Status</SortableHeader>
              )}
              {columnVisibility.healthScore && (
                <SortableHeader field="healthScore" style={{ width: '120px' }}>Health Score</SortableHeader>
              )}
              {columnVisibility.tier && (
                <SortableHeader field="tier" className={COLUMN_CONFIG.find(c => c.key === 'tier')?.responsiveClass} style={{ width: '120px' }}>Tier</SortableHeader>
              )}
              {columnVisibility.storageUsed && (
                <SortableHeader field="storageUsed" style={{ width: '200px' }}>Storage</SortableHeader>
              )}
              {columnVisibility.storageUtilization && (
                <SortableHeader field="storageUtilization" className={COLUMN_CONFIG.find(c => c.key === 'storageUtilization')?.responsiveClass} style={{ width: '130px' }}>Storage Util %</SortableHeader>
              )}
              {columnVisibility.ramUsed && (
                <SortableHeader field="ramUsed" style={{ width: '200px' }}>RAM</SortableHeader>
              )}
              {columnVisibility.ramUtilization && (
                <SortableHeader field="ramUtilization" className={COLUMN_CONFIG.find(c => c.key === 'ramUtilization')?.responsiveClass} style={{ width: '130px' }}>RAM Util %</SortableHeader>
              )}
              {columnVisibility.version && (
                <SortableHeader field="version" className={COLUMN_CONFIG.find(c => c.key === 'version')?.responsiveClass} style={{ width: '120px' }}>Version</SortableHeader>
              )}
              {columnVisibility.region && (
                <SortableHeader field="region" className={COLUMN_CONFIG.find(c => c.key === 'region')?.responsiveClass} style={{ width: '120px' }}>Region</SortableHeader>
              )}
              {columnVisibility.lastSeen && (
                <SortableHeader field="lastSeen" style={{ width: '140px' }}>Last Seen</SortableHeader>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedNodes.map((node, index) => {
              // Calculate rank based on sorted order (not pagination)
              const globalRank = filteredAndSorted.findIndex(n => n.pubkey === node.pubkey) + 1;
              return (
                <tr
                key={node.pubkey}
                onClick={() => onSelectNode(node)}
                className={cn(
                  'hover:bg-secondary/50 cursor-pointer transition-colors',
                  'opacity-0 animate-fade-up'
                )}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
              >
                <td className="p-4">
                  <span className="text-sm font-semibold text-muted-foreground">
                    #{globalRank}
                  </span>
                </td>
                {columnVisibility.pubkey && (
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-foreground" title={node.pubkey}>
                        {shortenPubkey(node.pubkey)}
                      </code>
                      <CopyButton text={node.pubkey} />
                    </div>
                  </td>
                )}
                {columnVisibility.status && (
                  <td className="p-4">
                    <StatusBadge status={node.status} />
                  </td>
                )}
                {columnVisibility.healthScore && (
                  <td className="p-4">
                    <span className={cn(
                      'text-sm font-semibold',
                      (node.healthScore || 0) >= 90 ? 'text-primary' : (node.healthScore || 0) >= 75 ? 'text-warning' : 'text-destructive'
                    )}>
                      {node.healthScore ? node.healthScore.toFixed(1) : 'N/A'}
                    </span>
                  </td>
                )}
                {columnVisibility.tier && (
                  <td className={cn('p-4', COLUMN_CONFIG.find(c => c.key === 'tier')?.responsiveClass)}>
                    {node.tier && (
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        node.tier === 'Excellent' ? 'bg-primary/20 text-primary' :
                        node.tier === 'Good' ? 'bg-warning/20 text-warning' :
                        'bg-destructive/20 text-destructive'
                      )}>
                        {node.tier}
                      </span>
                    )}
                  </td>
                )}
                {columnVisibility.storageUsed && (
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                          {node.storageTotal > 0 && (
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                calculatePercentage(node.storageUsed, node.storageTotal) > 80
                                  ? 'bg-destructive'
                                  : calculatePercentage(node.storageUsed, node.storageTotal) > 60
                                  ? 'bg-warning'
                                  : 'bg-primary'
                              )}
                              style={{ width: `${Math.min(100, calculatePercentage(node.storageUsed, node.storageTotal))}%` }}
                            />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {node.storageTotal > 0 
                            ? `${calculatePercentage(node.storageUsed, node.storageTotal, 0).toFixed(0)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatStorage(node.storageUsed)} / {formatStorage(node.storageTotal)}
                      </span>
                    </div>
                  </td>
                )}
                {columnVisibility.storageUtilization && (
                  <td className={cn('p-4', COLUMN_CONFIG.find(c => c.key === 'storageUtilization')?.responsiveClass)}>
                    <span className="text-sm text-muted-foreground">
                      {node.storageUtilization !== undefined 
                        ? `${node.storageUtilization.toFixed(1)}%`
                        : node.storageTotal > 0
                        ? `${calculatePercentage(node.storageUsed, node.storageTotal, 1)}%`
                        : 'N/A'}
                    </span>
                  </td>
                )}
                {columnVisibility.ramUsed && (
                  <td className="p-4">
                    {(() => {
                      const ramData = nodeRamData.get(node.pubkey);
                      if (!ramData || ramData.total === 0) {
                        return <span className="text-sm text-muted-foreground">-</span>;
                      }
                      const ramUtilization = (ramData.used / ramData.total) * 100;
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  ramUtilization > 80
                                    ? 'bg-destructive'
                                    : ramUtilization > 60
                                    ? 'bg-warning'
                                    : 'bg-primary'
                                )}
                                style={{ width: `${Math.min(100, ramUtilization)}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {ramUtilization.toFixed(0)}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatStorage(ramData.used)} / {formatStorage(ramData.total)}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                )}
                {columnVisibility.ramUtilization && (
                  <td className={cn('p-4', COLUMN_CONFIG.find(c => c.key === 'ramUtilization')?.responsiveClass)}>
                    {(() => {
                      const ramData = nodeRamData.get(node.pubkey);
                      if (!ramData || ramData.total === 0) {
                        return <span className="text-sm text-muted-foreground">-</span>;
                      }
                      const ramUtilization = (ramData.used / ramData.total) * 100;
                      return (
                        <span className="text-sm text-muted-foreground">
                          {ramUtilization.toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                )}
                {columnVisibility.version && (
                  <td className={cn('p-4', COLUMN_CONFIG.find(c => c.key === 'version')?.responsiveClass)}>
                    <span className="text-sm text-muted-foreground">{node.version}</span>
                  </td>
                )}
                {columnVisibility.region && (
                  <td className={cn('p-4', COLUMN_CONFIG.find(c => c.key === 'region')?.responsiveClass)}>
                    <span className="text-sm text-muted-foreground">{node.region}</span>
                  </td>
                )}
                {columnVisibility.lastSeen && (
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">{formatRelativeTime(node.lastSeen)}</span>
                  </td>
                )}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-muted-foreground">No nodes found matching your criteria</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={cn(
                    'cursor-pointer',
                    currentPage === 1 && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={cn(
                    'cursor-pointer',
                    currentPage === totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
