import { Player } from '../types';

export interface StalenessInfo {
  days: number;
  isStale: boolean; // >= 14 days
  isCritical: boolean; // >= 30 days
  level: 'fresh' | 'warning' | 'critical';
  statusText: string;
  badgeColor: string;
}

export const getStalenessInfo = (updatedAt?: string): StalenessInfo => {
  if (!updatedAt) {
    return {
      days: 999,
      isStale: true,
      isCritical: true,
      level: 'critical',
      statusText: 'STALE DATA (>30d)',
      badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-500/50',
    };
  }

  const lastDate = new Date(updatedAt).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - lastDate);
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days >= 30) {
    return {
      days,
      isStale: true,
      isCritical: true,
      level: 'critical',
      statusText: `STALE (${days}d ago)`,
      badgeColor: 'bg-rose-950/80 text-rose-400 border-rose-500/50',
    };
  }

  if (days >= 14) {
    return {
      days,
      isStale: true,
      isCritical: false,
      level: 'warning',
      statusText: `OUTDATED (${days}d ago)`,
      badgeColor: 'bg-amber-950/80 text-amber-400 border-amber-500/50',
    };
  }

  return {
    days,
    isStale: false,
    isCritical: false,
    level: 'fresh',
    statusText: days === 0 ? 'FRESH (Today)' : `FRESH (${days}d ago)`,
    badgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50',
  };
};

export const formatDaysAgo = (updatedAt?: string): string => {
  if (!updatedAt) return 'Never updated';
  const info = getStalenessInfo(updatedAt);
  if (info.days === 0) return 'Today';
  if (info.days === 1) return 'Yesterday';
  return `${info.days} days ago`;
};

export const generateOutdatedPowerReport = (players: Player[]): string => {
  const outdated = players
    .map(p => ({ player: p, info: getStalenessInfo(p.updatedAt) }))
    .filter(item => item.info.isStale && item.player.active)
    .sort((a, b) => b.info.days - a.info.days);

  if (outdated.length === 0) {
    return `✅ ALL ALLIANCE COMMANDERS ARE UP TO DATE! All active profiles updated within 14 days.`;
  }

  let report = `📢 **ASN1 POWER AUDIT - ACTION REQUIRED**\n`;
  report += `The following **${outdated.length} Commanders** have outdated power records on the website. Please log in and update your First Squad Power before the next Desert Storm / Alliance Events!\n\n`;

  outdated.forEach(({ player, info }) => {
    const icon = info.isCritical ? '🚨' : '⚠️';
    const pwr = (player.firstSquadPower / 1000000).toFixed(1) + 'M';
    report += `${icon} **${player.name}** (${pwr}) - Last updated: ${info.days} days ago\n`;
  });

  report += `\n🔗 *Update your power now on the website via Profile Update or Desert Storm Application!*`;
  return report;
};
