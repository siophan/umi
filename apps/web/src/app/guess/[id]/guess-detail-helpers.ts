import type { GuessSummary } from '@umi/shared';

export const shareChannels = [
  { label: '微信', icon: 'fa-brands fa-weixin', color: '#07C160' },
  { label: '朋友圈', icon: 'fa-solid fa-sun', color: '#FF6F00' },
  { label: 'QQ', icon: 'fa-brands fa-qq', color: '#12B7F5' },
  { label: '复制链接', icon: 'fa-solid fa-link', color: 'rgba(255,255,255,0.08)' },
] as const;

export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function formatEndTime(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return '结束时间待确认';
  }
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
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
  if (guess.status === 'draft') {
    return '草稿';
  }
  return '进行中';
}

