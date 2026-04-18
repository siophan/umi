import { LegacyPage } from '../../components/legacy-page';

export default function FeaturesPage() {
  return (
    <LegacyPage
      title="全部功能"
      eyebrow="ALL FEATURES"
      heroDesc="用户端静态功能总览，先按老系统的功能中心风格组织入口，后续再逐个接真实业务。"
      heroTitle="优米用户端全部功能"
      stats={[
        { value: '41', label: '静态页面' },
        { value: '12', label: '核心功能组' },
        { value: 'UI First', label: '当前阶段' },
      ]}
      gridItems={[
        { icon: 'fa-solid fa-store', label: '我的店铺', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
        { icon: 'fa-solid fa-warehouse', label: '我的仓库', gradient: 'linear-gradient(135deg,#42A5F5,#1E88E5)' },
        { icon: 'fa-solid fa-receipt', label: '我的订单', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
        { icon: 'fa-solid fa-chart-pie', label: '我的竞猜', gradient: 'linear-gradient(135deg,#AB47BC,#8E24AA)' },
        { icon: 'fa-solid fa-ticket', label: '优惠券', gradient: 'linear-gradient(135deg,#FF7043,#E64A19)' },
        { icon: 'fa-solid fa-user-plus', label: '邀请好友', gradient: 'linear-gradient(135deg,#EF5350,#E53935)' },
        { icon: 'fa-solid fa-calendar-check', label: '每日签到', gradient: 'linear-gradient(135deg,#26C6DA,#00ACC1)' },
        { icon: 'fa-solid fa-certificate', label: '品牌授权', gradient: 'linear-gradient(135deg,#FFC107,#FFA000)' },
      ]}
      gridTitle="常用入口"
      listItems={[
        { icon: 'fa-solid fa-comments', title: '聊天中心', desc: '消息列表、私聊、系统会话', gradient: 'linear-gradient(135deg,#7E57C2,#5E35B1)' },
        { icon: 'fa-solid fa-ranking-star', title: '排行榜', desc: '竞猜达人榜、连胜榜、胜率榜', gradient: 'linear-gradient(135deg,#FFCA28,#FF8F00)' },
        { icon: 'fa-solid fa-coins', title: '积分与奖励', desc: '签到奖励、竞猜奖励、权益补偿', gradient: 'linear-gradient(135deg,#FF8A65,#D84315)' },
      ]}
      listTitle="扩展功能"
    />
  );
}
