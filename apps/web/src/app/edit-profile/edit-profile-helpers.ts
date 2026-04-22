export const avatarOptions = [
  "/legacy/images/mascot/mouse-main.png",
  "/legacy/images/mascot/mouse-happy.png",
  "/legacy/images/mascot/mouse-casual.png",
  "/legacy/images/mascot/mouse-cute.png",
  "/legacy/images/mascot/mouse-sunny.png",
  "/legacy/images/mascot/mouse-reserved.png",
  "/legacy/images/mascot/mouse-excited.png",
];

export const defaultSignature = "零食是生活的甜味剂，竞猜是人生的小确幸。🍬✨";

export const levelSteps = [
  { lv: 1, title: "新手猜友", icon: "🌱", xpNeed: 100, perks: ["参与竞猜", "基础点赞评论"] },
  { lv: 2, title: "初级猜手", icon: "🌿", xpNeed: 300, perks: ["发布动态", "创建2选项竞猜"] },
  { lv: 3, title: "进阶猜手", icon: "🌳", xpNeed: 600, perks: ["好友PK功能", "每日3次免费竞猜"] },
  { lv: 4, title: "资质猜手", icon: "⭐", xpNeed: 1000, perks: ["创建3选项竞猜", "评论置顶特权"] },
  { lv: 5, title: "优秀猜手", icon: "🌟", xpNeed: 1500, perks: ["自定义头像框", "专属昵称颜色"] },
  { lv: 6, title: "精英猜手", icon: "💫", xpNeed: 2000, perks: ["创建品牌竞猜", "每日5次免费竞猜"] },
  { lv: 7, title: "高级猜手", icon: "🔥", xpNeed: 2500, perks: ["申请品牌授权", "数据分析面板"] },
  { lv: 8, title: "资深猜手", icon: "🏆", xpNeed: 3000, perks: ["开通店铺", "竞猜手续费减免20%"] },
  { lv: 9, title: "大师猜手", icon: "👑", xpNeed: 4000, perks: ["置顶推荐位", "手续费减免30%"] },
  { lv: 10, title: "传奇猜手", icon: "🏅", xpNeed: 5000, perks: ["专属传奇标识", "全部特权", "手续费减免50%"] },
] as const;

export const xpRules = [
  { action: "参与竞猜", xp: 10, icon: "🎯" },
  { action: "竞猜猜中", xp: 30, icon: "✅" },
  { action: "PK对战胜利", xp: 25, icon: "⚔️" },
  { action: "发布动态", xp: 15, icon: "📝" },
  { action: "获得点赞", xp: 2, icon: "❤️" },
  { action: "每日签到", xp: 5, icon: "📅" },
  { action: "邀请好友", xp: 50, icon: "🤝" },
  { action: "首次购买商品", xp: 20, icon: "🛒" },
] as const;

export const cityOptions = ["北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京", "重庆", "西安", "长沙", "苏州"];

export const genderOptions = [
  { key: "male", label: "男", icon: "fa-solid fa-mars" },
  { key: "female", label: "女", icon: "fa-solid fa-venus" },
  { key: "other", label: "保密" },
] as const;

export const worksPrivacyOptions = [
  { key: "all", label: "所有人" },
  { key: "friends", label: "好友" },
  { key: "me", label: "仅自己" },
] as const;

export const favPrivacyOptions = [
  { key: "all", label: "所有人" },
  { key: "me", label: "仅自己" },
] as const;

export type GenderSelection = "female" | "male" | "other";
export type WorksPrivacy = "all" | "friends" | "me";
export type FavPrivacy = "all" | "me";
export type SheetType = "avatar" | "birthday" | "location" | null;

