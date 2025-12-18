export function formatBytes(bytes: number): string {
  if (bytes === 0 || bytes < 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  
  const i = bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
  const unitIndex = Math.min(i, sizes.length - 1);
  const value = bytes / Math.pow(k, unitIndex);
  
  let decimals = 2;
  if (unitIndex === 0) decimals = 0;
  else if (unitIndex <= 2) decimals = 1;
  else if (unitIndex <= 4) decimals = 2;
  else decimals = 3;
  
  return value.toFixed(decimals) + " " + sizes[unitIndex];
}

export const formatStorage = formatBytes;

export function calculatePercentage(part: number, total: number, decimals: number = 2): number {
  if (total === 0) return 0;
  if (part < 0 || total < 0) return 0;
  
  const percentage = (part / total) * 100;
  const multiplier = Math.pow(10, decimals);
  return Math.round(percentage * multiplier) / multiplier;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (value < 0) value = 0;
  if (value > 100) value = 100;
  return `${value.toFixed(decimals)}%`;
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const seconds = Math.floor((Date.now() - dateObj.getTime()) / 1000);
  if (seconds < 0) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function shortenPubkey(pubkey: string, startChars: number = 4, endChars: number = 4): string {
  if (!pubkey || pubkey.length <= startChars + endChars) {
    return pubkey;
  }
  return `${pubkey.substring(0, startChars)}..${pubkey.substring(pubkey.length - endChars)}`;
}

