'use client';

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  winrate: number;
};

export type Group = {
  id: string;
  name: string;
  initials: string;
  bg: string;
  members: number;
  desc: string;
};

export const topics = [
  { emoji: '🍔', name: '今晚吃啥', title: '今晚吃什么？', a: '火锅', b: '烧烤' },
  { emoji: '🎬', name: '看什么片', title: '周末看什么电影？', a: '科幻片', b: '喜剧片' },
  { emoji: '⚽', name: '谁会赢', title: '今晚比赛谁赢？', a: '主队', b: '客队' },
  { emoji: '🎮', name: '游戏PK', title: '谁是游戏王？', a: '我赢', b: '你赢' },
  { emoji: '☀️', name: '明天天气', title: '明天会下雨吗？', a: '晴天', b: '下雨' },
  { emoji: '🧋', name: '奶茶之选', title: '哪杯奶茶更好喝？', a: '杨枝甘露', b: '珍珠奶茶' },
  { emoji: '✈️', name: '旅行目的地', title: '下次旅行去哪？', a: '海边', b: '山里' },
  { emoji: '📱', name: '数码之争', title: '该买哪个？', a: '苹果', b: '安卓' },
] as const;

export const stakeOptions = [
  '🧋 请一杯奶茶',
  '🍕 请吃一顿',
  '🧧 发个红包',
  '💪 做20个俯卧撑',
  '📢 发条朋友圈',
  '🎤 唱首歌',
] as const;

export const friends: Friend[] = [
  { id: 'f1', name: '小米', avatar: '/legacy/images/mascot/mouse-main.png', status: 'online', winrate: 67 },
  { id: 'f2', name: '阿星', avatar: '/legacy/images/mascot/mouse-happy.png', status: 'online', winrate: 54 },
  { id: 'f3', name: '雨桐', avatar: '/legacy/images/mascot/mouse-casual.png', status: 'offline', winrate: 72 },
  { id: 'f4', name: '凯文', avatar: '/legacy/images/mascot/mouse-cute.png', status: 'offline', winrate: 49 },
  { id: 'f5', name: 'Luna', avatar: '/legacy/images/mascot/mouse-sunny.png', status: 'online', winrate: 63 },
  { id: 'f6', name: 'Milo', avatar: '/legacy/images/mascot/mouse-reserved.png', status: 'offline', winrate: 58 },
  { id: 'f7', name: 'Coco', avatar: '/legacy/images/mascot/mouse-excited.png', status: 'online', winrate: 71 },
];

export const groups: Group[] = [
  { id: 'grp1', name: '吃货研究所', initials: 'CH', bg: '#FF9800', members: 128, desc: '美食爱好者聚集地' },
  { id: 'grp2', name: '办公室摸鱼群', initials: 'MY', bg: '#4CAF50', members: 56, desc: '上班划水好伙伴' },
  { id: 'grp3', name: '周末玩什么', initials: 'WK', bg: '#2196F3', members: 89, desc: '周末活动策划组' },
];
