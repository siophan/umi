import type { GuessSummary } from '@umi/shared';

export const shareChannels = [
  { label: '微信', icon: 'fa-brands fa-weixin', color: '#07C160' },
  { label: '朋友圈', icon: 'fa-solid fa-sun', color: '#FF6F00' },
  { label: 'QQ', icon: 'fa-brands fa-qq', color: '#12B7F5' },
  { label: '复制链接', icon: 'fa-solid fa-link', color: 'rgba(255,255,255,0.08)' },
] as const;

const TOPIC_BADGE_MAP: Record<string, string> = {
  体育: '🏆 赛事解读',
  财经: '📈 行情分析',
  娱乐: '🌟 热点聚焦',
  影视: '🎬 影视速递',
  科技: '🔬 科技前沿',
  游戏: '🎮 游戏情报',
  电竞: '⚡ 电竞资讯',
  社会: '📊 社会洞察',
  天气: '🌤 气象预报',
  出行: '🚗 出行指南',
};

export function getTopicBadge(category: string | null | undefined): string {
  if (!category) return '深度解读';
  return TOPIC_BADGE_MAP[category] || '深度解读';
}

export function getDaysToEnd(iso: string, now: number = Date.now()): number {
  const t = new Date(iso).getTime() - now;
  if (Number.isNaN(t)) return 1;
  return Math.max(1, Math.ceil(t / (3600000 * 24)));
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function getGuessStatusText(guess: GuessSummary) {
  if (guess.reviewStatus === 'pending') {
    return '待审核';
  }
  if (guess.reviewStatus === 'rejected') {
    return '审核未通过';
  }
  if (guess.status === 'settled') {
    return '已开奖';
  }
  if (guess.status === 'cancelled') {
    return '已取消';
  }
  if (guess.status === 'abandoned') {
    return '已流标';
  }
  if (guess.status === 'pending_settle') {
    return '待揭晓';
  }
  if (guess.status === 'draft') {
    return '草稿';
  }
  return '进行中';
}

