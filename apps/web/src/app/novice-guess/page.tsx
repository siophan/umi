import { LegacyPage } from '../../components/legacy-page';

export default function NoviceGuessPage() {
  return (
    <LegacyPage
      title="新手竞猜"
      eyebrow="NOVICE QUEST"
      heroDesc="对应老系统新手引导竞猜页，先保留首猜福利、挑战流程和奖励结果的视觉承载。"
      heroTitle="送你一次免费竞猜"
      stats={[
        { value: '0 元', label: '首猜成本' },
        { value: '24h', label: '奖励有效期' },
        { value: '3 步', label: '完成引导' },
      ]}
      listItems={[
        { icon: 'fa-solid fa-gift', title: '新手免费券', desc: '首次参与竞猜完全免费', gradient: 'linear-gradient(135deg,#FF9800,#FF5722)' },
        { icon: 'fa-solid fa-trophy', title: '挑战奖励', desc: '猜中入仓、猜错补券、逐步解锁', gradient: 'linear-gradient(135deg,#FFCA28,#FF8F00)' },
        { icon: 'fa-solid fa-box-open', title: '战利品展示', desc: '完成后跳转仓库或继续挑战', gradient: 'linear-gradient(135deg,#66BB6A,#43A047)' },
      ]}
      listTitle="引导模块"
    />
  );
}
